import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { aplicarAmbienteLocal } from "./ambiente-local";
import type { Database } from "@/types/database";

/**
 * O teste que a seção 4.2 do brief exige: tentar alcançar o dado de outra
 * conta e falhar.
 *
 * Roda contra um Postgres de verdade, com as migrations aplicadas, e não
 * contra mock. Testar RLS com mock testa o mock — as policies são código do
 * banco, e ou elas rodam ou não há o que verificar.
 *
 * O que este arquivo protege: a Mimu passa a responder pelo WhatsApp, um canal
 * SEM sessão. O caminho fácil seria usar service role e filtrar por
 * `empresa_id` na aplicação; a consulta que esquecesse o filtro devolveria o
 * faturamento de todas as empresas, sem erro e sem log. Em vez disso o canal
 * emite um token com a identidade da pessoa vinculada, e é o banco que isola.
 * Estes testes existem para provar que isso funciona — e o `it` do controle,
 * no fim, existe para provar que os outros não passam por acidente.
 */

const ambiente = aplicarAmbienteLocal();

// Importados DEPOIS de aplicar o ambiente: os módulos leem process.env.
const { createClientComoUsuario } = await import("@/lib/supabase/como-usuario");
const { buscarVinculoAtivo, confirmarVinculo, criarCodigoDeVinculo } =
  await import("@/lib/whatsapp/vinculo");
const { comIdentidade } = await import("@/lib/supabase/identidade");

const service = createRawClient<Database>(
  ambiente.url,
  ambiente.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface Conta {
  userId: string;
  empresaId: string;
  email: string;
}

async function criarConta(nome: string): Promise<Conta> {
  const email = `${nome}-${Date.now()}@teste.mimu`;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password: "senha-de-teste-123",
    email_confirm: true,
    // A trigger em auth.users cria a empresa lendo isto do metadata.
    user_metadata: { nome_negocio: `Negócio da ${nome}` },
  });
  if (error || !data.user) throw new Error(`Não criei a conta ${nome}: ${error?.message}`);

  const { data: empresa, error: erroEmpresa } = await service
    .from("empresas")
    .select("id")
    .eq("user_id", data.user.id)
    .single();
  // O erro entra na mensagem: engolir custou uma investigação inteira até
  // descobrir que era falta de privilégio, e não a trigger.
  if (!empresa) {
    throw new Error(
      `Não achei a empresa da ${nome}: ${erroEmpresa?.message ?? "sem linha"}`,
    );
  }

  return { userId: data.user.id, empresaId: empresa.id, email };
}

/** Uma venda e um cliente, para haver o que vazar. */
async function semearDados(conta: Conta, valor: number, nomeCliente: string) {
  await service.from("transacoes").insert({
    empresa_id: conta.empresaId,
    tipo: "entrada",
    valor,
    descricao: `Venda de ${nomeCliente}`,
    data: new Date().toISOString().slice(0, 10),
  });
  await service.from("clientes").insert({
    empresa_id: conta.empresaId,
    nome: nomeCliente,
  });
  await service.from("conversas_mimu").insert({
    empresa_id: conta.empresaId,
    role: "user",
    content: `Quanto vendi, ${nomeCliente}?`,
  });
}

let alice: Conta;
let bruna: Conta;

beforeAll(async () => {
  alice = await criarConta("alice");
  bruna = await criarConta("bruna");
  await semearDados(alice, 100, "Cliente da Alice");
  await semearDados(bruna, 999, "Cliente da Bruna");
});

afterAll(async () => {
  // Apagar o usuário do auth leva o resto no cascade.
  for (const conta of [alice, bruna]) {
    if (conta) await service.auth.admin.deleteUser(conta.userId);
  }
});

