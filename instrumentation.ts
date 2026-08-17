/**
 * Roda uma vez, quando o servidor sobe.
 *
 * Serve a uma coisa só: publicar o CRON_SECRET no Vault do Supabase, para o
 * agendamento diário usar o mesmo segredo que a rota confere.
 *
 * Antes o valor era copiado à mão nos dois lugares, e eles saíram de sincronia
 * sem ninguém perceber: a tarefa disparava no horário, o agendador registrava
 * "succeeded" (porque o SQL enfileirou a chamada com sucesso) e a resposta
 * HTTP, guardada num canto do banco, era 404. Os avisos diários simplesmente
 * não aconteciam, e nada gritava.
 *
 * Agora a variável do Railway é a única fonte. Trocar lá e dar deploy basta.
 */
export async function register() {
  // `register` também é chamado no runtime edge, onde não há service role nem
  // motivo para isto acontecer duas vezes.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const segredo = process.env.CRON_SECRET;

  if (!segredo) {
    console.error(
      "CRON_SECRET não está definida. A tarefa diária de alertas vai " +
        "responder 404 e ninguém recebe aviso. Defina a variável no Railway " +
        "e refaça o deploy.",
    );
    return;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const { error } = await createServiceClient().rpc("definir_segredo_cron", {
      p_segredo: segredo,
    });

    if (error) {
      console.error(
        "Falha ao publicar o segredo da tarefa diária no Vault.",
        error.message,
      );
      return;
    }

    console.log("Segredo da tarefa diária publicado no Vault.");
  } catch (erro) {
    // Nunca derruba o boot: sem os avisos diários o produto continua de pé, e
    // um servidor que não sobe seria um estrago muito maior que um alerta que
    // não chega.
    console.error(
      "Erro inesperado ao publicar o segredo da tarefa diária.",
      erro instanceof Error ? erro.message : String(erro),
    );
  }
}
