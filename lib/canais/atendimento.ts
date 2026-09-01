import { createServiceClient } from "@/lib/supabase/service";
import { buscarVinculoAtivo, confirmarVinculo } from "@/lib/whatsapp/vinculo";
import {
  mascararRemetente,
  type MensagemRecebida,
  type RespostaDoAgente,
} from "@/lib/canais/tipos";

/**
 * O que acontece com uma mensagem que chega de fora do app.
 *
 * Não sabe o que é WhatsApp. Recebe a mensagem já normalizada, decide o que
 * responder e devolve texto — quem entrega é o adaptador do canal.
 *
 * A ordem aqui é deliberada e não é a mais óbvia: a mensagem é REGISTRADA
 * antes de ser processada. Ver `registrarChegada`.
 */

type Resultado = "respondida" | "nao_vinculada" | "ignorada" | "falhou";

/**
 * Marca a chegada e devolve false se a mensagem já tinha chegado antes.
 *
 * A trava é o índice único de (canal, mensagem_id), e não uma consulta antes
 * do insert. A diferença importa: o WhatsApp reentrega quando não recebe
 * confirmação a tempo, e as duas entregas podem estar em voo ao mesmo tempo.
 * Duas consultas simultâneas veriam "ainda não existe" e as duas seguiriam —
 * a mesma venda entraria duas vezes. Deixando o banco recusar, só uma passa.
 *
 * Registra ANTES de processar, como manda a 4.3. O custo é que uma mensagem
 * que falhe no meio fica marcada como recebida e não é reprocessada — e é o
 * lado certo do erro: não responder é um incômodo, gravar a mesma venda duas
 * vezes corrompe o relatório do mês e destrói a confiança no canal.
 */
async function registrarChegada(mensagem: MensagemRecebida): Promise<boolean> {
  const { error } = await createServiceClient()
    .from("canal_mensagens")
    .insert({
      canal: mensagem.canal,
      mensagem_id: mensagem.idNoCanal,
      remetente_mascarado: mascararRemetente(mensagem.remetente),
      recebida_em: mensagem.recebidaEm.toISOString(),
    });

  // 23505 é violação de unicidade: já passou por aqui.
  if (error?.code === "23505") return false;

  if (error) {
    /*
     * Não conseguimos registrar. A mensagem SEGUE assim mesmo.
     *
     * Bloquear aqui deixaria a Mimu muda toda vez que o banco tossisse, e a
     * pessoa não tem como saber que o problema é nosso. O risco é o oposto —
     * processar duas vezes se a entrega se repetir — e ele só existe na
     * janela em que o insert está falhando.
     */
    console.error("Não consegui registrar a chegada da mensagem.", error);
  }

  return true;
}

async function fecharRegistro(
  mensagem: MensagemRecebida,
  resultado: Resultado,
  empresaId: string | null,
) {
  const { error } = await createServiceClient()
    .from("canal_mensagens")
    .update({
      processada_em: new Date().toISOString(),
      resultado,
      empresa_id: empresaId,
    })
    .eq("canal", mensagem.canal)
    .eq("mensagem_id", mensagem.idNoCanal);

  if (error) {
    console.error("Não consegui fechar o registro da mensagem.", error);
  }
}

/**
 * Atende uma mensagem e devolve o que responder, ou null para não responder.
 *
 * `responder` é quem sabe conversar com quem já está vinculada. Entra por
 * parâmetro para esta função não depender do agente: na fase 3 é um eco, na
 * fase 4 vira a Mimu de verdade, e nada aqui muda.
 */
/*
 * O código como ele chega: no meio de uma frase.
 *
 * A tela monta "Oi Mimu! Meu código é ABC123", mas ninguém é obrigado a usar o
 * botão — tem quem digite só o código, quem cole com espaço no meio, quem
 * escreva em minúsculas. Procurar a sequência dentro do texto cobre os três
 * sem pedir formato a ninguém.
 *
 * O alfabeto é o mesmo de quem gera (sem I, L, O, S, 0, 1, 5 — os que se
 * confundem ao ler), e por isso a busca não casa com palavra comum do
 * português: qualquer vogal fora de A e E já derruba a candidata.
 */
const FORMATO_DO_CODIGO = /\b[ABCDEFGHJKMNPQRTUVWXYZ2346789]{6}\b/gi;

/**
 * Tenta fechar o vínculo com um código vindo na mensagem.
 *
 * Devolve null quando não há nada que pareça um código — aí quem responde é a
 * mensagem padrão de "não te conheço".
 */
