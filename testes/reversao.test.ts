import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal } from "./ambiente-local";
import type { Database } from "@/types/database";

/**
 * A propriedade que sustenta a fase 5: uma operação revertida some de TODA
 * consulta, sem que nenhuma consulta precise saber disso.
 *
 * O filtro mora na policy de SELECT. São 20 pontos de leitura de `transacoes`
 * e 10 arquivos lendo `agendamentos`; se o filtro dependesse de cada um deles
 * lembrar, um dia alguém esqueceria — e o sintoma seria uma venda desfeita
 * continuando a somar no faturamento do mês, sem erro e sem log.
 *
 * Estes testes fazem consultas SEM filtro nenhum, de propósito. É o que
 * qualquer pessoa escreveria sem pensar no assunto.
 */

const ambiente = aplicarAmbienteLocal();

const { createClientComoUsuario } = await import("@/lib/supabase/como-usuario");

const service = createRawClient<Database>(
  ambiente.url,
  ambiente.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

let userId: string;
let empresaId: string;

beforeAll(async () => {
  const { data } = await service.auth.admin.createUser({
    email: `rev-${Date.now()}@teste.mimu`,
    password: "senha-de-teste-123",
    email_confirm: true,
    user_metadata: { nome_negocio: "Doceria de teste" },
  });
  userId = data.user!.id;

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

async function criarVenda(valor: number) {
  const { data } = await service
    .from("transacoes")
    .insert({
      empresa_id: empresaId,
      tipo: "entrada",
      valor,
      descricao: "venda de teste",
      data: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  return data!.id;
}

describe("reversão lógica some de toda consulta", () => {
  it("a venda aparece antes e some depois de revertida", async () => {
    const id = await criarVenda(150);
    const comoDona = createClientComoUsuario(userId);

    const antes = await comoDona.from("transacoes").select("id").eq("id", id);
    expect(antes.data).toHaveLength(1);

    await service
      .from("transacoes")
      .update({ revertida_em: new Date().toISOString() })
      .eq("id", id);

    const depois = await comoDona.from("transacoes").select("id").eq("id", id);
    expect(depois.data).toEqual([]);
  });

  it("some também de uma consulta que NÃO sabe que reversão existe", async () => {
    /*
     * O teste que importa. Esta consulta é a que já está escrita em 20 lugares
     * do produto: pega as transações da empresa e soma. Ela não filtra nada,
     * e não precisa — quem filtra é o banco.
     */
    const id = await criarVenda(9999);
    const comoDona = createClientComoUsuario(userId);

    await service
      .from("transacoes")
      .update({ revertida_em: new Date().toISOString() })
      .eq("id", id);

    const { data } = await comoDona
      .from("transacoes")
      .select("valor")
      .eq("empresa_id", empresaId);

    const valores = (data ?? []).map((t) => Number(t.valor));
    expect(valores).not.toContain(9999);
  });

  it("a linha continua existindo — reversão não é delete", async () => {
    const id = await criarVenda(77);
    await service
      .from("transacoes")
      .update({ revertida_em: new Date().toISOString() })
      .eq("id", id);

    // A service role ignora o RLS e ainda enxerga: o dado não foi destruído,
    // só tirado das contas. Desfazer por engano tem volta.
    const { data } = await service
      .from("transacoes")
      .select("id, valor, revertida_em")
      .eq("id", id)
      .single();

    expect(data).not.toBeNull();
    expect(Number(data!.valor)).toBe(77);
    expect(data!.revertida_em).not.toBeNull();
  });

  it("desfazer não vaza para outra conta", async () => {
    // A policy nova não pode ter afrouxado o isolamento ao ser dividida em
    // quatro. Uma conta continua sem enxergar a transação da outra.
    const id = await criarVenda(42);

    const { data: outra } = await service.auth.admin.createUser({
      email: `rev-outra-${Date.now()}@teste.mimu`,
      password: "senha-de-teste-123",
      email_confirm: true,
      user_metadata: { nome_negocio: "Outra" },
    });

    const comoOutra = createClientComoUsuario(outra.user!.id);
    const { data } = await comoOutra.from("transacoes").select("id").eq("id", id);
    expect(data).toEqual([]);

    await service.auth.admin.deleteUser(outra.user!.id);
  });
});
