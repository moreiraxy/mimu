import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SubscriptionPayload {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  /** "apns" vem do aplicativo iOS; ausente ou "web", do navegador. */
  tipo?: string;
  /** O token do aparelho, quando o transporte é APNs. */
  token?: string;
}

/** Recebe a PushSubscription do browser (subscription.toJSON()) e salva pra empresa do usuário logado. */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as SubscriptionPayload | null;

  /*
   * Dois transportes, uma tabela.
   *
   * O aplicativo iOS não tem `PushManager`, então nunca produz endpoint nem o
   * par de chaves — o que ele tem é o token do aparelho, que entra na MESMA
   * coluna `endpoint`. Quem envia (lib/alertas-proativos.ts) decide o caminho
   * pela coluna `tipo`, e não precisa saber que existem dois mundos.
   */
  const ehApns = body?.tipo === "apns";

  if (ehApns) {
    if (!body?.token) {
      return NextResponse.json(
        { error: "Token do aparelho ausente." },
        { status: 400 },
      );
    }
  } else if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: "Inscrição de push inválida." },
      { status: 400 },
    );
  }

  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (empresaError || !empresa) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    ehApns
      ? {
          empresa_id: empresa.id,
          endpoint: body!.token!,
          tipo: "apns",
          p256dh: null,
          auth: null,
        }
      : {
          empresa_id: empresa.id,
          endpoint: body!.endpoint!,
          tipo: "web",
          p256dh: body!.keys!.p256dh!,
          auth: body!.keys!.auth!,
        },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível salvar a inscrição." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
