/**
 * Roda uma vez, quando o servidor sobe.
 *
 * Serve a uma coisa só: garantir que o segredo da tarefa diária exista antes
 * do primeiro disparo. Quem cria é o banco, na primeira vez que alguém
 * pergunta por ele; este boot é só quem faz a pergunta cedo, para o
 * agendamento das 17h não ser o primeiro a descobrir que não havia nada.
 *
 * Não existe mais nada para configurar à mão. O valor era digitado em dois
 * lugares que precisavam concordar, deu errado três vezes seguidas, e na
 * última o que estava no ambiente era o próprio espaço reservado da
 * instrução. Agora o segredo nasce sozinho e mora num lugar só.
 */
export async function register() {
  // `register` também é chamado no runtime edge, onde não há service role nem
  // motivo para isto acontecer duas vezes.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const { error } = await createServiceClient().rpc("obter_segredo_cron");

    if (error) {
      console.error(
        "Não consegui preparar o segredo da tarefa diária de alertas.",
        error.message,
      );
      return;
    }

    console.log("Segredo da tarefa diária de alertas pronto.");
  } catch (erro) {
    // Nunca derruba o boot: sem os avisos diários o produto continua de pé, e
    // um servidor que não sobe seria um estrago muito maior que um alerta que
    // não chega.
    console.error(
      "Erro inesperado ao preparar o segredo da tarefa diária.",
      erro instanceof Error ? erro.message : String(erro),
    );
  }
}
