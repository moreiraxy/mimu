import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getGroq, DEFAULT_MODEL, MODELOS_RESERVA } from "@/lib/groq";
import { registrarEvento } from "@/lib/eventos";
import { avisarAdminsMimuFora } from "@/lib/admin-avisos";

/**
 * Confere de hora em hora se a Mimu ainda consegue responder.
 *
 * Existe porque a Groq aposentou o modelo sem avisar e a Mimu ficou muda por
 * horas. O erro existia, mas quem descobriu foi uma cliente reclamando. Um
 * reserva automático resolve o caso de o modelo sumir; ele não resolve o de
 * ninguém ficar sabendo, e o próximo problema pode ser outro (chave revogada,
 * conta suspensa, limite estourado o dia inteiro).
 *
 * A checagem chama o modelo de verdade, com a chave de verdade. Perguntar ao
 * endpoint de modelos diria só que o modelo existe no catálogo, não que a
 * nossa chave consegue usá-lo, que é a pergunta que importa.
 *
 * Custa uns poucos tokens por hora, contra um limite de 8.000 por minuto.
 */

async function autorizado(request: Request): Promise<boolean> {
  const { data } = await createServiceClient().rpc("obter_segredo_cron");
  if (!data) return false;
  return (request.headers.get("authorization") ?? "") === `Bearer ${data}`;
}

/**
 * Tenta cada modelo e devolve o primeiro que responder.
 *
 * `erro` é sempre o motivo de o PRINCIPAL ter falhado, mesmo quando um reserva
 * salva a resposta. É o que se quer saber: "por que o padrão caiu". Guardar o
 * erro do último tentado devolveria vazio justamente no caso em que o reserva
 * funcionou, que é quando ninguém mais vai investigar.
 */
async function primeiroQueResponde(): Promise<{
  modelo: string | null;
  erro: string | null;
}> {
  let erroDoPrincipal: string | null = null;

  for (const modelo of [DEFAULT_MODEL, ...MODELOS_RESERVA]) {
    try {
      await getGroq().chat.completions.create({
        model: modelo,
        max_tokens: 1,
        messages: [{ role: "user", content: "ok" }],
      });
      return { modelo, erro: erroDoPrincipal };
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err);
      if (erroDoPrincipal === null) erroDoPrincipal = motivo;
    }
  }
  return { modelo: null, erro: erroDoPrincipal };
}

export async function POST(request: Request) {
  if (!(await autorizado(request))) {
    // 404 e não 401: confirmar que a rota existe já entrega que há uma tarefa
    // agendada aqui e convida a tentar adivinhar o segredo.
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const { modelo, erro } = await primeiroQueResponde();

  if (!modelo) {
    await registrarEvento("mimu_falhou", {
      detalhe: { origem: "checagem automática", modelo: DEFAULT_MODEL, motivo: erro },
    });
    await avisarAdminsMimuFora(
      `Nenhum modelo respondeu. ${erro ?? "Sem detalhe."}`,
    );
    return NextResponse.json({ ok: false, erro }, { status: 503 });
  }

  if (modelo !== DEFAULT_MODEL) {
    // O principal caiu mas o reserva segurou. As clientes não sentem nada, e
    // é justamente por isso que precisa avisar: sem este aviso, a Mimu ficaria
    // rodando no reserva para sempre e ninguém saberia.
    await registrarEvento("mimu_falhou", {
      detalhe: {
        origem: "checagem automática",
        modelo: DEFAULT_MODEL,
        respondendoCom: modelo,
        motivo: erro,
      },
    });
    await avisarAdminsMimuFora(
      `O modelo ${DEFAULT_MODEL} não responde. A Mimu está no reserva ${modelo}. Troque o padrão.`,
    );
  }

  return NextResponse.json({ ok: true, modelo });
}
