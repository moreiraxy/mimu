import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MODULOS } from "@/lib/modulos";

/**
 * Liga e desliga módulo da própria empresa.
 *
 * Passou a existir porque `modulos_ativos` saiu do alcance do navegador: era
 * possível ligar todos os módulos, inclusive a Mimu, com um update pelo
 * console. Módulo é o que separa os planos, então quem decide é o servidor.
 *
 * A empresa NÃO vem no corpo da requisição. Ela é resolvida a partir da
 * sessão, senão bastaria mandar o id de outra pessoa para mexer na conta
 * dela.
 */

/** Todas as chaves que existem, montadas a partir dos cartões do produto. */
const CHAVES_VALIDAS = new Set(MODULOS.flatMap((m) => m.chaves));

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  const recebido = corpo?.modulos;

  if (!Array.isArray(recebido) || recebido.some((m) => typeof m !== "string")) {
    return NextResponse.json({ error: "Módulos inválidos." }, { status: 400 });
  }

  // Lista branca: o que não é chave conhecida não entra. Sem isto, dava para
  // gravar qualquer texto na coluna e o que vier depois lendo isso decide
  // sozinho o que fazer com lixo.
  const modulos = [...new Set(recebido as string[])].filter((m) =>
    CHAVES_VALIDAS.has(m as never),
  );

  if (modulos.length === 0) {
    return NextResponse.json(
      { error: "Deixe pelo menos um módulo ativo." },
      { status: 400 },
    );
  }

  // A empresa sai da sessão, e a atualização é escopada por ela duas vezes:
  // pelo id encontrado e pelo user_id. A segunda é redundante de propósito.
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  const { error } = await createServiceClient()
    .from("empresas")
    .update({ modulos_ativos: modulos })
    .eq("id", empresa.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao salvar módulos:", error);
    return NextResponse.json({ error: "Não consegui salvar." }, { status: 500 });
  }

  return NextResponse.json({ modulos });
}
