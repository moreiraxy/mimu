import webpush from "web-push";
import type { createClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createClient>;

let vapidConfigurado = false;

function configurarVapid(): boolean {
  if (vapidConfigurado) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

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
  if (!configurarVapid()) return;

  const { data: inscricoes } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("empresa_id", empresaId);

  if (!inscricoes || inscricoes.length === 0) return;

  await Promise.all(
    inscricoes.map(async (inscricao) => {
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
