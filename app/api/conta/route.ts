import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { registrarEvento } from "@/lib/eventos";

/**
 * A pessoa apaga a PRÓPRIA conta.
 *
 * Existe por exigência da Apple: a diretriz 5.1.1(v) obriga todo app que
 * permite criar conta a permitir apagá-la de dentro do app, e não aceita
 * "mande um e-mail para o suporte" como caminho. Sem esta rota a Mimu é
 * reprovada na revisão, independente de qualquer outra coisa estar certa.
 *
 * Vale para a web também, e não só para o iOS. Uma exclusão que só existe
 * dentro do app seria a mesma dívida invertida — e a LGPD pede o mesmo
 * caminho para quem usa pelo navegador.
 *
 * A mecânica é a mesma da exclusão do painel admin em
 * app/api/admin/contas/[empresaId]: apagar o usuário do auth é o que dispara
 * o cascade que leva empresa, clientes, transações, agendamentos e conversas.
 * Apagar a empresa primeiro deixaria um login órfão, capaz de entrar e cair
 * num onboarding em branco.
 */
export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logada." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const confirmacao = typeof body?.confirmacao === "string" ? body.confirmacao : "";

  const service = createServiceClient();

  /*
   * A empresa é lida com a service role, e não com a sessão de quem está
   * pedindo.
   *
   * Não é desconfiança do RLS: é que precisamos do `nome` para conferir a
   * confirmação e do `id` para o evento, e a leitura tem que funcionar mesmo
   * numa conta suspensa ou vencida — que é justamente quem mais tende a
   * querer sair.
   */
  const { data: empresa } = await service
    .from("empresas")
    .select("id, nome")
    .eq("user_id", user.id)
    .maybeSingle();

  /*
   * Trava deliberada: obriga a digitar o nome do negócio.
   *
   * Não é segurança — quem chegou aqui já provou ser o dono da sessão. É o
   * mesmo travamento do GitHub ao apagar um repositório: obriga a ler o que
   * está prestes a sumir e transforma um toque errado numa decisão. Numa tela
   * de celular, onde o dedo erra, isso importa mais ainda.
   *
   * Uma conta sem empresa (parou no meio do onboarding) não tem nome para
   * digitar, e por isso pula a conferência em vez de ficar presa para sempre
   * numa confirmação impossível de satisfazer.
   */
  if (empresa && confirmacao.trim() !== empresa.nome.trim()) {
    return NextResponse.json(
      { error: "Digite o nome do seu negócio exatamente como aparece." },
      { status: 400 },
    );
  }

  /*
   * O evento vai ANTES de apagar, e não depois.
   *
   * Depois não haveria de onde tirar o id da empresa: a linha deixa de
   * existir no instante seguinte. Se a exclusão falhar, sobra o registro de
   * uma saída que não aconteceu — preço barato perto de uma conta sumindo
   * sem deixar rastro de que foi decisão de alguém.
   */
  await registrarEvento("conta_excluida_pelo_usuario", {
    empresaId: empresa?.id ?? null,
    userId: user.id,
    detalhe: { tinhaEmpresa: Boolean(empresa) },
  });

  const { error: erroExclusao } = await service.auth.admin.deleteUser(user.id);

  if (erroExclusao) {
    console.error("Erro ao excluir a própria conta:", erroExclusao);
    return NextResponse.json(
      { error: "Não consegui excluir a conta agora. Tenta de novo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ excluida: true });
}
