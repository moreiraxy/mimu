import { createServiceClient } from "@/lib/supabase/service";
import { buscarVinculoAtivo } from "@/lib/whatsapp/vinculo";
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

/**
 * A resposta para quem escreve de um número que não conhecemos.
 *
 * Diz como conectar e nada mais. Não confirma nem nega que exista conta com
 * aquele número, não cumprimenta pelo nome, não dá pista de dado nenhum:
 * quem está do outro lado pode ser qualquer pessoa, inclusive alguém que
 * recebeu um número reciclado pela operadora.
 */
const RESPOSTA_NAO_VINCULADO =
  "Oi! Eu sou a Mimu 💚\n\n" +
  "Ainda não reconheço esse número. Para conversar comigo por aqui, abra o " +
  "app da Mimu, vá em *Minha empresa* e toque em *Conectar WhatsApp*. Vou te " +
  "dar um código para você me mandar aqui.";

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
export async function atender(
  mensagem: MensagemRecebida,
  responder: (
    mensagem: MensagemRecebida,
    conta: { empresaId: string; userId: string },
  ) => Promise<string>,
): Promise<RespostaDoAgente> {
  const nova = await registrarChegada(mensagem);
  if (!nova) return null;

  const vinculo = await buscarVinculoAtivo(mensagem.remetente);

  if (!vinculo) {
    await fecharRegistro(mensagem, "nao_vinculada", null);
    return { texto: RESPOSTA_NAO_VINCULADO };
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
