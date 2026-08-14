import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin } from "@/lib/admin";

/**
 * Suspende ou reativa uma conta.
 *
 * Suspender bloqueia o acesso na hora (o middleware checa `suspensa_em` antes
 * de qualquer outro gate) sem encostar na assinatura nem apagar nada. É a
 * ação reversível — quem quiser tirar a pessoa em definitivo usa o DELETE.
 */
const MOTIVO_MAX = 500;

export async function PATCH(
  request: Request,
  { params }: { params: { empresaId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 404 e não 403: confirmar que a rota existe já entrega que há um painel.
  if (!(await ehAdmin(user?.id))) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const suspender = body?.suspender;

  if (typeof suspender !== "boolean") {
    return NextResponse.json(
      { error: "Envie suspender: true ou false." },
      { status: 400 },
    );
  }

  const motivoBruto = typeof body?.motivo === "string" ? body.motivo.trim() : "";
  if (motivoBruto.length > MOTIVO_MAX) {
    return NextResponse.json(
      { error: `O motivo passa de ${MOTIVO_MAX} caracteres.` },
      { status: 400 },
    );
  }
  // Motivo só faz sentido ao suspender; reativar limpa os dois campos para a
  // conta não carregar a anotação de uma suspensão que já foi desfeita.
  const motivo = suspender ? motivoBruto || null : null;

  const service = createServiceClient();

  const { data: antes, error: erroLeitura } = await service
    .from("empresas")
    .select("id, nome, user_id, suspensa_em, suspensa_motivo")
    .eq("id", params.empresaId)
    .maybeSingle();

  if (erroLeitura || !antes) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  // Um admin suspendendo a própria conta se tranca pra fora do painel, e a
  // única saída seria mexer no banco na mão.
  if (suspender && antes.user_id === user!.id) {
    return NextResponse.json(
      { error: "Você não pode suspender a própria conta." },
      { status: 400 },
    );
  }

  const suspensaEm = suspender ? new Date().toISOString() : null;

  const { error: erroEscrita } = await service
    .from("empresas")
    .update({ suspensa_em: suspensaEm, suspensa_motivo: motivo })
    .eq("id", params.empresaId);

  if (erroEscrita) {
    console.error("Erro ao mudar suspensão no painel admin:", erroEscrita);
    return NextResponse.json(
      { error: "Não consegui salvar." },
      { status: 500 },
    );
  }

  const { error: erroAuditoria } = await service.from("admin_auditoria").insert({
    admin_user_id: user!.id,
    admin_email: user!.email ?? null,
    empresa_id: antes.id,
    empresa_nome: antes.nome,
    acao: suspender ? "conta_suspensa" : "conta_reativada",
    valor_antes: {
      suspensa_em: antes.suspensa_em,
      suspensa_motivo: antes.suspensa_motivo,
    },
    valor_depois: { suspensa_em: suspensaEm, suspensa_motivo: motivo },
  });

  if (erroAuditoria) {
    console.error("Suspensão salva, mas a auditoria falhou:", erroAuditoria);
  }

  return NextResponse.json({ suspensa_em: suspensaEm, suspensa_motivo: motivo });
}
