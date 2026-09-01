import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal, prepararContaCompleta } from "./ambiente-local";
import type { Database } from "@/types/database";
import type { MensagemRecebida } from "@/lib/canais/tipos";

/**
 * As regras de acesso do app valendo também no WhatsApp.
 *
 * O canal não passa pelo middleware, que era o único lugar que checava
 * suspensão e teto de plano. Sem estes testes, as duas portas ficariam
 * abertas de novo na primeira refatoração — e nenhuma delas dá erro visível:
 * a conta suspensa simplesmente é atendida, e a conta gratuita simplesmente
 * gasta Groq.
 */

const ambiente = aplicarAmbienteLocal();

const { responderPelaMimu } = await import("@/lib/canais/mimu-responde");
const { RESPOSTA_SEM_ACESSO } = await import("@/lib/mimu/acesso");
const { MENSAGENS_MIMU_POR_DIA } = await import("@/lib/planos");
const { inicioDoDiaNoBrasil } = await import("@/lib/datas");

const service = createRawClient<Database>(
  ambiente.url,
  ambiente.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface Conta {
  userId: string;
  empresaId: string;
}

async function criarConta(nome: string): Promise<Conta> {
  const { data } = await service.auth.admin.createUser({
    email: `ac-${nome}-${Date.now()}@teste.mimu`,
    password: "senha-de-teste-123",
    email_confirm: true,
    user_metadata: { nome_negocio: nome },
  });
  const { data: e } = await service
    .from("empresas").select("id").eq("user_id", data.user!.id).single();

  // Assinatura paga por padrão. Cada teste sobrescreve o que quer testar —
  // sem isto a conta ficaria SEM assinatura, o teto cairia no gratuito, e os
  // testes passariam pelo motivo errado.
  await prepararContaCompleta(service, e!.id);

  return { userId: data.user!.id, empresaId: e!.id };
}

function msg(texto: string): MensagemRecebida {
  return {
    canal: "whatsapp",
    idNoCanal: `ac-${Date.now()}-${Math.random()}`,
    remetente: "5511944444444",
    texto,
    recebidaEm: new Date(),
  };
}

const criadas: string[] = [];

afterAll(async () => {
  for (const id of criadas) await service.auth.admin.deleteUser(id);
});

describe("suspensão vale no WhatsApp", () => {
  it("conta suspensa não é atendida", async () => {
    const conta = await criarConta("Suspensa");
    criadas.push(conta.userId);

    await service
      .from("empresas")
      .update({ suspensa_em: new Date().toISOString() })
      .eq("id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.suspensa);
  });
});

describe("teto do plano vale no WhatsApp", () => {
  it("plano gratuito CONVERSA — dentro da cota do dia", async () => {
    const conta = await criarConta("Gratuita");
    criadas.push(conta.userId);

    /*
     * A regra virou ao contrário, e de propósito.
     *
     * O gratuito não tinha a Mimu porque cada resposta custa na Groq, e IA
     * ilimitada de graça é uma conta que cresce com quem nunca vai pagar. O
     * que mudou não foi o custo — foi a existência de um teto por dia
     * (MENSAGENS_MIMU_POR_DIA). Com teto, a assistente pode ser de todo
     * mundo, que é o que faz alguém querer assinar para falar mais.
     */
    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null, valor_mensal: 0 })
      .eq("empresa_id", conta.empresaId);

    // "desfazer" não chama o modelo, então o teste não gasta Groq — mas só
    // chega nele quem passou pelo gate de acesso.
    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.sem_modulo_ia);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.assinatura_encerrada);
  });

  it("plano gratuito para de conversar quando a cota do dia acaba", async () => {
    const conta = await criarConta("SemCota");
    criadas.push(conta.userId);

    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null, valor_mensal: 0 })
      .eq("empresa_id", conta.empresaId);

    /*
     * Gasta a cota do dia direto na tabela em vez de mandar dez mensagens.
     *
     * Mandar de verdade custaria dez idas ao modelo — e o teste passaria a
     * medir o Groq em vez de medir o teto. O que importa aqui é só uma coisa:
     * cheio o contador, a Mimu para.
     */
    const gastas = Array.from({ length: MENSAGENS_MIMU_POR_DIA.free }, () => ({
      tipo: "mimu_dia" as const,
      identificador: conta.empresaId,
    }));
    await service.from("auth_rate_limit").insert(gastas);

    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
  });

  it("a cota zera na virada do dia, e não 24 horas depois de cada mensagem", async () => {
    const conta = await criarConta("ViradaDoDia");
    criadas.push(conta.userId);

    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null, valor_mensal: 0 })
      .eq("empresa_id", conta.empresaId);

    /*
     * O teste que separa "por dia" de "nas últimas 24 horas".
     *
     * As dez mensagens foram gastas no ÚLTIMO MINUTO DE ONTEM, no relógio do
     * Brasil. Numa janela deslizante elas ainda contariam — têm menos de 24
     * horas — e a Mimu ficaria calada. Num limite por dia elas são de ontem, e
     * hoje a conta está zerada.
     *
     * É a diferença que a pessoa sente: com janela deslizante, quem gastou
     * tudo às 15h vê as mensagens voltando de uma em uma a partir das 15h do
     * dia seguinte, sem nada explicando. "Dez por dia" promete outra coisa.
     *
     * De quebra, isto prende o FUSO. Contando com o relógio do servidor, que
     * roda em UTC, a virada aconteceria às 21h do Brasil — e este teste
     * falharia todo dia entre 21h e meia-noite.
     */
    const ontemQuaseVirando = new Date(inicioDoDiaNoBrasil().getTime() - 60_000);
    const deOntem = Array.from({ length: MENSAGENS_MIMU_POR_DIA.free }, () => ({
      tipo: "mimu_dia" as const,
      identificador: conta.empresaId,
      created_at: ontemQuaseVirando.toISOString(),
    }));
    await service.from("auth_rate_limit").insert(deOntem);

    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
  });

  it("a cota do gratuito não vale para quem paga", async () => {
    const conta = await criarConta("PagaComCota");
    criadas.push(conta.userId);

    // Mesmo número de mensagens gastas do teste acima. A diferença é só o
    // plano — e é ela que precisa mudar a resposta, senão o teto do Pro está
    // sendo calculado pelo do gratuito.
    const gastas = Array.from({ length: MENSAGENS_MIMU_POR_DIA.free }, () => ({
      tipo: "mimu_dia" as const,
      identificador: conta.empresaId,
    }));
    await service.from("auth_rate_limit").insert(gastas);

    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
  });

  it("assinatura pendente não conversa — escolheu plano pago e nunca pagou", async () => {
    const conta = await criarConta("Pendente");
    criadas.push(conta.userId);

    await service
      .from("assinaturas")
      .update({ plano: "premium", status: "pendente" })
      .eq("empresa_id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.assinatura_encerrada);
  });

  it("assinatura CANCELADA para de conversar", async () => {
    const conta = await criarConta("Cancelada");
    criadas.push(conta.userId);

    /*
     * O caso mais importante desta lista.
     *
     * Cancelar acontece no app ou no Mercado Pago, e o WhatsApp não fica
     * sabendo de nada — não há evento, não há aviso.
     *
     * E este teste quase deixou de proteger o que protege. O que barrava a
     * conta cancelada era indireto: `planoEfetivo` devolvia 'free', e 'free'
     * não tinha o módulo `ia`. No dia em que o gratuito ganhou a Mimu, essa
     * corrente arrebentou sozinha e a conta cancelada passaria a conversar de
     * graça — sem erro, sem log, sem nada. Agora quem barra é
     * `assinaturaEncerrada`, que diz isso com todas as letras em vez de
     * depender da coincidência entre duas regras.
     */
    await service
      .from("assinaturas")
      .update({ plano: "premium", status: "cancelada" })
      .eq("empresa_id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.assinatura_encerrada);
  });

  it("assinatura paga que VENCEU cai no gratuito, e o gratuito conversa", async () => {
    const conta = await criarConta("Vencida");
    criadas.push(conta.userId);

    /*
     * Vencer é diferente de cancelar: ninguém decidiu nada, a data passou.
     * O status continua 'ativa' — é a data da próxima cobrança que denuncia.
     *
     * O middleware rebaixa essa conta para o gratuito na próxima vez que ela
     * abrir o app, e o WhatsApp precisa tratá-la do mesmo jeito: como conta
     * gratuita, não como conta encerrada. Barrar aqui diria "você não tem
     * acesso" para quem o app diz "você está no plano grátis".
     *
     * O que ela NÃO leva junto é o teto do Premium que deixou de pagar — isso
     * é `planoEfetivo`, e continua valendo.
     */
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await service
      .from("assinaturas")
      .update({ plano: "premium", status: "ativa", proxima_cobranca: ontem })
      .eq("empresa_id", conta.empresaId);

    const gastas = Array.from({ length: MENSAGENS_MIMU_POR_DIA.free }, () => ({
      tipo: "mimu_dia" as const,
      identificador: conta.empresaId,
    }));
    await service.from("auth_rate_limit").insert(gastas);

    // Gastou a cota do GRATUITO e parou: prova que o teto aplicado é o do
    // gratuito, e não o do Premium gravado na linha.
    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
  });

  it("conta em trial é atendida — o teste dá acesso a tudo", async () => {
    const conta = await criarConta("EmTrial");
    criadas.push(conta.userId);

    const fim = new Date();
    fim.setDate(fim.getDate() + 5);
    await service
      .from("assinaturas")
      .update({ status: "trial", trial_fim: fim.toISOString() })
      .eq("empresa_id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("desfazer"), conta);
    // "desfazer" não chama o modelo, então o teste não gasta Groq — mas só
    // chega nele quem passou pelo gate de acesso.
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.sem_modulo_ia);
    expect(resposta).not.toBe(RESPOSTA_SEM_ACESSO.suspensa);
  });
});

