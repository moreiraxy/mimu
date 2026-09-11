import { describe, it, expect } from "vitest";
import { dataDeHojeNoBrasil } from "@/lib/datas";

/**
 * As três horas da noite em que o servidor discorda de quem está usando.
 *
 * O servidor roda em UTC. Entre 21h e a meia-noite de Brasília, o UTC já virou
 * o dia — então `toISOString().slice(0, 10)` devolve AMANHÃ. Foi assim que a
 * Mimu respondeu "faturamento de hoje: R$ 0,00" às 22h12 de um dia com
 * R$ 707,00 em vendas, enquanto o painel, ao lado, mostrava os R$ 707,00.
 *
 * Instantes fixos de propósito: um teste que chama `new Date()` passa de dia e
 * falha de noite, que é exatamente o defeito que ele deveria pegar.
 */

const NOITE = new Date("2026-09-11T01:13:00Z"); // 22h13 de 10/09 em Brasília

describe("hoje é o dia de quem está usando, não o do servidor", () => {
  it("às 22h de Brasília ainda é o mesmo dia, mesmo com o UTC já virado", () => {
    expect(dataDeHojeNoBrasil(NOITE)).toBe("2026-09-10");
  });

  it("é justamente aqui que o jeito ingênuo erra", () => {
    // A linha que estava no código. Fica no teste para o contraste não
    // depender de ninguém lembrar por que a função existe.
    expect(NOITE.toISOString().slice(0, 10)).toBe("2026-09-11");
    expect(dataDeHojeNoBrasil(NOITE)).not.toBe(
      NOITE.toISOString().slice(0, 10),
    );
  });

  it("de dia os dois concordam — por isso o defeito passou despercebido", () => {
    const meioDia = new Date("2026-09-10T15:00:00Z");
    expect(dataDeHojeNoBrasil(meioDia)).toBe("2026-09-10");
    expect(meioDia.toISOString().slice(0, 10)).toBe("2026-09-10");
  });

  it("a virada acontece à meia-noite de Brasília, não à do UTC", () => {
    // 02:59:59Z = 23:59:59 de 10/09 em Brasília
    expect(dataDeHojeNoBrasil(new Date("2026-09-11T02:59:59Z"))).toBe(
      "2026-09-10",
    );
    // 03:00:00Z = 00:00:00 de 11/09 em Brasília
    expect(dataDeHojeNoBrasil(new Date("2026-09-11T03:00:00Z"))).toBe(
      "2026-09-11",
    );
  });

  it("atravessa a virada de mês e de ano sem inventar data", () => {
    expect(dataDeHojeNoBrasil(new Date("2026-10-01T02:00:00Z"))).toBe(
      "2026-09-30",
    );
    expect(dataDeHojeNoBrasil(new Date("2027-01-01T02:00:00Z"))).toBe(
      "2026-12-31",
    );
  });
});
