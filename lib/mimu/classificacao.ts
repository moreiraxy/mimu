import {
  getGroq,
  DEFAULT_MODEL,
} from "@/lib/groq";
import {
  buildMimuClassificationPrompt,
  extrairClassificacao,
  type ClassificacaoMimu,
} from "@/lib/mimu-prompts";

/**
 * Descobrir o que a pessoa quis dizer: registrar algo, perguntar algo, ou
 * outra coisa.
 *
 * Saiu de app/api/mimu/chat/route.ts quando o WhatsApp passou a registrar
 * também. Os dois canais precisam classificar do MESMO jeito — se um
 * entendesse "vendi 3 bolos" como registro e o outro como conversa, a mesma
 * frase daria resultados diferentes dependendo de onde foi digitada, que é o
 * defeito que o brief chama de pior possível.
 */

/** Uma chamada curta e separada, só para classificar. */
export async function classificarIntencao(
  mensagem: string,
): Promise<ClassificacaoMimu | null> {
  try {
    const resposta = await getGroq().chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 300,
      messages: [
        { role: "system", content: buildMimuClassificationPrompt() },
        { role: "user", content: mensagem },
      ],
    });

    const texto = resposta.choices[0]?.message?.content ?? "";
    return extrairClassificacao(texto);
  } catch (err) {
    console.error("Erro ao classificar intenção da mensagem:", err);
    return null;
  }
}

/**
 * O que ainda falta para dar pra registrar, como pergunta pronta.
 *
 * Devolve null quando está tudo lá. Perguntar o que falta é diferente de
 * gravar com buraco: uma venda sem valor não é uma venda, é uma linha que vai
 * bagunçar o faturamento e ninguém vai saber de onde veio.
 */
export function identificarPendenciaRegistro(
  classificacao: ClassificacaoMimu,
): string | null {
  const { tipo, dados } = classificacao;

  if (tipo === "entrada" || tipo === "saida") {
    if (!dados.valor || dados.valor <= 0) {
      return tipo === "entrada"
        ? "Não entendi bem. Você quis dizer que recebeu um pagamento? Me conta de novo com mais detalhes, incluindo o valor."
        : "Não entendi bem. Você quis dizer que pagou alguma coisa? Me conta de novo com mais detalhes, incluindo o valor.";
    }
    return null;
  }

  if (tipo === "agendamento") {
    if (!dados.cliente && !dados.descricao) {
      return "Não entendi bem quem é o agendamento. Me conta de novo com o nome do cliente e o horário.";
    }
    if (!dados.horario) {
      return "Não entendi o horário do agendamento. Me conta de novo com o dia e a hora.";
    }
    return null;
  }

  return "Não entendi bem. Você quis dizer que recebeu um pagamento, pagou alguma coisa ou quer marcar um horário? Me conta de novo com mais detalhes.";
}
