import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { gerarAlertasDaEmpresa } from "@/lib/alertas-proativos";
import type { StatusAssinatura } from "@/types/database";

/**
 * Tarefa diária: gera os alertas de TODAS as contas ativas e manda o push.
 *
 * Existe porque os alertas nasciam presos ao app aberto: quem gerava era o
 * navegador de quem estava usando a Mimu naquele momento. Na prática, só
 * recebia aviso quem já tinha entrado — exatamente ao contrário do que um
 * aviso serve.
 *
 * Aqui não há sessão de usuário. A autorização é um segredo compartilhado no
 * cabeçalho, e o acesso ao banco usa a service role, que ignora RLS por
 * precisar ler dados de todo mundo.
 */

/** Sem sessão, a única barreira é este segredo. Sem ele configurado, a rota não roda. */
function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;

  const cabecalho = request.headers.get("authorization") ?? "";
  return cabecalho === `Bearer ${segredo}`;
}

/**
 * Contas que recebem aviso.
 *
 * Só quem tem acesso ao produto: em teste válido ou pagando. Mandar alerta
 * para conta vencida, cancelada ou suspensa seria falar com quem não pode nem
 * abrir o app — e, no caso da suspensa, com quem foi tirada de propósito.
 */
const STATUS_QUE_RECEBEM = ["trial", "ativa"] as const;

/**
 * Confere só a autorização, sem gerar nem enviar nada.
 *
 * O segredo mora em dois lugares que precisam bater: a variável no Railway,
 * que a rota lê, e o Vault do Supabase, de onde o agendamento tira o
 * cabeçalho. Se um for trocado sem o outro, a tarefa passa a responder 404
 * todo dia — em silêncio, porque falhar fechado é justamente não contar nada
 * a quem chama. Sem esta rota, descobrir isso exigia disparar a tarefa de
 * verdade e mandar aviso para todo mundo só para ver se o número batia.
 */
export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, rota: "alertas-diarios" });
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    // 404 e não 401: confirmar que a rota existe já entrega que há uma tarefa
    // agendada aqui e convida a tentar adivinhar o segredo.
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const supabase = createServiceClient();

  const { data: contas, error } = await supabase
    .from("assinaturas")
    .select("status, trial_fim, empresas!inner(*)")
    .in("status", STATUS_QUE_RECEBEM as unknown as StatusAssinatura[]);

  if (error) {
    console.error("Tarefa diária: falha ao listar contas.", error);
    return NextResponse.json({ error: "Falha ao listar contas." }, { status: 500 });
  }

  const agora = new Date();
  let processadas = 0;
  let alertasCriados = 0;
  let comFalha = 0;

  for (const conta of contas ?? []) {
    const empresa = conta.empresas as unknown as Parameters<
      typeof gerarAlertasDaEmpresa
    >[1];

    // Trial vencido ainda aparece como "trial" até alguém abrir o app (é o
    // middleware que marca como vencida). Filtrar aqui evita avisar quem já
    // perdeu o acesso.
    if (
      conta.status === "trial" &&
      conta.trial_fim &&
      new Date(conta.trial_fim) < agora
    ) {
      continue;
    }

    if (!empresa?.id || empresa.suspensa_em) continue;

    try {
      const novos = await gerarAlertasDaEmpresa(supabase, empresa);
      alertasCriados += novos.length;
      processadas += 1;
    } catch (err) {
      // Uma conta com dado estranho não pode interromper a varredura das
      // outras: sem este try, a primeira falha deixaria todo mundo depois
      // dela sem aviso naquele dia.
      comFalha += 1;
      console.error("Tarefa diária: falha numa conta.", {
        empresaId: empresa?.id,
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log("Tarefa diária de alertas concluída.", {
    processadas,
    alertasCriados,
    comFalha,
  });

  return NextResponse.json({ processadas, alertasCriados, comFalha });
}
