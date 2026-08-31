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
  it("plano gratuito não conversa com a IA por aqui", async () => {
    const conta = await criarConta("Gratuita");
    criadas.push(conta.userId);

    /*
     * O gratuito não inclui `ia` porque cada resposta custa na Groq. A regra
     * estava aplicada no app (o middleware barra /api/mimu) e era contornável
     * por mensagem — este teste é o que impede isso de voltar.
     */
    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null, valor_mensal: 0 })
      .eq("empresa_id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.sem_modulo_ia);
  });

  it("assinatura pendente também não — o plano gravado não vale sozinho", async () => {
    const conta = await criarConta("Pendente");
    criadas.push(conta.userId);

    // 'pendente' guarda o plano que a pessoa escolheu e NUNCA pagou. Se o
    // teto acreditasse no campo `plano`, quem parou na tela de pagamento teria
    // a Mimu inteira de graça pelo WhatsApp.
    await service
      .from("assinaturas")
      .update({ plano: "premium", status: "pendente" })
      .eq("empresa_id", conta.empresaId);

    const resposta = await responderPelaMimu(msg("quanto vendi?"), conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.sem_modulo_ia);
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

  it("plano gratuito: nem baixa o áudio", async () => {
    const conta = await criarConta("GratuitaAudio");
    criadas.push(conta.userId);
    await service
      .from("assinaturas")
      .update({ plano: "free", status: "ativa", proxima_cobranca: null })
      .eq("empresa_id", conta.empresaId);

    const { transcreveu, resposta } = await mandarAudio(conta);
    expect(resposta).toBe(RESPOSTA_SEM_ACESSO.sem_modulo_ia);
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
