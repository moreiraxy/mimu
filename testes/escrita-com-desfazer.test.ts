import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal } from "./ambiente-local";
import type { Database } from "@/types/database";
import type { ClassificacaoMimu } from "@/lib/mimu-prompts";

/**
 * Escrita com recibo e desfazer (4.4), ambiguidade virando pergunta (4.5) e
 * operação destrutiva bloqueada (4.6).
 *
 * Testa `registrar` e `desfazerUltima` diretamente, sem passar pelo
 * classificador: o que precisa ser garantido aqui é o que acontece DEPOIS de
 * a intenção estar entendida. Mandar isso pelo modelo tornaria o teste caro,
 * dependente de rede e diferente a cada rodada.
 */

const ambiente = aplicarAmbienteLocal();

const { createClientComoUsuario } = await import("@/lib/supabase/como-usuario");
const { comIdentidade } = await import("@/lib/supabase/identidade");
const { registrar } = await import("@/lib/mimu/registro");
const { desfazerUltima, pediuParaDesfazer, pedidoBloqueado } = await import(
  "@/lib/mimu/desfazer"
);

const service = createRawClient<Database>(
  ambiente.url,
  ambiente.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

let userId: string;
let empresaId: string;

function venda(valor: number, extra: Partial<ClassificacaoMimu["dados"]> = {}) {
  return {
    intencao: "registro",
    tipo: "entrada",
    dados: { valor, descricao: null, cliente: null, data: null, horario: null, ...extra },
  } as ClassificacaoMimu;
}

beforeAll(async () => {
  const { data } = await service.auth.admin.createUser({
    email: `esc-${Date.now()}@teste.mimu`,
    password: "senha-de-teste-123",
    email_confirm: true,
    user_metadata: { nome_negocio: "Bolos da Ana" },
  });
  userId = data.user!.id;
  const { data: e } = await service
    .from("empresas").select("id").eq("user_id", userId).single();
  empresaId = e!.id;
});

afterAll(async () => {
  if (userId) await service.auth.admin.deleteUser(userId);
});

describe("recibo e desfazer (4.4)", () => {
  it("grava, devolve recibo com o valor, e oferece a saída", async () => {
    const supabase = comIdentidade(createClientComoUsuario(userId));
    const r = await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}`,
      venda(135, { descricao: "3 bolos" }));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.recibo).toContain("3 bolos");
    expect(r.recibo).toContain("135");
    expect(r.recibo).toContain("desfazer");
  });

  it("desfazer tira a venda das contas, sem apagar a linha", async () => {
    const supabase = comIdentidade(createClientComoUsuario(userId));
    await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-a`, venda(777));

    const antes = await supabase.from("transacoes").select("valor").eq("empresa_id", empresaId);
    expect(antes.data!.map((t) => Number(t.valor))).toContain(777);

    const desfeita = await desfazerUltima(supabase, empresaId);
    expect(desfeita.ok).toBe(true);

    // Sumiu da consulta da dona...
    const depois = await supabase.from("transacoes").select("valor").eq("empresa_id", empresaId);
    expect(depois.data!.map((t) => Number(t.valor))).not.toContain(777);

    // ...mas a linha continua existindo. Desfazer por engano tem volta.
    const { data: cru } = await service
      .from("transacoes").select("valor, revertida_em")
      .eq("empresa_id", empresaId).eq("valor", 777).single();
    expect(cru!.revertida_em).not.toBeNull();
  });

  it("desfazer duas vezes não desfaz a venda anterior por tabela", async () => {
    const supabase = comIdentidade(createClientComoUsuario(userId));
    await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-b`, venda(11));
    await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-c`, venda(22));

    // Desfaz a última (22), depois a anterior (11). Cada "desfazer" pega uma.
    expect((await desfazerUltima(supabase, empresaId)).ok).toBe(true);
    expect((await desfazerUltima(supabase, empresaId)).ok).toBe(true);

    const { data } = await supabase.from("transacoes").select("valor").eq("empresa_id", empresaId);
    const valores = (data ?? []).map((t) => Number(t.valor));
    expect(valores).not.toContain(11);
    expect(valores).not.toContain(22);
  });

  it("sem nada recente, avisa em vez de desfazer coisa antiga", async () => {
    const { data: outra } = await service.auth.admin.createUser({
      email: `esc-nada-${Date.now()}@teste.mimu`,
      password: "senha-de-teste-123", email_confirm: true,
      user_metadata: { nome_negocio: "Nada" },
    });
    const { data: e } = await service
      .from("empresas").select("id").eq("user_id", outra.user!.id).single();

    const supabase = comIdentidade(createClientComoUsuario(outra.user!.id));
    const r = await desfazerUltima(supabase, e!.id);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("nada_para_desfazer");

    await service.auth.admin.deleteUser(outra.user!.id);
  });
});