describe("o aviso de plano não vira repetição", () => {
  it("avisa na primeira mensagem e cala nas seguintes", async () => {
    const conta = await criarConta("Insistente");
    criadas.push(conta.userId);

    await service
      .from("assinaturas")
      .update({ plano: "premium", status: "cancelada" })
      .eq("empresa_id", conta.empresaId);

    /*
     * Repetir a mesma frase a cada mensagem parecia defeito: a pessoa escreve,
     * recebe o mesmo texto, escreve de novo, recebe o mesmo texto. É o que um
     * sistema quebrado faz — e não acrescenta informação nenhuma, porque a
     * primeira mensagem já explicou tudo que havia para explicar.
     */
    const primeira = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(primeira).toBe(RESPOSTA_SEM_ACESSO.assinatura_encerrada);

    for (const texto of ["oi?", "alô", "você sumiu?"]) {
      expect(await responderPelaMimu(msg(texto), conta)).toBeNull();
    }
  });

  it("o silêncio é por conta, não geral", async () => {
    // Uma conta avisada não pode calar a Mimu para outra. O erro seria fácil de
    // cometer (uma marca global em vez de por empresa) e difícil de perceber:
    // a segunda pessoa simplesmente não receberia nada.
    const avisada = await criarConta("JaAvisada");
    const outra = await criarConta("OutraSemPlano");
    criadas.push(avisada.userId, outra.userId);

    for (const c of [avisada, outra]) {
      await service
        .from("assinaturas")
        .update({ plano: "premium", status: "cancelada" })
        .eq("empresa_id", c.empresaId);
    }

    await responderPelaMimu(msg("quanto vendi?"), avisada);
    expect(await responderPelaMimu(msg("oi?"), avisada)).toBeNull();

    expect(await responderPelaMimu(msg("quanto vendi?"), outra)).toBe(
      RESPOSTA_SEM_ACESSO.assinatura_encerrada,
    );
  });
});

