import { createHmac } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { comIdentidade, type ClientComIdentidade } from "@/lib/supabase/identidade";
import type { Database } from "@/types/database";

/**
 * Um client do Supabase que age COMO uma usuária, sem ela estar logada.
 *
 * Existe por causa do WhatsApp, e é a decisão mais importante daquele canal.
 *
 * O RLS da Mimu inteiro se apoia em `auth.uid()`: as 21 tabelas usam
 * `user_owns_empresa(empresa_id)`, que compara `empresas.user_id` com quem
 * está logado. Uma mensagem de WhatsApp não tem sessão, então `auth.uid()`
 * volta nulo e nenhuma policy passa.
 *
 * O caminho fácil seria usar a service role, como as rotas de webhook fazem.
 * Só que a service role IGNORA o RLS: o isolamento entre clientes passaria a
 * depender de cada consulta lembrar do `.eq("empresa_id")`. Uma consulta nova
 * escrita sem o filtro devolveria o faturamento de todo mundo — sem erro, sem
 * exceção, sem log. Esse é o defeito que a gente não pode ter: silencioso,
 * caro, e descoberto pela cliente errada.
 *
 * Então em vez de desligar o RLS, a gente prova quem está falando. Assinamos
 * um token com a identidade da pessoa vinculada, e o banco trata a consulta
 * exatamente como trataria se ela estivesse no app. O isolamento passa a ser
 * garantido pelo Postgres, e não pela disciplina de quem escreve consulta.
 *
 * NUNCA use isto para atender uma requisição do navegador — ali já existe
 * sessão de verdade. É para canal sem login, depois de o vínculo ter sido
 * confirmado.
 */

/**
 * Quanto tempo o token vale.
 *
 * Curto porque ele existe para durar uma resposta. Não vai para o navegador,
 * não é guardado em lugar nenhum e é emitido de novo a cada mensagem: prazo
 * longo só aumentaria a janela de estrago caso um vazasse em log.
 */
const VALIDADE_SEGUNDOS = 60;

function base64url(dado: Buffer | string): string {
  return Buffer.from(dado)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Assina um JWT no formato que o Supabase espera.
 *
 * Escrito à mão, com node:crypto, em vez de trazer uma biblioteca: um JWT
 * assinado é base64url(cabeçalho).base64url(corpo).HMAC-SHA256 dos dois, e é
 * exatamente isso que está aqui. Não há parsing de entrada não confiável —
 * só ASSINAMOS, nunca verificamos token de terceiro — que é onde mora a parte
 * perigosa de mexer com JWT na mão. Erro de codificação aqui falha alto: o
 * Supabase recusa o token e a consulta devolve erro, em vez de passar batido.
 */
function assinarToken(userId: string, segredo: string): string {
  const agora = Math.floor(Date.now() / 1000);

  const cabecalho = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const corpo = base64url(
    JSON.stringify({
      // `sub` é o que vira `auth.uid()` no banco. É o campo inteiro.
      sub: userId,
      // Sem `role: authenticated` o Postgres atende como `anon`, e as policies
      // recusam tudo — o sintoma seria a Mimu dizer que não achou dado nenhum.
      role: "authenticated",
      aud: "authenticated",
      iat: agora,
      exp: agora + VALIDADE_SEGUNDOS,
    }),
  );

  const assinatura = base64url(
    createHmac("sha256", segredo).update(`${cabecalho}.${corpo}`).digest(),
  );

  return `${cabecalho}.${corpo}.${assinatura}`;
}

/**
 * Client agindo como `userId`. As policies valem como se ela estivesse no app.
 *
 * Estoura se o segredo não estiver configurado, e é proposital: sem ele a
 * única alternativa seria cair para a service role, que é justamente o que
 * este arquivo existe para evitar. Falhar alto na subida é melhor do que
 * atender com o isolamento desligado.
 */
export function createClientComoUsuario(userId: string): ClientComIdentidade {
  const segredo = process.env.SUPABASE_JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "SUPABASE_JWT_SECRET não configurado. Sem ele não há como responder " +
        "fora do app mantendo o RLS — e responder sem RLS não é opção. " +
        "O valor está em Project Settings → API → JWT Secret.",
    );
  }

  const token = assinarToken(userId, segredo);

  return comIdentidade(
    createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // A chave anônima continua sendo a chave do projeto; quem carrega a
    // identidade é o cabeçalho abaixo. É o mesmo par que o navegador manda.
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    ),
  );
}
