import { describe, expect, it } from "vitest";
import {
  estadoDaRotina,
  minutosAgoraNoBrasil,
  ROTINA,
} from "@/lib/posto/rotina";
import { bateuAMeta, NUMEROS, numeroPorChave } from "@/lib/posto/numeros";
import { FRENTES, frentePorId } from "@/lib/posto/cargos";
import { MODULO_POR_ROTA } from "@/lib/rotas-modulos";
import { MODULOS_DO_PLANO } from "@/lib/planos";
import { montarResumoDoDia } from "@/lib/posto/resumo";
import type { Database, FrentePosto } from "@/types/database";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

/*
 * O posto erra de dois jeitos, e os dois são silenciosos.
 *
 * O PRIMEIRO É O FUSO. O servidor roda em UTC e, entre 21h e a meia-noite de
 * Brasília, já está no dia seguinte. Uma tela de rotina que acreditasse em
 * `getHours()` mostraria "antes da jornada" às 18h de Brasília — e ninguém
 * reclamaria disso de manhã, quando funciona.
 *
 * O SEGUNDO É A DIREÇÃO DA META. Em dois dos seis indicadores menor é melhor.
 * Trocar o sinal pinta "15 minutos" de verde numa meta de "até 10" — a tela
 * elogiando o atraso, sem erro nenhum aparecendo.
 *
 * Instantes fixos de propósito: um teste que chame `new Date()` passa de manhã
 * e falha de tarde, que é justamente o defeito que ele existe para pegar.
 */

// 10h30 em Brasília (UTC-3). Dentro do bloco de pré-atendimento e disparo.
const MEIO_DA_MANHA = new Date("2026-10-14T13:30:00Z");
// 23h40 em Brasília do dia 14 — o UTC já está no dia 15.
const NOITE = new Date("2026-10-15T02:40:00Z");
// 08h00 em Brasília, antes das 9:30.
const ANTES = new Date("2026-10-14T11:00:00Z");
// 12h05 em Brasília: dois blocos começaram às 12:00 (o corte e a ativação).
const MEIO_DIA = new Date("2026-10-14T15:05:00Z");

describe("o relógio do posto é o de Brasília", () => {
  it("lê a hora no fuso de quem está usando, não no do servidor", () => {
    expect(minutosAgoraNoBrasil(MEIO_DA_MANHA)).toBe(10 * 60 + 30);
  });

  it("às 23h40 de Brasília ainda é o dia de cá, com o UTC já virado", () => {
    // O jeito ingênuo devolveria 2h40 e a tela diria "antes da jornada".
    expect(minutosAgoraNoBrasil(NOITE)).toBe(23 * 60 + 40);
    expect(estadoDaRotina([], NOITE).depoisDaJornada).toBe(true);
    expect(estadoDaRotina([], NOITE).antesDaJornada).toBe(false);
  });

  it("antes das 9:30 não cobra bloco nenhum", () => {
    const estado = estadoDaRotina([], ANTES);
    expect(estado.antesDaJornada).toBe(true);
    expect(estado.atrasados).toEqual([]);
    expect(estado.proximo?.chave).toBe("email_agenda");
  });
});

describe("onde o dia está", () => {
  it("aponta o bloco da hora e o próximo", () => {
    const estado = estadoDaRotina([], MEIO_DA_MANHA);
    expect(estado.agora?.chave).toBe("pre_atendimento_disparo");
    expect(estado.proximo?.chave).toBe("fila_corte_12");
  });

  it("cobra o que passou da hora e não foi marcado", () => {
    const estado = estadoDaRotina([], MEIO_DA_MANHA);
    const atrasados = estado.atrasados.map((b) => b.chave);
    expect(atrasados).toContain("email_agenda");
    expect(atrasados).toContain("roleta_manha");
    // O que ainda não chegou NÃO é atraso.
    expect(atrasados).not.toContain("sla");
  });

  it("marcar um bloco o tira da lista de atrasados", () => {
    const estado = estadoDaRotina(["email_agenda", "roleta_manha"], MEIO_DA_MANHA);
    expect(estado.atrasados).toEqual([]);
    expect(estado.feitos.map((b) => b.chave)).toEqual([
      "email_agenda",
      "roleta_manha",
    ]);
  });

  it("mostra os dois blocos que começam juntos ao meio-dia", () => {
    const estado = estadoDaRotina([], MEIO_DIA);
    const simultaneos = [estado.agora, ...estado.tambemAgora].map(
      (b) => b?.chave,
    );
    expect(simultaneos).toContain("fila_corte_12");
    expect(simultaneos).toContain("ativacao");
  });

  it("um bloco marcado deixa de ser o 'agora'", () => {
    // Senão a tela continuaria mandando fazer o que ela acabou de concluir.
    const estado = estadoDaRotina(["pre_atendimento_disparo"], MEIO_DA_MANHA);
    expect(estado.agora?.chave).not.toBe("pre_atendimento_disparo");
  });

  it("a rotina está em ordem de horário", () => {
    // A tela desenha linha do tempo: lista fora de ordem viraria um dia que
    // volta no tempo, e isso não daria erro em lugar nenhum.
    const inicios = ROTINA.map((b) => b.inicio);
    expect([...inicios].sort((a, b) => a - b)).toEqual(inicios);
  });
});

