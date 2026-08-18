import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarPushParaEmpresa } from "@/lib/push";

/**
 * Avisos para os admins do produto (não para as usuárias).
 *
 * O push existente é endereçado por empresa (`push_subscriptions.empresa_id`),
 * e todo admin também é dona de uma conta — então o aviso vai para a empresa
 * do próprio admin, reaproveitando o service worker que já está no ar. Nada
 * de infra nova nem de e-mail.
 */

/**
 * Avisa todos os admins que alguém acabou de se cadastrar.
 *
 * Silenciosa por completo: um erro aqui NUNCA pode derrubar o cadastro. A
 * pessoa terminou de criar a conta dela; falhar a notificação interna e
 * devolver erro pra ela seria trocar um aviso perdido por um cliente perdido.
 * Por isso tudo roda dentro de try/catch e o retorno é ignorado por quem chama.
 */
export async function avisarAdminsNovoCadastro(
  nomeNegocio: string,
): Promise<void> {
  try {
    const service = createServiceClient();

    const { data: admins } = await service.from("admins").select("user_id");
    if (!admins || admins.length === 0) {
      console.error("Aviso de novo cadastro não saiu: nenhum admin cadastrado.");
      return;
    }

    // A empresa de cada admin — é ela que endereça o push.
    const { data: empresas } = await service
      .from("empresas")
      .select("id, user_id")
      .in(
        "user_id",
        admins.map((a) => a.user_id),
      );
    if (!empresas || empresas.length === 0) {
      console.error(
        "Aviso de novo cadastro não saiu: os admins não têm empresa, e é a " +
          "empresa que endereça o push.",
      );
      return;
    }

    await Promise.all(
      empresas.map((e) =>
        enviarPushParaEmpresa(
          // `enviarPushParaEmpresa` espera o client tipado do servidor; o
          // service client tem a mesma forma e é o que enxerga inscrições de
          // outra empresa que não a da sessão atual.
          service as unknown as Parameters<typeof enviarPushParaEmpresa>[0],
          e.id,
          {
            title: "Novo cadastro na Mimu 🎉",
            body: `${nomeNegocio} acabou de criar uma conta.`,
            url: "/admin",
          },
        ),
      ),
    );
  } catch (erro) {
    console.error("Falha ao avisar admins de novo cadastro:", erro);
  }
}
