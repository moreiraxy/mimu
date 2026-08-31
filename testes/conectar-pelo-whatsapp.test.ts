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

  it("explica o prazo quando o código não vale mais", async () => {
    await service
      .from("whatsapp_links")
      .update({ revogado_em: new Date().toISOString() })
      .eq("empresa_id", empresaId)
      .is("revogado_em", null);

    /*
     * Um código que tem a cara certa e não existe.
     *
     * Cair na resposta padrão de "não te conheço" faria a pessoa repetir
     * exatamente o que acabou de fazer, sem entender que o problema é o prazo
     * de dez minutos.
     */
    const resposta = await atender(mensagem("ABC234"), naoDeveriaAtender);

    expect(resposta?.texto).toContain("não vale mais");
  });

  it("responde o convite normal quando não há código nenhum", async () => {
    const resposta = await atender(mensagem("oi, tudo bem?"), naoDeveriaAtender);

    expect(resposta?.texto).toContain("Ainda não reconheço");
  });

  it("não confunde palavra comum com código", async () => {
    /*
     * O alfabeto do código exclui I, L, O, S, 0, 1 e 5 — as letras e dígitos
     * que se confundem ao ler. O efeito colateral é bom: palavra do português
     * com seis letras quase sempre tem alguma dessas, então não é lida como
     * código por engano.
     */
    const resposta = await atender(
      mensagem("bom dia, gostaria de saber sobre vendas"),
      naoDeveriaAtender,
    );

    expect(resposta?.texto).toContain("Ainda não reconheço");
  });
});
