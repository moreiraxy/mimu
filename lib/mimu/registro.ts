import { formatCurrency } from "@/lib/formatters";
import type { ClientComIdentidade } from "@/lib/supabase/identidade";
import type { ClassificacaoMimu } from "@/lib/mimu-prompts";
import type { Canal } from "@/lib/canais/tipos";

/**
 * Registrar venda, despesa e agendamento a partir de uma mensagem.
 *
 * O desenho do brief: GRAVA PRIMEIRO e oferece a saída depois. Pedir
 * confirmação antes ("você quis dizer 135 reais?") dobra o número de mensagens
 * e irrita quem está com a mão na massa — que é justamente a pessoa que esse
 * canal existe para atender.
 *
 * O preço desse desenho é que a saída precisa existir de verdade, e é por isso
 * que toda escrita daqui vira uma linha em `operacoes_canal` com janela de
 * reversão. Ver `desfazerUltima` e a migration 20260830170000.
 */

export type ResultadoRegistro =
  | { ok: true; recibo: string }
  /** Faltou informação. `pergunta` é o que devolver para a pessoa. */
  | { ok: false; motivo: "incompleto"; pergunta: string }
  /** Mais de um cliente com aquele nome. Perguntar, nunca escolher. */
  | { ok: false; motivo: "ambiguo"; pergunta: string }
  | { ok: false; motivo: "falhou" };

/** Hoje, no fuso de quem está usando, e não em UTC. */
function hojeISO(): string {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * Os clientes que batem com o nome dito, TODOS eles.
 *
 * O app faz `.limit(1).maybeSingle()` e fica com o primeiro que aparecer. Aqui
 * não: com três Marias cadastradas, escolher uma em silêncio grava a venda na
 * ficha da pessoa errada, e ninguém descobre — a dona só nota meses depois,
 * quando a Maria errada aparece como cliente fiel.
 *
 * Cadastro errado em silêncio é pior que cadastro não feito, porque contamina
 * o relatório e não deixa rastro de que houve dúvida.
 */
async function clientesQueBatem(
  supabase: ClientComIdentidade,
  empresaId: string,
  nome: string,
): Promise<{ id: string; nome: string }[]> {
  const { data } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("empresa_id", empresaId)
    .ilike("nome", `%${nome}%`)
    .limit(5);
  return data ?? [];
}

function reciboDeTransacao(
  tipo: "entrada" | "saida",
  valor: number,
  descricao: string | null,
  cliente: string | null,
  data: string,
  ehHoje: boolean,
): string {
  const partes = [descricao, cliente ? `de ${cliente}` : null].filter(Boolean);
  const oQue = partes.length > 0 ? partes.join(" ") : null;
  const quando = ehHoje ? "hoje" : data.split("-").reverse().slice(0, 2).join("/");
  const verbo = tipo === "entrada" ? "Registrei" : "Anotei a saída";

  return (
    `${verbo}: ${oQue ? `${oQue}, ` : ""}${formatCurrency(valor)}, ${quando}.\n\n` +
    "Se estiver errado, responda *desfazer*."
  );
}

export async function registrar(
  supabase: ClientComIdentidade,
  empresaId: string,
  canal: Canal,
  mensagemId: string,
  classificacao: ClassificacaoMimu,
): Promise<ResultadoRegistro> {
  const { tipo, dados } = classificacao;
  if (!tipo) return { ok: false, motivo: "falhou" };

  /*
   * Resolver o cliente ANTES de gravar.
   *
   * Se houver dúvida sobre quem é, nada é escrito. Gravar e perguntar depois
   * deixaria uma venda na ficha errada durante a conversa inteira — e se a
   * pessoa não respondesse, para sempre.
   */
  let clienteId: string | null = null;
  let clienteNome: string | null = null;

  if (dados.cliente) {
    const candidatos = await clientesQueBatem(supabase, empresaId, dados.cliente);

    if (candidatos.length > 1) {
      const nomes = candidatos.map((c) => c.nome).join(", ");
      return {
        ok: false,
        motivo: "ambiguo",
        pergunta:
          `Tenho mais de um cliente com esse nome: ${nomes}.\n\n` +
          "Me manda de novo com o nome completo pra eu não errar?",
      };
    }

    if (candidatos.length === 1) {
      clienteId = candidatos[0]!.id;
      clienteNome = candidatos[0]!.nome;
    }
  }

  const data = dados.data ?? hojeISO();
  const ehHoje = data === hojeISO();

  if (tipo === "agendamento") {
    const horario = dados.horario ?? "09:00";
    const { data: criado, error } = await supabase
      .from("agendamentos")
      .insert({
        empresa_id: empresaId,
        cliente_id: clienteId,
        titulo: dados.descricao || dados.cliente || "Agendamento",
        descricao: null,
        valor_previsto: dados.valor,
        data_hora: new Date(`${data}T${horario}:00`).toISOString(),
        duracao_minutos: null,
        status: "confirmado",
      })
      .select("id")
      .single();

    if (error || !criado) return { ok: false, motivo: "falhou" };

    const quem = clienteNome ?? dados.cliente ?? dados.descricao ?? "Agendamento";
    const recibo =
      `Marquei: ${quem}, ${ehHoje ? "hoje" : data.split("-").reverse().slice(0, 2).join("/")} às ${horario}.\n\n` +
      "Se estiver errado, responda *desfazer*.";

    return (await anotarOperacao(
      supabase, empresaId, canal, mensagemId, tipo, "agendamentos", criado.id, recibo,
    ))
      ? { ok: true, recibo }
      : { ok: false, motivo: "falhou" };
  }

  const { data: criada, error } = await supabase
    .from("transacoes")
    .insert({
      empresa_id: empresaId,
      tipo,
      valor: dados.valor!,
      descricao: dados.descricao || (!clienteId ? dados.cliente : null),
      categoria: null,
      cliente_id: clienteId,
      forma_pagamento: null,
      data,
      parcelas: 1,
      parcela_atual: 1,
    })
    .select("id")
    .single();

  if (error || !criada) return { ok: false, motivo: "falhou" };

  const recibo = reciboDeTransacao(
    tipo, dados.valor!, dados.descricao, clienteNome, data, ehHoje,
  );

  return (await anotarOperacao(
    supabase, empresaId, canal, mensagemId, tipo, "transacoes", criada.id, recibo,
  ))
    ? { ok: true, recibo }
    : { ok: false, motivo: "falhou" };
}

/**
 * Guarda a operação para que "desfazer" saiba o que desfazer.
 *
 * Se ISTO falhar, a escrita já aconteceu e não haveria como reverter — então
 * a operação é tratada como falha e a linha criada é apagada. Melhor não ter
 * registrado do que ter registrado sem saída: o brief é explícito que a saída
 * é a contrapartida de gravar sem perguntar.
 */
async function anotarOperacao(
  supabase: ClientComIdentidade,
  empresaId: string,
  canal: Canal,
  mensagemId: string,
  tipo: "entrada" | "saida" | "agendamento",
  tabela: "transacoes" | "agendamentos",
  registroId: string,
  recibo: string,
): Promise<boolean> {
  const { error } = await supabase.from("operacoes_canal").insert({
    canal,
    empresa_id: empresaId,
    mensagem_id: mensagemId,
    tipo,
    tabela,
    registro_id: registroId,
    recibo,
  });

  if (!error) return true;

  console.error("Não consegui anotar a operação; desfazendo a escrita.", error);
  await supabase.from(tabela).delete().eq("id", registroId);
  return false;
}
