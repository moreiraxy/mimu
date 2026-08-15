import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarAlertasDaEmpresa } from "@/lib/alertas-proativos";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (empresaError || !empresa) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  const novos = await gerarAlertasDaEmpresa(supabase, empresa);

  const { data: naoLidos } = await supabase
    .from("alertas_mimu")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("lido", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({ novos, naoLidos: naoLidos ?? [] });
}
