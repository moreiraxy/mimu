import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal } from "./ambiente-local";
import type { Database } from "@/types/database";
import type { MensagemRecebida } from "@/lib/canais/tipos";

/**
 * O atendimento do canal: idempotência (4.3), número não vinculado (4.1) e
 * mascaramento do telefone no log (4.7).
 *
 * Roda contra o Postgres local porque a idempotência É o índice único do
 * banco — testá-la com mock testaria o mock.
 */

const ambiente = aplicarAmbienteLocal();

const { atender } = await import("@/lib/canais/atendimento");
const { mascararRemetente } = await import("@/lib/canais/tipos");
const { criarCodigoDeVinculo, confirmarVinculo } = await import(
  "@/lib/whatsapp/vinculo"
);
const { createClientComoUsuario } = await import("@/lib/supabase/como-usuario");
const { comIdentidade } = await import("@/lib/supabase/identidade");

const service = createRawClient<Database>(
  ambiente.url,
  ambiente.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

let userId: string;
let empresaId: string;
const telefone = "5511977777777";

function mensagem(id: string, texto = "quanto vendi hoje?"): MensagemRecebida {
  return {
    canal: "whatsapp",
    idNoCanal: id,
    remetente: telefone,
    texto,
    recebidaEm: new Date(),
  };
}

/** Um atendente que conta quantas vezes foi chamado. */
function atendenteQueConta() {
  let chamadas = 0;
  return {
    get chamadas() {
      return chamadas;
    },
    responder: async () => {
      chamadas += 1;
      return "resposta";
    },
  };
}

beforeAll(async () => {
  const { data, error } = await service.auth.admin.createUser({
    email: `canal-${Date.now()}@teste.mimu`,
    password: "senha-de-teste-123",
    email_confirm: true,
    user_metadata: { nome_negocio: "Salão de teste" },
  });
  if (error || !data.user) throw new Error(`conta: ${error?.message}`);
  userId = data.user.id;

  const { data: empresa } = await service
    .from("empresas")
    .select("id")
    .eq("user_id", userId)
    .single();
  empresaId = empresa!.id;

  const codigo = await criarCodigoDeVinculo(
    comIdentidade(createClientComoUsuario(userId)),
    empresaId,
    userId,
  );
  await confirmarVinculo(telefone, codigo!.codigo);
});

afterAll(async () => {
  if (userId) await service.auth.admin.deleteUser(userId);
});

describe("idempotência (4.3)", () => {
  it("a mesma mensagem entregue duas vezes só é atendida uma", async () => {
    const atendente = atendenteQueConta();
    const m = mensagem(`repetida-${Date.now()}`);

    const primeira = await atender(m, atendente.responder);
    const segunda = await atender(m, atendente.responder);

    expect(primeira).not.toBeNull();
    // A segunda não responde nada: responder de novo faria a pessoa receber
    // a mesma coisa duas vezes, e na fase 5 gravaria a mesma venda duas vezes.
    expect(segunda).toBeNull();
    expect(atendente.chamadas).toBe(1);
  });

  it("mensagens diferentes são atendidas cada uma", async () => {
    const atendente = atendenteQueConta();
    const base = Date.now();

    await atender(mensagem(`a-${base}`), atendente.responder);
    await atender(mensagem(`b-${base}`), atendente.responder);

    expect(atendente.chamadas).toBe(2);
  });

  it("duas entregas SIMULTÂNEAS da mesma mensagem também só passam uma", async () => {
    /*
     * O caso que uma consulta antes do insert não pegaria: as duas leriam
     * "ainda não existe" e as duas seguiriam. Quem impede é o índice único.
     */
    const atendente = atendenteQueConta();
    const m = mensagem(`corrida-${Date.now()}`);

    const [um, dois] = await Promise.all([
      atender(m, atendente.responder),
      atender(m, atendente.responder),
    ]);

    expect([um, dois].filter((r) => r !== null)).toHaveLength(1);
    expect(atendente.chamadas).toBe(1);
  });
});

describe("número não vinculado (4.1)", () => {
  it("recebe instrução de como conectar, e nada de dado", async () => {
    const atendente = atendenteQueConta();
    const resposta = await atender(
      {
        canal: "whatsapp",
        idNoCanal: `desconhecido-${Date.now()}`,
        remetente: "5511911111111",
        texto: "quanto eu vendi?",
        recebidaEm: new Date(),
      },
      atendente.responder,
    );

    expect(resposta?.texto).toContain("Conectar WhatsApp");
    // O atendente NÃO é chamado: quem não está vinculada não chega perto do
    // agente nem dos dados.
    expect(atendente.chamadas).toBe(0);
  });
});

describe("log de interação (4.7)", () => {
  it("grava o telefone mascarado, nunca inteiro", async () => {
    const id = `log-${Date.now()}`;
    await atender(mensagem(id), async () => "ok");

    const { data } = await service
      .from("canal_mensagens")
      .select("remetente_mascarado, resultado, empresa_id")
      .eq("mensagem_id", id)
      .single();

    expect(data!.remetente_mascarado).not.toContain(telefone);
    expect(data!.remetente_mascarado).toBe("5511*******77");
    expect(data!.resultado).toBe("respondida");
    expect(data!.empresa_id).toBe(empresaId);
  });

  it("o conteúdo da mensagem nunca é gravado", async () => {
    const id = `sigilo-${Date.now()}`;
    const segredo = "faturei 87431 reais com o contrato da prefeitura";
    await atender(mensagem(id, segredo), async () => "ok");

    const { data } = await service
      .from("canal_mensagens")
      .select("*")
      .eq("mensagem_id", id)
      .single();

    expect(JSON.stringify(data)).not.toContain("87431");
    expect(JSON.stringify(data)).not.toContain("prefeitura");
  });

  it("mascarar preserva começo e fim, esconde o meio", () => {
    expect(mascararRemetente("5511999998888")).toBe("5511*******88");
    expect(mascararRemetente("+55 (11) 99999-8888")).toBe("5511*******88");
    // Número curto demais some inteiro em vez de vazar quase tudo.
    expect(mascararRemetente("12345")).toBe("*****");
  });
});

describe("uma conta, um número por vez", () => {
  it("conectar um segundo número desliga o primeiro", async () => {
    const segundo = "5511966666666";

    const codigo = await criarCodigoDeVinculo(
      comIdentidade(createClientComoUsuario(userId)),
      empresaId,
      userId,
    );
    await confirmarVinculo(segundo, codigo!.codigo);

    const { buscarVinculoAtivo } = await import("@/lib/whatsapp/vinculo");

    // O novo vale...
    expect((await buscarVinculoAtivo(segundo))?.empresaId).toBe(empresaId);
    // ...e o antigo parou de valer. Sem isto ele seguiria lendo o financeiro
    // sem aparecer na tela, que mostra um número só.
    expect(await buscarVinculoAtivo(telefone)).toBeNull();
  });
});

describe("áudio (transcrição custa dinheiro)", () => {
  it("número NÃO vinculado nunca faz a gente baixar nem transcrever", async () => {
    let baixou = false;

    const resposta = await atender(
      {
        canal: "whatsapp",
        idNoCanal: `audio-desconhecido-${Date.now()}`,
        remetente: "5511900009999",
        texto: "",
        obterAudio: async () => {
          baixou = true;
          return Buffer.from("");
        },
        recebidaEm: new Date(),
      },
      async () => "nunca chega aqui",
    );

    // A resposta é a de sempre para quem não conectou...
    expect(resposta?.texto).toContain("Conectar WhatsApp");
    // ...e o áudio nem foi baixado. Sem isto, qualquer desconhecido mandando
    // áudio geraria custo de banda e de transcrição.
    expect(baixou).toBe(false);
  });

  it("mensagem repetida também não rebaixa o áudio", async () => {
    let vezes = 0;
    const m = {
      canal: "whatsapp" as const,
      idNoCanal: `audio-repetido-${Date.now()}`,
      remetente: telefone,
      texto: "",
      obterAudio: async () => {
        vezes += 1;
        return Buffer.from("");
      },
      recebidaEm: new Date(),
    };

    await atender(m, async () => "ok");
    await atender(m, async () => "ok");

    // A segunda entrega para na idempotência, antes de tocar no áudio.
    expect(vezes).toBeLessThanOrEqual(1);
  });
});
