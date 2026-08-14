import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin } from "@/lib/admin";

/**
 * Exclui uma conta em definitivo.
 *
 * Apaga o usuário do auth, e a partir daí o cascade leva tudo: empresa,
 * clientes, transações, agendamentos, conversas. Não tem volta e não tem
 * backup dentro do produto.
 *
 * Por ser irreversível, exige que o painel mande de volta o nome exato do
 * negócio. Não é segurança (quem chega aqui já provou ser admin) — é o
 * mesmo travamento do GitHub ao apagar um repositório: obriga a ler o que
 * está prestes a sumir, e transforma um clique errado numa ação deliberada.
 *
 * O que sobrevive é o registro em `cancelamentos`, gravado pelo trigger
 * antes da linha da empresa sumir: sem contato, só métrica de saída.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { empresaId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const confirmacao = typeof body?.confirmacao === "string" ? body.confirmacao : "";

  const service = createServiceClient();

  const { data: conta, error: erroLeitura } = await service
    .from("empresas")
    .select("id, nome, user_id, tipo_negocio, created_at")
    .eq("id", params.empresaId)
    .maybeSingle();

  if (erroLeitura || !conta) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  // Um admin apagando a própria conta perderia o acesso ao painel junto.
  if (conta.user_id === user!.id) {
    return NextResponse.json(
      { error: "Você não pode excluir a própria conta." },
      { status: 400 },
    );
  }

  if (confirmacao.trim() !== conta.nome.trim()) {
    return NextResponse.json(
      { error: "Digite o nome do negócio exatamente como aparece." },
      { status: 400 },
    );
  }

  // Auditoria ANTES de apagar, e não depois: `conta` deixa de existir no
  // instante seguinte, e um log escrito depois não teria de onde tirar o
  // nome nem o e-mail. Se a exclusão falhar, sobra um registro de uma
  // exclusão que não houve — por isso o campo `acao` diz "solicitada", e o
  // par dela é o `cancelamentos`, que só é gravado se a linha sumir mesmo.
  const { error: erroAuditoria } = await service.from("admin_auditoria").insert({
    admin_user_id: user!.id,
    admin_email: user!.email ?? null,
    empresa_id: conta.id,
    empresa_nome: conta.nome,
    acao: "conta_excluida_solicitada",
    valor_antes: {
      nome: conta.nome,
      tipo_negocio: conta.tipo_negocio,
      entrou_em: conta.created_at,
    },
    valor_depois: null,
  });

  if (erroAuditoria) {
    console.error("Auditoria da exclusão falhou:", erroAuditoria);
  }

  // Apagar o usuário do auth é o que dispara o cascade. Fazer o contrário
  // (apagar a empresa) deixaria um login órfão, capaz de entrar e cair num
  // onboarding em branco.
  const { error: erroExclusao } = await service.auth.admin.deleteUser(
    conta.user_id,
  );

  if (erroExclusao) {
    console.error("Erro ao excluir conta no painel admin:", erroExclusao);
    return NextResponse.json(
      { error: "Não consegui excluir a conta." },
      { status: 500 },
    );
  }

  return NextResponse.json({ excluida: true, nome: conta.nome });
}
