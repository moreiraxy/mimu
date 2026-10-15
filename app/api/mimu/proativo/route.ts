import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarAlertasDaEmpresa } from "@/lib/alertas-proativos";

export async function POST() {
  const supabase = await createClient();

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

  /*
   * ABRIR O APP NÃO GERA AVISO PARA QUEM TEM O POSTO.
   *
   * "no apar;eho móvel tb, notifica só quando eu entro no app, isso é um saco.
   * n quero receber motificações ao entrar."
   *
   * Esta rota era o gatilho: o navegador a chamava ao abrir o app, a cada 30
   * minutos de app aberto e a cada volta de foco da aba — e cada chamada
   * GERAVA os avisos e devolvia os novos, que o provider transformava em
   * notificação do sistema na hora. Resultado: entrar no app virava um lote de
   * notificações, sempre.
   *
   * Agora quem gera é a tarefa agendada, nos horários da rotina dela
   * (app/api/cron/posto + migration 20261015030000). Aqui ela só LÊ. Nada de
   * novo volta, então nada é notificado por ter aberto o app — e a lista de
   * avisos continua aparecendo dentro da tela, que é passivo e ela olha quando
   * quer.
   *
   * A decisão vive no SERVIDOR, e não no provider, de propósito: assim nenhum
   * caminho do navegador — outra tela, outro hook, um `verificarAgora()`
   * esquecido num botão — consegue furar isto.
   *
   * As contas do produto de gestão continuam como estavam: lá o aviso ao abrir
   * é o único que existe, porque a tarefa delas roda uma vez por dia.
   */
  const ehPosto = (empresa.modulos_ativos ?? []).includes("posto");
  const novos = ehPosto ? [] : await gerarAlertasDaEmpresa(supabase, empresa);

  const { data: naoLidos } = await supabase
    .from("alertas_mimu")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("lido", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({ novos, naoLidos: naoLidos ?? [] });
}
