"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularMetaDiaria } from "@/lib/formatters";
import { criarAssinaturaTrial } from "@/lib/assinatura";

type ActionState = { error?: string } | undefined;

async function getUsuarioAutenticado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function salvarNegocio(
  tipoNegocio: string,
): Promise<ActionState> {
  const tipo = tipoNegocio.trim();
  if (!tipo) {
    return { error: "Escolha uma opção para continuar." };
  }

  const { supabase, user } = await getUsuarioAutenticado();
  const { data: empresa, error } = await supabase
    .from("empresas")
    .update({ tipo_negocio: tipo })
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !empresa) {
    return { error: "Não foi possível salvar. Tente de novo." };
  }

  // Ponto de partida editável depois em Minha Empresa — não bloqueia o
  // onboarding se falhar (não deveria, mas categorias vazias não travam o
  // uso do app; a usuária ainda consegue criar categorias na hora).
  await supabase.rpc("seed_categorias_padrao", {
    p_empresa_id: empresa.id,
    p_tipo_negocio: tipo,
  });

  redirect("/onboarding/modulos");
}

export async function salvarModulos(modulos: string[]): Promise<ActionState> {
  if (modulos.length === 0) {
    return { error: "Escolha ao menos um módulo para continuar." };
  }

  const { supabase, user } = await getUsuarioAutenticado();
  const { error } = await supabase
    .from("empresas")
    .update({ modulos_ativos: modulos })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo." };
  }

  redirect("/onboarding/meta");
}

export async function concluirOnboarding(input: {
  metaMensal: number | null;
  clientesPorSemana: number | null;
}): Promise<ActionState> {
  const { supabase, user } = await getUsuarioAutenticado();

  const metaMensal =
    input.metaMensal && input.metaMensal > 0 ? input.metaMensal : null;
  const metaDiaria = metaMensal ? calcularMetaDiaria(metaMensal) : null;

  const { data: empresa, error } = await supabase
    .from("empresas")
    .update({
      meta_mensal: metaMensal,
      meta_diaria: metaDiaria,
      clientes_por_semana_media: input.clientesPorSemana,
      onboarding_concluido: true,
    })
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !empresa) {
    return { error: "Não foi possível concluir. Tente de novo." };
  }

  if (metaMensal) {
    const agora = new Date();
    await supabase.from("metas").upsert(
      {
        empresa_id: empresa.id,
        mes: agora.getMonth() + 1,
        ano: agora.getFullYear(),
        valor_meta: metaMensal,
      },
      { onConflict: "empresa_id,mes,ano" },
    );
  }

  // Início do trial de 7 dias — a partir de agora o middleware passa a
  // exigir uma assinatura em dia pra deixar acessar o app.
  await criarAssinaturaTrial(supabase, empresa.id);

  redirect("/bem-vindo");
}