describe("um client emitido para uma conta não alcança a outra", () => {
  it("enxerga as próprias vendas", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);
    const { data } = await comoAlice
      .from("transacoes")
      .select("valor")
      .eq("empresa_id", alice.empresaId);

    expect(data).toHaveLength(1);
    expect(Number(data![0]!.valor)).toBe(100);
  });

  /*
   * O teste mais importante do arquivo.
   *
   * A consulta NÃO filtra por empresa — é exatamente a consulta que alguém
   * escreve sem querer. Com o RLS valendo, o banco devolve só o que é da
   * Alice. Se um dia alguém trocar este caminho por service role, este teste
   * quebra imediatamente, e é para isso que ele existe.
   */
  it("uma consulta SEM filtro ainda só devolve o que é dela", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);
    const { data } = await comoAlice.from("transacoes").select("valor");

    expect(data).toHaveLength(1);
    expect(Number(data![0]!.valor)).toBe(100);
  });

  it("pedir o dado da outra conta pelo id devolve vazio, não erro", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);
    const { data, error } = await comoAlice
      .from("transacoes")
      .select("valor")
      .eq("empresa_id", bruna.empresaId);

    // Vazio e sem erro é o comportamento certo do RLS: a linha simplesmente
    // não existe para quem pergunta. Erro revelaria que ela existe.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("clientes, agenda e conversas seguem a mesma regra", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);

    for (const tabela of ["clientes", "agendamentos", "conversas_mimu"] as const) {
      const { data } = await comoAlice.from(tabela).select("empresa_id");
      const alheias = (data ?? []).filter(
        (linha) => linha.empresa_id !== alice.empresaId,
      );
      expect(alheias, `vazou em ${tabela}`).toEqual([]);
    }
  });

  it("não consegue ESCREVER na conta da outra", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);
    const { error } = await comoAlice.from("transacoes").insert({
      empresa_id: bruna.empresaId,
      tipo: "entrada",
      valor: 1,
      descricao: "invasão",
      data: new Date().toISOString().slice(0, 10),
    });

    // Aqui o RLS PRECISA errar alto: escrita recusada é erro, não silêncio.
    expect(error).not.toBeNull();
  });

  /*
   * O controle.
   *
   * Prova que os testes acima passam por causa do RLS, e não porque o banco
   * está vazio ou porque a semeadura falhou. A service role enxerga as duas
   * contas; se ESTE teste falhar, os outros não valem nada.
   */
  it("controle: a service role enxerga as duas — é o RLS que isola", async () => {
    const { data } = await service
      .from("transacoes")
      .select("empresa_id")
      .in("empresa_id", [alice.empresaId, bruna.empresaId]);

    const empresas = new Set((data ?? []).map((t) => t.empresa_id));
    expect(empresas.size).toBe(2);
  });
});

describe("o vínculo do WhatsApp aponta para a conta certa", () => {
  /*
   * Único por rodada: os arquivos de teste rodam em paralelo e o teto do
   * vínculo é por número. Número fixo faria um arquivo gastar a cota do outro,
   * e a falha apareceria em qualquer um dos dois, de forma intermitente.
   */
  const telefoneAlice = `55119${Date.now().toString().slice(-8)}`;

  it("número vinculado resolve para a dona dele", async () => {
    const comoAlice = comIdentidade(createClientComoUsuario(alice.userId));
    const codigo = await criarCodigoDeVinculo(
      comoAlice,
      alice.empresaId,
      alice.userId,
    );
    expect(codigo).not.toBeNull();

    const confirmacao = await confirmarVinculo(telefoneAlice, codigo!.codigo);
    expect(confirmacao.ok).toBe(true);

    const vinculo = await buscarVinculoAtivo(telefoneAlice);
    expect(vinculo?.empresaId).toBe(alice.empresaId);
    expect(vinculo?.userId).toBe(alice.userId);
  });

  it("número desconhecido não resolve para conta nenhuma", async () => {
    expect(await buscarVinculoAtivo("5511999999999")).toBeNull();
  });

  it("código de uma conta não vincula o número a outra", async () => {
    const comoBruna = comIdentidade(createClientComoUsuario(bruna.userId));
    const codigoDaBruna = await criarCodigoDeVinculo(
      comoBruna,
      bruna.empresaId,
      bruna.userId,
    );

    const telefoneBruna = `55118${Date.now().toString().slice(-8)}`;
    await confirmarVinculo(telefoneBruna, codigoDaBruna!.codigo);

    const vinculo = await buscarVinculoAtivo(telefoneBruna);
    expect(vinculo?.empresaId).toBe(bruna.empresaId);
    // E o da Alice continua sendo dela.
    expect((await buscarVinculoAtivo(telefoneAlice))?.empresaId).toBe(
      alice.empresaId,
    );
  });

  it("a Alice não enxerga o vínculo da Bruna", async () => {
    const comoAlice = createClientComoUsuario(alice.userId);
    const { data } = await comoAlice.from("whatsapp_links").select("empresa_id");

    const alheios = (data ?? []).filter((l) => l.empresa_id !== alice.empresaId);
    expect(alheios).toEqual([]);
  });

  it("código inválido não vincula nada", async () => {
    const resultado = await confirmarVinculo("5511900000003", "ZZZZZZ");
    expect(resultado.ok).toBe(false);
    expect(await buscarVinculoAtivo("5511900000003")).toBeNull();
  });
});
