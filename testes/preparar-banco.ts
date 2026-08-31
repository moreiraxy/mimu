import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Põe o banco local no estado de privilégios que a produção tem.
 *
 * PRECISA EXISTIR POR CAUSA DE UM DEFEITO DO REPOSITÓRIO: as migrations em
 * supabase/migrations/ não concedem privilégio de tabela a ninguém. Elas se
 * apoiam nos defaults que o Supabase aplica no projeto hospedado, e esses
 * defaults não estão versionados. Um banco construído só a partir das
 * migrations sai com as 22 tabelas inacessíveis até para `authenticated` — o
 * app não leria uma linha.
 *
 * Enquanto isso não for corrigido no lugar certo (uma migration declarando os
 * grants), este arquivo reproduz o estado esperado para o teste ter contra o
 * que rodar. Ele NÃO é um atalho do teste: sem isso, o teste de vazamento
 * passaria por motivo errado — ninguém enxerga nada, então nada vaza.
 *
 * Os revokes são relidos das próprias migrations em vez de copiados. São eles
 * que tornam o modelo mais estrito que o padrão do Supabase (a escrita
 * comercial fechada, por exemplo), e copiar a lista aqui garantiria que ela
 * ficasse velha na primeira vez que alguém acrescentasse um revoke lá.
 */

const PROJETO = "mimu";
const CONTAINER = `supabase_db_${PROJETO}`;
const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function executarSql(sql: string) {
  execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    { input: sql, stdio: ["pipe", "ignore", "pipe"] },
  );
}

/**
 * Aplica um revoke tolerando o objeto não existir mais.
 *
 * Acontece de verdade e é legítimo: `definir_segredo_cron` é criada na
 * migration 20260817020000 e removida na 20260817030000. O revoke dela
 * continua no arquivo antigo, que não se reescreve — e revogar privilégio de
 * algo que já não existe é o que ele queria dizer de qualquer forma.
 *
 * Só esse caso é tolerado. Qualquer outro erro sobe, porque significa que o
 * modelo de privilégios não ficou como as migrations mandam — e aí o teste
 * estaria rodando contra um banco que não é o nosso.
 */
function revogarTolerandoAusencia(revoke: string) {
  try {
    executarSql(revoke);
  } catch (erro) {
    const texto = String((erro as { stderr?: Buffer }).stderr ?? erro);
    if (!/does not exist/i.test(texto)) throw erro;
  }
}

/** Os revokes declarados nas migrations, na ordem em que aparecem. */
function revokesDasMigrations(): string[] {
  const revokes: string[] = [];
  for (const arquivo of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const conteudo = readFileSync(join(MIGRATIONS, arquivo), "utf8");
    for (const linha of conteudo.split("\n")) {
      const limpa = linha.trim();
      if (/^revoke\s/i.test(limpa)) revokes.push(limpa);
    }
  }
  return revokes;
}

export function prepararBancoLocal() {
  /*
   * Os grants padrão de um projeto Supabase.
   *
   * Amplos de propósito, e é assim que o Supabase funciona: quem isola é o
   * RLS, não o grant. Apertar aqui faria o teste de vazamento passar por
   * falta de permissão em vez de por isolamento — que é justamente o que ele
   * precisa distinguir.
   */
  executarSql(`
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    grant all on all functions in schema public to anon, authenticated, service_role;
  `);

  // Depois dos grants, para vencerem: são eles que definem o modelo real.
  for (const revoke of revokesDasMigrations()) revogarTolerandoAusencia(revoke);

  /*
   * Zera o rate limit antes da rodada.
   *
   * As linhas de `auth_rate_limit` sobrevivem entre execuções, e o teto do
   * vínculo é 5 por hora por número. Rodar os testes algumas vezes seguidas
   * esgotava a cota e derrubava testes que não tinham nada de errado — o
   * sintoma era "confirmarVinculo devolveu false" sem explicação.
   *
   * Vale só no banco local de teste. Não é limpeza de conveniência: é o
   * mesmo princípio de qualquer fixture, começar de um estado conhecido.
   */
  executarSql("truncate table public.auth_rate_limit;");
}
