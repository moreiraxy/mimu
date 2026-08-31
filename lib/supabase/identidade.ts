import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

declare const IDENTIDADE: unique symbol;

/**
 * Um client do Supabase que carrega a identidade de uma pessoa de verdade.
 *
 * Existe para tornar IMPOSSÍVEL passar um client de service role para código
 * que lê dado de negócio.
 *
 * O problema que resolve: o RLS da Mimu se apoia em `auth.uid()`, e a service
 * role o ignora por completo. Uma função de leitura que receba um client
 * qualquer funciona com os dois — mas com a service role o isolamento entre
 * clientes passa a depender de cada consulta lembrar do `.eq("empresa_id")`.
 * Uma consulta nova sem o filtro devolveria o faturamento de todas as
 * empresas, sem erro e sem log. É o defeito que a seção 4.2 do brief chama de
 * silencioso, e ele é silencioso porque nada no código o impede.
 *
 * A marca é só de tipo: não existe em tempo de execução e não custa nada. O
 * que ela faz é obrigar quem chama a declarar, por escrito e num lugar
 * greppável, que aquele client tem identidade. `createServiceClient()` não
 * satisfaz o tipo, e passar um vira erro de compilação em vez de vazamento em
 * produção.
 *
 * Escolhida no lugar de um `auth.getUser()` por chamada, que era a ideia
 * anterior: aquilo custaria uma ida à rede por mensagem e só reclamaria depois
 * de o código já estar rodando. Esta pega antes de subir, de graça.
 */
export type ClientComIdentidade = SupabaseClient<Database> & {
  readonly [IDENTIDADE]: true;
};

/**
 * Declara que este client carrega a identidade de quem está pedindo.
 *
 * Chame APENAS onde isso é verdade:
 *   - o client de sessão do app (lib/supabase/server.ts), numa requisição
 *     autenticada
 *   - o client emitido por `createClientComoUsuario`
 *
 * Nunca sobre `createServiceClient()`. Esta função é o ponto único onde a
 * garantia passa a valer, e por isso cada chamada dela merece ser lida com
 * atenção numa revisão — são poucas, de propósito.
 */
export function comIdentidade(
  client: SupabaseClient<Database>,
): ClientComIdentidade {
  return client as ClientComIdentidade;
}