describe("ambiguidade vira pergunta (4.5)", () => {
  it("com duas clientes de mesmo nome, PERGUNTA e não grava nada", async () => {
    const supabase = comIdentidade(createClientComoUsuario(userId));
    await service.from("clientes").insert([
      { empresa_id: empresaId, nome: "Maria Silva" },
      { empresa_id: empresaId, nome: "Maria Santos" },
    ]);

    const antes = await supabase
      .from("transacoes").select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId);

    const r = await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-d`,
      venda(50, { cliente: "Maria" }));

    expect(r.ok).toBe(false);
    // `expect` não estreita a união para o TypeScript — a checagem explícita
    // é o que dá acesso a `pergunta`, que só existe nos dois motivos que
    // perguntam.
    if (r.ok || r.motivo === "falhou") throw new Error("esperava ambiguidade");
    expect(r.motivo).toBe("ambiguo");
    expect(r.pergunta).toContain("Maria Silva");
    expect(r.pergunta).toContain("Maria Santos");

    // E, crucialmente, NADA foi gravado. Escolher uma em silêncio poria a
    // venda na ficha da pessoa errada, e ninguém descobriria.
    const depois = await supabase
      .from("transacoes").select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId);
    expect(depois.count).toBe(antes.count);
  });

  it("com uma cliente só, grava e diz o nome dela no recibo", async () => {
    const supabase = comIdentidade(createClientComoUsuario(userId));
    await service.from("clientes").insert({ empresa_id: empresaId, nome: "Joana Prado" });

    const r = await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-e`,
      venda(80, { cliente: "Joana" }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.recibo).toContain("Joana Prado");
  });
});

describe("operação destrutiva fica fora do canal (4.6)", () => {
  it("reconhece pedidos de apagar em massa", () => {
    for (const p of ["apaga tudo", "quero excluir todas as vendas", "zerar o caixa"]) {
      expect(pedidoBloqueado(p), p).toBe(true);
    }
  });

  it("não confunde pedido normal com destrutivo", () => {
    for (const p of ["vendi 3 bolos hoje", "quanto vendi essa semana?", "apaga essa última"]) {
      expect(pedidoBloqueado(p), p).toBe(false);
    }
  });

  it("reconhece desfazer sem passar por IA", () => {
    expect(pediuParaDesfazer("desfazer")).toBe(true);
    expect(pediuParaDesfazer("  DESFAZER  ")).toBe(true);
    expect(pediuParaDesfazer("tá errado")).toBe(true);
    expect(pediuParaDesfazer("desfazer a venda de ontem")).toBe(false);
  });
});

describe("a reversão não abre porta pra outra conta", () => {
  it("a função do banco recusa desfazer operação alheia", async () => {
    /*
     * A função é SECURITY DEFINER e roda como dona do schema, então ela
     * passa por cima do RLS. O que impede o abuso é a checagem de dono
     * dentro dela — este teste existe para provar que ela está lá, porque
     * removê-la por engano não quebraria nada visível.
     */
    const supabase = comIdentidade(createClientComoUsuario(userId));
    await registrar(supabase, empresaId, "whatsapp", `m-${Date.now()}-x`, venda(313));

    const { data: op } = await service
      .from("operacoes_canal")
      .select("id")
      .eq("empresa_id", empresaId)
      .is("desfeita_em", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: intrusa } = await service.auth.admin.createUser({
      email: `intrusa-${Date.now()}@teste.mimu`,
      password: "senha-de-teste-123", email_confirm: true,
      user_metadata: { nome_negocio: "Intrusa" },
    });

    const comoIntrusa = comIdentidade(createClientComoUsuario(intrusa.user!.id));
    const { data: conseguiu } = await comoIntrusa.rpc("desfazer_operacao_canal", {
      p_operacao_id: op!.id,
    });

    // Recusa devolvendo false, sem erro: a operação simplesmente não é dela.
    expect(conseguiu).toBe(false);

    // E a venda continua valendo para a dona.
    const { data } = await supabase
      .from("transacoes").select("valor").eq("empresa_id", empresaId);
    expect((data ?? []).map((t) => Number(t.valor))).toContain(313);

    await service.auth.admin.deleteUser(intrusa.user!.id);
  });
});