describe("áudio não custa dinheiro para quem não tem acesso", () => {
  /*
   * O teste que faltava.
   *
   * A transcrição já rodava atrás do VÍNCULO (número conhecido), mas não
   * atrás do ACESSO (plano e suspensão). Conta suspensa ou no plano gratuito
   * mandava áudio, a gente pagava o Whisper, e só então respondia que ela não
   * tinha direito. O furo não dava erro nenhum — só aparecia na fatura.
   */
  async function mandarAudio(conta: Conta) {
    let transcreveu = false;
    const resposta = await responderPelaMimu(
      {
        canal: "whatsapp",
        idNoCanal: `au-${Date.now()}-${Math.random()}`,
        remetente: "5511933333333",
        texto: "",
        obterAudio: async () => {
          transcreveu = true;
          return Buffer.from("");
        },
        recebidaEm: new Date(),
      },
      conta,
    );
    return { transcreveu, resposta };
  }

  it("conta suspensa: nem baixa o áudio", async () => {
    const conta = await criarConta("SuspensaAudio");
    criadas.push(conta.userId);
    await service
      .from("empresas")
      .update({ suspensa_em: new Date().toISOString() })
      .eq("id", conta.empresaId);

    const { transcreveu, resposta } = await mandarAudio(conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.suspensa);
    expect(transcreveu).toBe(false);
  });

  it("cota esgotada: nem baixa o áudio", async () => {
    const conta = await criarConta("SemCotaAudio");
    criadas.push(conta.userId);
    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null })
      .eq("empresa_id", conta.empresaId);

    /*
     * Este teste trocou de dono junto com a regra.
     *
     * Ele provava que conta gratuita não pagava Whisper porque não tinha
     * acesso nenhum. Agora ela tem — e o gasto que precisa continuar barrado
     * é o de quem já usou o dia inteiro. É o mesmo dinheiro, na mesma ordem:
     * o gate roda ANTES de `obterAudio`, então áudio de quem não pode ser
     * atendido nunca chega a ser baixado nem transcrito.
     */
    const gastas = Array.from({ length: MENSAGENS_MIMU_POR_DIA.free }, () => ({
      tipo: "mimu_dia" as const,
      identificador: conta.empresaId,
    }));
    await service.from("auth_rate_limit").insert(gastas);

    const { transcreveu, resposta } = await mandarAudio(conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.cota_esgotada);
    expect(transcreveu).toBe(false);
  });

  it("conta com acesso: aí sim o áudio é buscado", async () => {
    const conta = await criarConta("ComAcessoAudio");
    criadas.push(conta.userId);

    const { transcreveu } = await mandarAudio(conta);
    // Passou pelo gate, então chegou a tentar. (A transcrição em si falha,
    // porque o buffer é vazio — o que importa aqui é que ela foi tentada.)
    expect(transcreveu).toBe(true);
  });
});
