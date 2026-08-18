import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin } from "@/lib/admin";

/**
 * O que aconteceu no produto nas últimas horas.
 *
 * A checagem de admin é REFEITA aqui, e não herdada: `app/admin/layout.tsx`
 * protege a navegação, mas uma chamada direta a esta URL nunca passa por
 * layout nenhum.
 *
 * Devolve duas coisas: a contagem por tipo, que responde "está tudo de pé?",
 * e as últimas linhas, que respondem "o que exatamente quebrou?". Sem a
 * contagem seria preciso ler cem linhas para perceber que nenhum cadastro
 * passou; sem as linhas, saber que dez falharam não diz por quê.
 */

/** Janela padrão. Um dia cobre "e ontem à noite?" sem virar relatório. */
const HORAS_PADRAO = 24;

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    // 404 e não 403: 403 confirmaria que a rota existe.
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const pedido = Number(new URL(request.url).searchParams.get("horas"));
  const horas = Number.isFinite(pedido) && pedido > 0 && pedido <= 720
    ? pedido
    : HORAS_PADRAO;

  const desde = new Date(Date.now() - horas * 3600_000).toISOString();
  const service = createServiceClient();

  const { data, error } = await service
    .from("eventos")
    .select("id, tipo, detalhe, created_at")
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Erro ao listar eventos no painel admin:", error);
    return NextResponse.json(
      { error: "Não consegui carregar os eventos." },
      { status: 500 },
    );
  }

  const eventos = data ?? [];
  const contagem: Record<string, number> = {};
  for (const e of eventos) {
    contagem[e.tipo] = (contagem[e.tipo] ?? 0) + 1;
  }

  return NextResponse.json({ horas, contagem, eventos });
}
