import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { gerarAlertasDaEmpresa } from "@/lib/alertas-proativos";
/**
 * A tarefa do Posto de Comando: gera os avisos dela nos horários da rotina.
 *
 * Irmã da tarefa diária (app/api/cron/alertas-diarios), com dois recortes
 * diferentes: só contas com o módulo 'posto', e seis execuções por dia em vez
 * de uma. O porquê está no comentário da função POST, mais abaixo.
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
 * A TAREFA DO POSTO — roda nos horários da rotina dela.
 *
 * POR QUE ELA EXISTE. Os avisos nasciam em dois momentos: quando ela abre o
 * app (e a cada 30 minutos de app aberto, e a cada volta de foco na aba) e na
 * tarefa diária das 17h. O efeito, nas palavras dela: "as notificações n estão
 * funcionando, aaprecem quando elas querem". E era verdade — o gatilho era o
 * foco da aba, não o relógio.
 *
 * Mas a rotina dela TEM horário: 9:30 e-mail, 9:45 roleta, 12:00 corte da
 * fila, 14:45 roleta da tarde, 17:00 SLA, 17:45 resumo. Um aviso de "passou da
 * hora" só vale perto da hora que passou.
 *
 * Esta rota é chamada pelo agendador do banco seis vezes por dia, de segunda a
 * sexta, cinco minutos depois de cada marco (ver a migration
 * 20261015030000_avisos_do_posto_na_hora.sql). Cinco minutos é a folga que
 * evita cobrar atraso de quem está em cima do horário.
 *
 * SÓ CONTAS COM O POSTO. A tarefa diária das 17h continua existindo para as
 * contas do produto de gestão; esta não toca nelas. E a travessa de um aviso
 * por tipo por dia (lib/posto/alertas.ts) é o que impede seis execuções
 * virarem seis notificações da mesma coisa.
 */
export async function POST(request: Request) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const supabase = createServiceClient();

  const { data: empresas, error } = await supabase
    .from("empresas")
    .select("*")
    .contains("modulos_ativos", ["posto"]);

  if (error) {
    console.error("Tarefa do posto: falha ao listar contas.", error);
    return NextResponse.json(
      { error: "Falha ao listar contas." },
      { status: 500 },
    );
  }

  let processadas = 0;
  let alertasCriados = 0;
  let comFalha = 0;

  for (const empresa of empresas ?? []) {
    if (empresa.suspensa_em) continue;
    try {
      const novos = await gerarAlertasDaEmpresa(
        supabase,
        empresa as unknown as Parameters<typeof gerarAlertasDaEmpresa>[1],
      );
      alertasCriados += novos.length;
      processadas += 1;
    } catch (err) {
      // Uma conta com dado estranho não interrompe as outras.
      comFalha += 1;
      console.error("Tarefa do posto: conta falhou.", {
        empresaId: empresa.id,
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ processadas, alertasCriados, comFalha });
}
