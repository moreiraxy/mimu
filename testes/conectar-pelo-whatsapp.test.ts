import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal } from "./ambiente-local";
import type { Database } from "@/types/database";
import type { MensagemRecebida } from "@/lib/canais/tipos";

/**
 * O passo 3 do vínculo: o código chega pelo WhatsApp e fecha a conexão.
 *
 * ESTE TESTE EXISTE POR UM MOTIVO ESPECÍFICO. `confirmarVinculo` estava escrita,
 * comentada e coberta por teste — e nenhum arquivo a chamava. Todo número caía
 * na resposta de "ainda não te conheço", inclusive quem tinha acabado de pegar
 * o código no app. Conectar era impossível, e a resposta mandava a pessoa fazer
 * exatamente o que não funcionava.
 *
 * Testar a função isoladamente não pegava isso: ela sempre funcionou. O que
 * faltava era a ligação. Por isso aqui a entrada é uma MENSAGEM chegando, como
 * na vida real, e não uma chamada direta.
 */

const ambiente = aplicarAmbienteLocal();

const { atender } = await import("@/lib/canais/atendimento");
const { criarCodigoDeVinculo } = await import("@/lib/whatsapp/vinculo");
const { createClientComoUsuario } = await import("@/lib/supabase/como-usuario");
const { comIdentidade } = await import("@/lib/supabase/identidade");

const service = createRawClient<Database>(ambiente.url, ambiente.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId: string;
let empresaId: string;

// Número próprio deste arquivo: o teto de tentativas é POR NÚMERO, e um número
// compartilhado com outro teste esgotaria a cota antes da hora.
const telefone = `55119${Date.now().toString().slice(-8)}`;

let sequencia = 0;
function mensagem(texto: string): MensagemRecebida {
  sequencia += 1;
  return {
    canal: "whatsapp",
    idNoCanal: `conectar-${Date.now()}-${sequencia}`,
    remetente: telefone,
    texto,
    recebidaEm: new Date(),
  };
}

const naoDeveriaAtender = async () => {
  throw new Error("o agente foi chamado para um número que não está vinculado");
};

async function pegarCodigo(): Promise<string> {
  const criado = await criarCodigoDeVinculo(
    comIdentidade(createClientComoUsuario(userId)),
    empresaId,
    userId,
  );
  if (!criado) throw new Error("não consegui criar o código");
  return criado.codigo;
}

beforeAll(async () => {
  const { data, error } = await service.auth.admin.createUser({
    email: `conectar-${Date.now()}@teste.mimu`,
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
});

afterAll(async () => {
  if (userId) await service.auth.admin.deleteUser(userId);
});

describe("conectar o WhatsApp mandando o código", () => {
  it("fecha o vínculo quando o código vem na mensagem", async () => {
    const codigo = await pegarCodigo();

    const resposta = await atender(
      mensagem(`Oi Mimu! Meu código é ${codigo}`),
      naoDeveriaAtender,
    );

    expect(resposta?.texto).toContain("conectei");

    // E o vínculo existe de verdade no banco, não só na resposta.
    const { data } = await service
      .from("whatsapp_links")
      .select("telefone, verificado_em, empresa_id")
      .eq("empresa_id", empresaId)
      .not("verificado_em", "is", null)
      .is("revogado_em", null)
      .maybeSingle();

    expect(data?.telefone).toBe(telefone);
    expect(data?.verificado_em).toBeTruthy();
  });

  it("aceita o código sozinho, sem frase em volta", async () => {
    // Nem todo mundo usa o botão que monta a mensagem. Quem digita só o código
    // precisa funcionar igual.
    await service
      .from("whatsapp_links")
      .update({ revogado_em: new Date().toISOString() })
      .eq("empresa_id", empresaId)
      .is("revogado_em", null);

    const codigo = await pegarCodigo();
    const resposta = await atender(mensagem(codigo.toLowerCase()), naoDeveriaAtender);

    expect(resposta?.texto).toContain("conectei");
  });

  it("fica CALADA para uma sequência que NUNCA foi código", async () => {
    /*
     * ESTE TESTE AFIRMAVA O DEFEITO.
     *
     * Ele mandava "ABC234" — uma sequência com a cara certa que a Mimu nunca
     * emitiu — e exigia a resposta de "código expirado". Ou seja: exigia que
     * qualquer texto no formato recebesse um automático, que é exatamente o
     * que fazia um prospect escrevendo "pode me ajudar?" ser respondido.
     *
     * O certo é o oposto: nunca emitido é palavra, e palavra recebe silêncio.
     * Quem mandou um código de verdade que venceu continua sendo atendido —
     * é o teste logo abaixo, com um código realmente emitido.
     */
    await service
      .from("whatsapp_links")
      .update({ revogado_em: new Date().toISOString() })
      .eq("empresa_id", empresaId)
      .is("revogado_em", null);

    const resposta = await atender(mensagem("ABC234"), naoDeveriaAtender);

    expect(resposta).toBeNull();
  });

  it("fica CALADA para número desconhecido sem código", async () => {
    /*
     * O número da Mimu é o mesmo usado para prospecção humana. Responder aqui
     * significaria mandar um texto automático para cada prospect que responde
     * a um contato comercial — confuso para ele, atrapalha a venda, e é o
     * padrão exato que faz o WhatsApp bloquear uma conta.
     *
     * Perder o número custaria as duas coisas de uma vez.
     */
    const resposta = await atender(mensagem("oi, tudo bem?"), naoDeveriaAtender);

    expect(resposta).toBeNull();
  });

  it("fica CALADA quando a palavra tem a CARA de um código", async () => {
    /*
     * ESTE TESTE JÁ EXISTIA E PASSAVA — com a frase errada.
     *
     * Ele usava "bom dia, gostaria de saber sobre vendas", que não casa com o
     * formato do código, e por isso passava mesmo com o defeito de pé. Dava
     * segurança falsa exatamente onde mais custa.
     *
     * O formato é seis caracteres de um alfabeto sem I, L, O, S, 0, 1 e 5, e
     * o comentário do código afirmava que isso não casa com palavra comum do
     * português. Casa: destas cinco, TODAS casam. E como o número da Mimu é o
     * mesmo da prospecção, cada uma fazia um prospect receber "esse código não
     * vale mais" — sobre um código que ele nunca teve.
     */
    const frasesDeProspect = [
      "oi, pode me ajudar?",
      "vc pode fechar comigo?",
      "quero saber mais, pode chamar?",
      "quarta pode ser",
      "pode mandar por aqui",
    ];

    for (const frase of frasesDeProspect) {
      const resposta = await atender(mensagem(frase), naoDeveriaAtender);
      expect(resposta, `"${frase}" deveria receber silêncio`).toBeNull();
    }
  });

  it("ainda explica o prazo para um código de verdade que venceu", async () => {
    /*
     * O silêncio acima não pode engolir quem realmente tentou conectar. A
     * diferença entre os dois casos é o banco: uma sequência que a Mimu emitiu
     * um dia merece a explicação dos dez minutos; uma que nunca existiu é
     * palavra.
     */
    const { codigo } = (await criarCodigoDeVinculo(
      comIdentidade(createClientComoUsuario(userId)),
      empresaId,
      userId,
    ))!;

    await service
      .from("whatsapp_links")
      .update({ codigo_expira_em: new Date(Date.now() - 60_000).toISOString() })
      .eq("codigo", codigo);

    const resposta = await atender(
      mensagem(`Oi Mimu! Meu código é ${codigo}`),
      naoDeveriaAtender,
    );

    expect(resposta?.texto).toContain("não vale mais");
  });
});
