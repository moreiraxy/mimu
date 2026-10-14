import { describe, expect, it } from "vitest";
import { posicionar } from "@/lib/agenda/grade";
import type { AgendamentoComCliente } from "@/types";

/*
 * A grade da agenda erra de um jeito que a tela não denuncia.
 *
 * Duas reuniões no mesmo horário, se o empacotamento falhar, ficam uma EM CIMA
 * da outra: a de baixo desaparece por completo, sem erro, sem aviso e sem
 * sobrar nada na tela que diga que ela existe. A pessoa marca um terceiro
 * compromisso num horário que já tinha dois.
 *
 * Por isso o teste é sobre colunas e alturas, e não sobre pixels.
 */

function agendamento(
  hora: string,
  duracao: number | null,
  id = hora,
): AgendamentoComCliente {
  return {
    id,
    empresa_id: "e",
    cliente_id: null,
    titulo: `Compromisso ${hora}`,
    descricao: null,
    valor_previsto: null,
    // Data local de propósito: a grade lê com getHours(), como o resto da tela.
    data_hora: `2026-10-14T${hora}:00`,
    duracao_minutos: duracao,
    status: "confirmado",
    pagamento_registrado: false,
    transacao_id: null,
    created_at: "2026-10-14T00:00:00Z",
    updated_at: "2026-10-14T00:00:00Z",
    revertida_em: null,
    cliente: null,
  } as unknown as AgendamentoComCliente;
}

describe("quem se sobrepõe divide a largura", () => {
  it("dois no mesmo horário ficam em colunas diferentes", () => {
    const posicoes = posicionar([
      agendamento("10:00", 60, "a"),
      agendamento("10:30", 60, "b"),
    ]);
    expect(posicoes.map((p) => p.colunas)).toEqual([2, 2]);
    expect(posicoes.map((p) => p.coluna).sort()).toEqual([0, 1]);
  });

  it("quem não se cruza fica com a largura inteira", () => {
    const posicoes = posicionar([
      agendamento("09:00", 60, "a"),
      agendamento("11:00", 60, "b"),
    ]);
    expect(posicoes.every((p) => p.colunas === 1)).toBe(true);
  });

  it("o grupo fecha quando acaba a sobreposição", () => {
    // a cruza b; c começa depois de os dois terminarem. Se o grupo não
    // fechasse, c dividiria a largura em três sem precisar.
    const posicoes = posicionar([
      agendamento("09:00", 60, "a"),
      agendamento("09:30", 60, "b"),
      agendamento("14:00", 60, "c"),
    ]);
    const c = posicoes.find((p) => p.item.id === "c")!;
    expect(c.colunas).toBe(1);
  });

  it("encadeado conta como um grupo só", () => {
    // a cruza b, b cruza c, mas a NÃO cruza c. No Google os três dividem,
    // porque senão c ficaria em cima de b.
    const posicoes = posicionar([
      agendamento("09:00", 60, "a"),
      agendamento("09:45", 60, "b"),
      agendamento("10:30", 60, "c"),
    ]);
    expect(posicoes.every((p) => p.colunas === 3)).toBe(true);
  });
});

describe("a duração", () => {
  it("sem duração declarada, vale uma hora", () => {
    const [p] = posicionar([agendamento("10:00", null)]);
    expect(p!.fim - p!.inicio).toBe(60);
  });

  it("menos de 30 minutos ainda ocupa 30", () => {
    // Um evento de 15min teria 14px de altura: não dá para ler nem para tocar.
    const [p] = posicionar([agendamento("10:00", 15)]);
    expect(p!.fim - p!.inicio).toBe(30);
  });

  it("o início é lido em minutos do dia", () => {
    const [p] = posicionar([agendamento("14:30", 60)]);
    expect(p!.inicio).toBe(14 * 60 + 30);
  });
});
