import { createServiceClient } from "@/lib/supabase/service";
import { enviarPushParaEmpresa } from "@/lib/push";

/**
 * O envio de aviso para os admins, sem a trava `server-only`.
 *
 * Separado de lib/admin-avisos.ts por um motivo concreto: aquele arquivo tem
 * `import "server-only"`, que protege o bundle do navegador — e o pacote
 * estoura em QUALQUER contexto que não seja o do Next, inclusive no worker do
 * WhatsApp, que é servidor legítimo. Importá-lo de lá derrubava o worker na
 * subida.
 *
 * A proteção continua onde serve: admin-avisos.ts segue com a trava e é o que
 * o app importa. Aqui mora só o miolo, para o worker poder avisar quando o
 * canal cair.
 */
/**
 * Manda um push para todos os admins do produto.
 *
 * Silenciosa por completo: um erro aqui NUNCA pode derrubar o que estava
 * acontecendo. Por isso tudo roda dentro de try/catch.
 */
export async function avisarAdmins(payload: {
  title: string;
  body: string;
  url: string;
}): Promise<void> {
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
          payload,
        ),
      ),
    );
  } catch (erro) {
    console.error("Falha ao avisar os admins:", erro);
  }
}

/** Avisa que alguém acabou de se cadastrar. */