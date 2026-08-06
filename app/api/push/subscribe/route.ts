import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SubscriptionPayload {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
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

  const body = (await request.json().catch(() => null)) as SubscriptionPayload | null;

  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
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
    {
      empresa_id: empresa.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
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
