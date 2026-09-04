import webpush from "web-push";
import { registrarEvento } from "@/lib/eventos";
import { enviarApns } from "@/lib/push-apns";
import type { createClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createClient>;

let vapidConfigurado = false;

function configurarVapid(): boolean {
  if (vapidConfigurado) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    // Barulhento de propósito. Sem as chaves, TODO push do produto some sem
    // deixar rastro: o aviso diário, o de novo cadastro, o do chat. Era um
    // `return` mudo, e descobrir isso exigia adivinhar.
    console.error(
      "Push desativado: falta " +
        [
          !publicKey && "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
          !privateKey && "VAPID_PRIVATE_KEY",
        ]
          .filter(Boolean)
          .join(" e ") +
        " no ambiente. Nenhuma notificação sai enquanto isso.",
    );
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:suporte@mimu.app",
    publicKey,
    privateKey,
  );
  vapidConfigurado = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Envia uma push notification real (background, via service worker) pra
 * todos os dispositivos inscritos da empresa. Silenciosa por design — push é
 * um extra, nunca pode derrubar o fluxo que gerou o alerta.
 */
export async function enviarPushParaEmpresa(
  supabase: Supabase,
  empresaId: string,
  payload: PushPayload,
): Promise<void> {
  const { data: inscricoes } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("empresa_id", empresaId);

  if (!inscricoes || inscricoes.length === 0) return;

  /*
   * OS DOIS TRANSPORTES SÃO INDEPENDENTES, e a ordem aqui é o que garante
   * isso.
   *
   * A conferência do VAPID morava no topo da função e desistia de tudo. Com o
   * APNs no mesmo caminho, isso passou a significar que uma chave de push da
   * WEB faltando calaria as notificações do APLICATIVO — coisas que não têm
   * relação nenhuma. E não é hipótese: `VAPID_PRIVATE_KEY` não está no
   * ambiente hoje.
   *
   * Agora cada transporte responde por si. Quem está no iPhone recebe mesmo
   * com o Web Push desligado, e vice-versa.
   */
  const paraApns = inscricoes.filter((i) => i.tipo === "apns");
  const paraWeb = inscricoes.filter((i) => i.tipo !== "apns");

  await Promise.all(
    paraApns.map(async (inscricao) => {
      const r = await enviarApns(inscricao.endpoint, {
        titulo: payload.title,
        corpo: payload.body,
        destino: payload.url,
      });
      if (r.descartar) {
        // Aparelho que desinstalou ou trocou de dono. Guardar o token só faria
        // o próximo disparo gastar uma chamada para receber o mesmo erro.
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", inscricao.id);
      } else if (!r.ok && r.motivo !== "indisponivel") {
        console.error("APNs recusou a notificação.", {
          empresaId,
          motivo: r.motivo,
        });
      }
    }),
  );

  if (paraWeb.length === 0) return;

  if (!configurarVapid()) {
    await registrarEvento("push_falhou", {
      empresaId,
      detalhe: { motivo: "chaves VAPID ausentes no ambiente" },
    });
    return;
  }

  await Promise.all(
    paraWeb.map(async (inscricao) => {
      /*
       * A restrição `push_subscriptions_web_exige_chaves` no banco garante que
       * inscrição web tem o par. O TypeScript não sabe disso — as colunas são
       * anuláveis por causa do APNs — então a checagem fica aqui em vez de um
       * `!`: se um dia a restrição cair, isto pula a linha em vez de estourar
       * no meio do disparo.
       */
      if (!inscricao.p256dh || !inscricao.auth) return;
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
          },
          JSON.stringify(payload),
        );
      } catch (erro) {
        const statusCode = (erro as { statusCode?: number }).statusCode;
        if (statusCode !== 404 && statusCode !== 410) {
          // Falha que não é inscrição morta merece registro: é o único sinal
          // de que o push parou de sair.
          console.error("Push recusado pelo navegador.", {
            empresaId,
            statusCode,
            corpo: (erro as { body?: string }).body?.slice(0, 120),
          });
        }
        if (statusCode === 404 || statusCode === 410) {
          // Inscrição expirada/revogada no navegador — remove pra não tentar de novo.
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", inscricao.id);
        }
      }
    }),
  );
}
