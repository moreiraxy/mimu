#!/usr/bin/env node
/*
 * Troca o endereço público da Mimu em todo lugar que não lê de variável.
 *
 *   node scripts/trocar-dominio.mjs mimu.duckdns.org
 *
 * POR QUE ISTO EXISTE. O endereço aparece em 19 lugares, e três deles não têm
 * como ler variável de ambiente: os e-mails que o Supabase envia (HTML colado
 * no painel deles), a landing page estática, e as tarefas agendadas que vivem
 * DENTRO do banco. Trocar na mão significa esquecer um — e o esquecido costuma
 * ser o e-mail de recuperação de senha, que só falha no dia em que alguém
 * precisa dele, com a imagem quebrada e o link apontando para um site morto.
 *
 * O que o script NÃO faz, de propósito: nada que exija login em painel de
 * terceiro. Esses casos ele lista no fim, para você fazer com os olhos.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const novo = process.argv[2];

if (!novo) {
  console.error("\nFalta o domínio novo.\n");
  console.error("  node scripts/trocar-dominio.mjs mimu.duckdns.org\n");
  process.exit(1);
}

/*
 * Recusa o que não é domínio antes de reescrever 19 arquivos.
 *
 * Colar `https://mimu.com.br/` por engano produziria `https://https://...` em
 * cada ocorrência — e como o script é o que a gente confia para não esquecer
 * nada, ele não pode ser a origem do estrago.
 */
if (/^https?:\/\//.test(novo) || novo.includes("/")) {
  console.error("\nSó o domínio, sem https:// e sem barra.\n");
  console.error(`  errado: ${novo}`);
  console.error(`  certo:  ${novo.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}\n`);
  process.exit(1);
}

if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(novo)) {
  console.error(`\n"${novo}" não parece um domínio.\n`);
  process.exit(1);
}

const ANTIGO = "mimu.up.railway.app";

if (novo === ANTIGO) {
  console.error("\nEsse já é o domínio atual. Nada a fazer.\n");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Os arquivos que o script reescreve sozinho
// ---------------------------------------------------------------------------

const alvos = [
  ".env.production",
  "capacitor.config.ts",
  "site-mimo/index.html",
  ...readdirSync("supabase/emails")
    .filter((f) => f.endsWith(".html"))
    .map((f) => join("supabase/emails", f)),
];

let totalTrocas = 0;
const mexidos = [];

for (const arquivo of alvos) {
  if (!existsSync(arquivo)) continue;

  const antes = readFileSync(arquivo, "utf8");
  const ocorrencias = antes.split(ANTIGO).length - 1;
  if (ocorrencias === 0) continue;

  writeFileSync(arquivo, antes.replaceAll(ANTIGO, novo), "utf8");
  totalTrocas += ocorrencias;
  mexidos.push(`  ${arquivo} (${ocorrencias})`);
}

// ---------------------------------------------------------------------------
// As tarefas agendadas vivem no banco, não no arquivo
// ---------------------------------------------------------------------------
//
// Reescrever a migration antiga não muda nada: ela JÁ RODOU, e o agendamento
// gravado no banco continua chamando o endereço velho. Editar o arquivo daria
// a impressão de resolvido e deixaria as duas tarefas batendo num site morto —
// silenciosamente, porque tarefa agendada que falha não avisa ninguém.
//
// Por isso nasce uma migration NOVA. As duas usam `unschedule` antes de
// `schedule`, então reagendar com o endereço novo é seguro.

const carimbo = new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14);

const migration = `supabase/migrations/${carimbo}_dominio_${novo.replace(/\W/g, "_")}.sql`;

writeFileSync(
  migration,
  `-- As tarefas agendadas passam a chamar ${novo}.
--
-- O endereço do site mudou. As duas tarefas abaixo foram criadas com o
-- endereço antigo GRAVADO dentro delas — editar a migration original não
-- mudaria nada, porque ela já rodou. Elas continuariam batendo num site morto,
-- e sem avisar: tarefa agendada que falha não reclama com ninguém.

select cron.unschedule('mimu-saude')
where exists (select 1 from cron.job where jobname = 'mimu-saude');

select cron.schedule(
  'mimu-saude',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://${novo}/api/cron/saude',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'mimu_cron_secret'),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

select cron.unschedule('mimu-alertas-diarios')
where exists (select 1 from cron.job where jobname = 'mimu-alertas-diarios');

-- Horário e timeout copiados da migration original (20260815120000): 20h, e
-- 120 segundos porque este varre todas as empresas, não uma chamada só.
-- Reagendar com valores "arredondados" mudaria a hora do aviso das clientes
-- sem ninguém pedir.
select cron.schedule(
  'mimu-alertas-diarios',
  '0 20 * * *',
  $$
  select net.http_post(
    url := 'https://${novo}/api/cron/alertas-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'mimu_cron_secret'),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
`,
  "utf8",
);

// ---------------------------------------------------------------------------
// O relatório
// ---------------------------------------------------------------------------

console.log(`\n${ANTIGO}  →  ${novo}\n`);
console.log(`Reescritos (${totalTrocas} ocorrências):`);
console.log(mexidos.join("\n"));
console.log(`\nMigration criada:\n  ${migration}`);

console.log(`
────────────────────────────────────────────────────────────
O QUE O SCRIPT NÃO PODE FAZER — precisa de você
────────────────────────────────────────────────────────────

1. A VARIÁVEL DO SERVIDOR
   NEXT_PUBLIC_APP_URL=https://${novo}
   Ela é lida na hora do build, não em execução: sem um deploy novo
   depois de trocar, o site continua se anunciando pelo endereço velho.

2. OS E-MAILS, NO PAINEL DO SUPABASE
   Authentication → Emails. Os arquivos de supabase/emails/ já estão
   corrigidos aqui, mas o Supabase guarda uma CÓPIA — o que vale é o que
   está colado lá. Enquanto não colar, o e-mail de recuperação de senha
   sai com imagem quebrada e link morto.

3. O WEBHOOK DO MERCADO PAGO
   https://${novo}/api/pagamento/webhook
   Sem isso, pagamento aprovado não libera acesso: a pessoa paga e
   continua vendo a tela de cobrança.

4. A MIGRATION
   Aplicar em produção, ou as tarefas agendadas seguem no endereço velho.

5. O APP DO IPHONE
   O endereço fica gravado dentro do aplicativo instalado. Se ele já
   estiver na App Store, isto exige nova versão e nova revisão da Apple —
   e quem não atualizar fica com uma tela branca.
`);
