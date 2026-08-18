"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularMetaDiaria } from "@/lib/formatters";
import { criarAssinaturaPendente, criarAssinaturaTrial } from "@/lib/assinatura";
import { createServiceClient } from "@/lib/supabase/service";
import { MODULOS } from "@/lib/modulos";
import { planoValido } from "@/lib/planos";

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

/** Todas as chaves de módulo que existem no produto. */
const CHAVES_DE_MODULO = new Set(MODULOS.flatMap((m) => m.chaves));

export async function salvarModulos(modulos: string[]): Promise<ActionState> {
  if (modulos.length === 0) {
    return { error: "Escolha ao menos um módulo para continuar." };
  }

  const { user } = await getUsuarioAutenticado();

  // Lista branca: módulo é o que separa os planos, e o que chega aqui vem de
  // um formulário, ou seja, do navegador.
  const validos = [...new Set(modulos)].filter((m) =>
    CHAVES_DE_MODULO.has(m as never),
  );

  if (validos.length === 0) {
    return { error: "Escolha ao menos um módulo para continuar." };
  }

  /*
   * Grava com a service role porque `modulos_ativos` saiu do alcance do
   * navegador na auditoria de segurança: dava para ligar todos os módulos,
   * inclusive a Mimu, com um update pelo console. O escopo não muda, a
   * atualização continua presa ao user_id da sessão verificada.
   */
  const { error } = await createServiceClient()
    .from("empresas")
    .update({ modulos_ativos: validos })
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

  // Os 7 dias de teste são só de quem escolheu o plano grátis. Quem clicou
  // num plano pago na landing sai daqui SEM assinatura, e é isso que faz o
  // middleware mandar a pessoa para /assinar: ela pediu para pagar, não para
  // testar. Criar um trial aqui daria 7 dias de graça para quem já tinha
  // decidido assinar.
  const planoEscolhido = planoValido(
    (await supabase.auth.getUser()).data.user?.user_metadata?.plano_escolhido,
  );

  /*
   * A assinatura é criada com a service role, não com a sessão de quem está
   * concluindo o cadastro.
   *
   * `empresa.id` acabou de sair de uma consulta escopada pela sessão, então o
   * alcance não muda. O que muda é o banco poder negar escrita em
   * `assinaturas` a qualquer pessoa autenticada: enquanto o onboarding
   * gravava pela sessão, essa permissão precisava existir, e com ela dava
   * para virar Premium de graça por um update no console do navegador.
   */
  const servidor = createServiceClient();

  if (planoEscolhido) {
    // O erro é checado de propósito: sem isso a falha do insert passava calada
    // e a pessoa chegava ao checkout sem assinatura nenhuma para pagar. Foi
    // exatamente o que aconteceu quando 'premium' não cabia no check da
    // coluna `plano`.
    const { error } = await criarAssinaturaPendente(
      servidor,
      empresa.id,
      planoEscolhido,
    );

    if (error) {
      console.error("Erro ao criar assinatura pendente:", error);
      return { error: "Não consegui preparar seu plano. Tente de novo." };
    }

    redirect("/assinar");
  }

  await criarAssinaturaTrial(servidor, empresa.id);

  redirect("/bem-vindo");
}