describe("a direção da meta", () => {
  it("em 'tempo até o primeiro contato', menor é melhor", () => {
    const numero = numeroPorChave("tempo_primeiro_contato")!;
    expect(bateuAMeta(numero, 8)).toBe(true);
    expect(bateuAMeta(numero, 15)).toBe(false);
  });

  it("em 'leads dentro do SLA', maior é melhor", () => {
    const numero = numeroPorChave("leads_no_sla")!;
    expect(bateuAMeta(numero, 95)).toBe(true);
    expect(bateuAMeta(numero, 80)).toBe(false);
  });

  it("zero e-mails pendentes é meta batida, não ausência de dado", () => {
    const numero = numeroPorChave("emails_pendentes")!;
    expect(bateuAMeta(numero, 0)).toBe(true);
    // Não anotado é outra coisa, e a tela precisa dessa diferença.
    expect(bateuAMeta(numero, undefined)).toBeNull();
  });

  it("indicador sem meta não vira cobrança", () => {
    // TRÊS dos seis não têm número de meta: "todos os do dia" (leads
    // qualificados), "por disparo" (taxa de resposta) e os reativados, que o
    // documento cobra por semana sem dizer quantos. Escrevi "dois" na primeira
    // versão deste teste e ele me corrigiu — inventar alvo para esses três
    // seria cobrar dela o que não foi acordado com o gerente.
    const semMeta = NUMEROS.filter((n) => n.meta === null);
    expect(semMeta.length).toBe(3);
    for (const numero of semMeta) {
      expect(bateuAMeta(numero, 999)).toBeNull();
    }
  });
});

describe("as cinco frentes", () => {
  it("toda frente do tipo tem entrada na lista", () => {
    // É o teste prometido no comentário de `frentePorId`, que usa `!`.
    const doTipo: FrentePosto[] = [
      "produto",
      "comercial",
      "assistencia",
      "marketing",
      "operacao",
    ];
    for (const id of doTipo) {
      expect(frentePorId(id)).toBeDefined();
      expect(frentePorId(id).nome.length).toBeGreaterThan(0);
    }
    expect(FRENTES.length).toBe(doTipo.length);
  });

  it("registra que três das cinco não estão no papel", () => {
    // Se alguém "arrumar" isso marcando tudo como documentado, a conta que a
    // tela existe para mostrar desaparece — e desaparece caladinha.
    expect(FRENTES.filter((f) => !f.noPapel).length).toBe(3);
  });
});

describe("a porta do posto", () => {
  it("a rota exige o módulo, e não só esconde o item do menu", () => {
    expect(MODULO_POR_ROTA["/posto"]).toBe("posto");
  });

  it("todo plano pode ligar o posto", () => {
    for (const [plano, modulos] of Object.entries(MODULOS_DO_PLANO)) {
      expect(modulos, `plano ${plano}`).toContain("posto");
    }
  });
});

function pendencia(parcial: Partial<Pendencia>): Pendencia {
  return {
    id: "1",
    empresa_id: "e",
    titulo: "título",
    detalhe: null,
    frente: "assistencia",
    tipo: "tarefa",
    com_quem: null,
    prazo: null,
    urgente: false,
    status: "aberta",
    concluida_em: null,
    criada_em: "2026-10-14T12:00:00Z",
    atualizada_em: "2026-10-14T12:00:00Z",
    ...parcial,
  };
}

describe("o resumo do dia não inventa", () => {
  it("não escreve número que não foi anotado", () => {
    const texto = montarResumoDoDia({
      blocosFeitos: ["email_agenda"],
      numeros: {},
      pendenciasAbertas: [],
      dataTexto: "quarta, 14 de outubro",
    });
    // Um resumo que mandasse "SLA: 0%" ao gerente afirmaria algo falso sobre o
    // dia dela — e afirmaria por escrito, para quem a mede.
    expect(texto).not.toContain("SLA");
    expect(texto).toContain("E-mail, leads da noite");
  });

  it("escreve o número quando ele existe, com a meta ao lado", () => {
    const texto = montarResumoDoDia({
      blocosFeitos: [],
      numeros: { tempo_primeiro_contato: 7 },
      pendenciasAbertas: [],
      dataTexto: "quarta, 14 de outubro",
    });
    expect(texto).toContain("7 min");
    expect(texto).toContain("até 10 minutos");
  });

  it("separa o que depende do gerente do que ela está esperando", () => {
    const texto = montarResumoDoDia({
      blocosFeitos: [],
      numeros: {},
      pendenciasAbertas: [
        pendencia({ id: "a", tipo: "aprovacao", titulo: "Desconto no 302" }),
        pendencia({
          id: "b",
          tipo: "espera",
          titulo: "Documento do cliente",
          com_quem: "Marcos",
        }),
      ],
      dataTexto: "quarta, 14 de outubro",
    });
    expect(texto).toContain("Preciso da sua aprovação:");
    expect(texto).toContain("Desconto no 302");
    expect(texto).toContain("Esperando resposta:");
    expect(texto).toContain("Marcos");
  });

  it("a lista de tarefas dela não vira cobrança no resumo do gerente", () => {
    const texto = montarResumoDoDia({
      blocosFeitos: [],
      numeros: {},
      pendenciasAbertas: [
        pendencia({ tipo: "tarefa", titulo: "Organizar pasta do Jardins" }),
      ],
      dataTexto: "quarta, 14 de outubro",
    });
    expect(texto).not.toContain("Organizar pasta do Jardins");
  });
});