async function tentarConectar(
  mensagem: MensagemRecebida,
): Promise<RespostaDoAgente | null> {
  const candidatos = mensagem.texto.match(FORMATO_DO_CODIGO);
  if (!candidatos?.length) return null;

  for (const candidato of candidatos) {
    const resultado = await confirmarVinculo(mensagem.remetente, candidato);

    if (resultado.ok) {
      await fecharRegistro(mensagem, "respondida", resultado.empresaId);
      return {
        texto:
          "Pronto, conectei! 💚\n\n" +
          "Agora é só me perguntar o que quiser: quanto você vendeu hoje, " +
          "como está a agenda, o que está acabando no estoque. " +
          "Pode falar ou mandar áudio.",
      };
    }

    /*
     * Tentativas demais encerram aqui, sem tentar os outros candidatos.
     *
     * Continuar consumiria o teto que existe justamente para impedir que se
     * chute código — e várias sequências numa mensagem só é exatamente a cara
     * de quem está tentando adivinhar.
     */
    if (resultado.motivo === "muitas_tentativas") {
      await fecharRegistro(mensagem, "nao_vinculada", null);
      return {
        texto:
          "Tivemos muitas tentativas seguidas por aqui. " +
          "Espere alguns minutos e tente de novo com um código novo do app.",
      };
    }
  }

  /*
   * Parecia código e não era — expirado, ou digitado errado.
   *
   * Vale uma resposta própria: cair na mensagem padrão de "não te conheço"
   * faria a pessoa repetir exatamente o que acabou de fazer, sem entender que
   * o problema é o prazo de dez minutos.
   */
  await fecharRegistro(mensagem, "nao_vinculada", null);
  return {
    texto:
      "Esse código não vale mais 😕\n\n" +
      // O caminho tem que bater com o app de verdade: a aba virou "Perfil" e
      // o WhatsApp ganhou tela própria. Instrução que aponta para um lugar
      // que não existe mais é pior que instrução nenhuma — a pessoa procura,
      // não acha, e conclui que o app está quebrado.
      "Ele expira em 10 minutos. Abra o app em *Perfil* → " +
      "*Mimu no WhatsApp*, pegue um código novo e me mande aqui.",
  };
}

export async function atender(
  mensagem: MensagemRecebida,
  responder: (
    mensagem: MensagemRecebida,
    conta: { empresaId: string; userId: string },
    /*
     * `null` é uma resposta legítima: significa "não responder nada".
     *
     * O agente usa isso quando repetir seria pior que calar — hoje, para não
     * mandar o mesmo aviso de plano a cada mensagem de quem já foi avisada.
     * Sem este caso no contrato, o silêncio precisaria virar string vazia, e
     * string vazia é o tipo de valor que alguém acaba enviando por engano.
     */
  ) => Promise<string | null>,
): Promise<RespostaDoAgente> {
  const nova = await registrarChegada(mensagem);
  if (!nova) return null;

  const vinculo = await buscarVinculoAtivo(mensagem.remetente);

  if (!vinculo) {
    /*
     * Antes de dizer "não te conheço", ver se a mensagem TRAZ o código.
     *
     * Este é o passo 3 do vínculo, e ele faltava: `confirmarVinculo` existia,
     * testada, e nada a chamava. O efeito era todo mundo cair na resposta
     * genérica, inclusive quem tinha acabado de pegar o código no app — a
     * conexão era impossível de completar, e a mensagem sugeria justamente
     * fazer o que não funcionava.
     */
    const resposta = await tentarConectar(mensagem);
    if (resposta) return resposta;

    /*
     * Número desconhecido e sem código: SILÊNCIO.
     *
     * O número da Mimu é o mesmo usado para prospecção humana. Responder a
     * quem escreve sem código significaria mandar um texto automático para
     * cada prospect que responde a um contato comercial — que é confuso para
     * ele, atrapalha a venda, e é o padrão exato que faz o WhatsApp bloquear
     * uma conta: a mesma mensagem, para muitos números diferentes, sem que
     * eles tenham pedido.
     *
     * Perder o número custaria as duas coisas de uma vez, a prospecção e o
     * canal.
     *
     * A Mimu só se manifesta para quem prova que a procurou: mandando o código
     * que nasceu dentro do app. Quem tem código continua sendo atendido em
     * `tentarConectar`, acima — inclusive com aviso quando ele expirou.
     *
     * O convite para conectar não se perde: ele está no app, na tela que gera
     * o código, que é de onde a pessoa sai para vir até aqui.
     */
    await fecharRegistro(mensagem, "nao_vinculada", null);
    return null;
  }

  /*
   * A mensagem segue como veio, ÁUDIO INCLUSIVE.
   *
   * A transcrição não acontece aqui. Aconteceu por um tempo, e era um furo:
   * transcrever custa por minuto, e este ponto sabe apenas que o número
   * pertence a alguém — não sabe se essa alguém tem direito de usar a Mimu.
   * Conta suspensa e conta no plano gratuito passavam por aqui, o áudio era
   * transcrito, e só depois vinha o "você não tem acesso". A gente pagava o
   * Whisper para dizer não.
   *
   * Quem decide se vale transcrever é quem conhece plano e suspensão, e isso é
   * política da Mimu, não do canal. Por isso `obterAudio` viaja intacto até lá.
   */
  try {
    const texto = await responder(mensagem, vinculo);

    /*
     * Silêncio deliberado do agente.
     *
     * Registrado como 'ignorada' e não como 'respondida': a diferença importa
     * para quem for investigar depois "por que ela não respondeu". Sem isso, o
     * log diria que respondeu — e a investigação começaria procurando um
     * problema de entrega que não existe.
     */
    if (texto === null) {
      await fecharRegistro(mensagem, "ignorada", vinculo.empresaId);
      return null;
    }

    await fecharRegistro(mensagem, "respondida", vinculo.empresaId);
    return { texto };
  } catch (erro) {
    console.error("Falhei ao atender a mensagem.", erro);
    await fecharRegistro(mensagem, "falhou", vinculo.empresaId);
    return {
      texto:
        "Desculpa, me embolei aqui e não consegui responder agora. " +
        "Tenta de novo daqui a pouquinho?",
    };
  }
}
