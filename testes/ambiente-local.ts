import { execSync } from "node:child_process";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * As credenciais do Supabase local, lidas do próprio CLI.
 *
 * Lidas em vez de escritas à mão porque o `supabase start` gera as chaves e
 * as portas do ambiente — e as portas deste projeto foram deslocadas para a
 * faixa 545xx, já que a 54322 pertence a outro projeto rodando na mesma
 * máquina. Chumbar valores aqui quebraria no primeiro `supabase stop/start`
 * de outra pessoa, com um erro que não explica nada.
 */
export interface AmbienteLocal {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
}

export function lerAmbienteLocal(): AmbienteLocal {
  let bruto: string;
  try {
    bruto = execSync("supabase status -o json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "O Supabase local não está rodando. Suba com `supabase start` antes " +
        "de rodar os testes — o teste de vazamento precisa de um Postgres " +
        "de verdade, com as policies aplicadas. Testar RLS contra mock não " +
        "testa nada.",
    );
  }

  const status = JSON.parse(bruto) as Record<string, string>;
  return {
    url: status.API_URL!,
    anonKey: status.ANON_KEY!,
    serviceRoleKey: status.SERVICE_ROLE_KEY!,
    jwtSecret: status.JWT_SECRET!,
  };
}

/**
 * Põe as credenciais locais no ambiente do processo.
 *
 * O código de produção lê tudo de `process.env`, e é justamente esse código
 * que queremos exercitar. Injetar um client pronto no teste testaria um
 * caminho que não existe em produção.
 */
export function aplicarAmbienteLocal(): AmbienteLocal {
  const ambiente = lerAmbienteLocal();
  process.env.NEXT_PUBLIC_SUPABASE_URL = ambiente.url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ambiente.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = ambiente.serviceRoleKey;
  process.env.SUPABASE_JWT_SECRET = ambiente.jwtSecret;
  return ambiente;
}

/**
 * Deixa uma conta de teste em estado de uso normal: assinatura paga e módulos
 * ligados.
 *
 * As DUAS coisas, porque faltar qualquer uma dá o mesmo sintoma — a conta cai
 * no teto do gratuito — e por motivos diferentes:
 *
 * A trigger `handle_new_user` cria a EMPRESA no cadastro, mas a assinatura só
 * nasce ao concluir o onboarding. Sem ela, `planoEfetivo(null)` devolve o
 * gratuito.
 *
 * E `empresas.modulos_ativos` nasce vazio de propósito: escolher módulo é
 * passo do onboarding. Sem eles, a interseção com o teto do plano dá vazio.
 *
 * Isso já fez teste passar pelo motivo errado: verificava "conta gratuita não
 * usa a IA" quando a conta não era gratuita, era incompleta — e ficaria verde
 * mesmo com o teto do plano quebrado.
 */
export async function prepararContaCompleta(
  service: SupabaseClient<Database>,
  empresaId: string,
  assinatura: Partial<
    Database["public"]["Tables"]["assinaturas"]["Insert"]
  > = {},
) {
  const daquiUmMes = new Date();
  daquiUmMes.setMonth(daquiUmMes.getMonth() + 1);

  await service.from("assinaturas").insert({
    empresa_id: empresaId,
    status: "ativa",
    plano: "pro",
    valor_mensal: 39,
    proxima_cobranca: daquiUmMes.toISOString(),
    ...assinatura,
  });

  await service
    .from("empresas")
    .update({
      modulos_ativos: ["financeiro", "agenda", "clientes", "estoque", "ia"],
    })
    .eq("id", empresaId);
}
