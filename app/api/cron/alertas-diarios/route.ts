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

/**
 * O segredo vem do banco, não do ambiente.
 *
 * Ele já morava no Vault, porque é de lá que o agendamento tira o cabeçalho.
 * A rota conferia contra uma variável de ambiente separada, e manter os dois
 * valores iguais era trabalho manual que deu errado três vezes seguidas. Lendo
 * do mesmo lugar, não existe mais como discordarem.
 *
 * Fica em cache no processo: a tarefa roda uma vez por dia, mas a rota também
 * é chamada por quem chuta URL, e cada chute não precisa virar uma consulta.
 */
let segredoEmCache: string | null = null;

async function segredoDoCron(): Promise<string | null> {
  if (segredoEmCache) return segredoEmCache;

  const { data, error } = await createServiceClient().rpc(
    "obter_segredo_cron",
  );

  if (error || !data) {
    console.error("Não consegui ler o segredo da tarefa diária.", error);
    return null;
  }

  segredoEmCache = data;
  return data;
}

/** Sem sessão, a única barreira é este segredo. Sem ele, a rota não roda. */
async function autorizado(request: Request): Promise<boolean> {
  const segredo = await segredoDoCron();
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
 * Serve para testar o encanamento sem disparar aviso para ninguém. Antes era
 * a única forma de descobrir que o segredo estava errado sem mandar
 * notificação para todo mundo só para ver se o número batia.
 */
export async function GET(request: Request) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, rota: "alertas-diarios" });
}

export async function POST(request: Request) {
  if (!(await autorizado(request))) {
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
