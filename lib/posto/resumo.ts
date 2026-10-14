/**
 * O resumo do dia para o gerente, montado do que a tela já sabe.
 *
 * É um bloco de horário do cargo — 17:45 às 18:00, "envia o resumo do dia ao
 * gerente". O trabalho de escrever esse texto do zero, todo dia, às 17:45, com
 * o dia inteiro na memória, é exatamente o tipo de coisa que esta tela existe
 * para tirar das costas dela.
 *
 * O TEXTO É RASCUNHO, não envio. A função devolve string; quem envia é ela,
 * depois de ler. Mandar em nome dela sem leitura seria o avesso da regra 3.9 do
 * documento ("mensagem em nome do gerente" precisa de aprovação) — e a mesma
 * prudência vale na direção inversa.
 *
 * O que NÃO entra: nada que a tela não tenha visto. Sem número anotado, a linha
 * do número não aparece — em vez de aparecer com zero, que seria uma afirmação
 * falsa sobre o dia dela num texto que vai para o chefe.
 */

import { NUMEROS, formatarValor } from "@/lib/posto/numeros";
import { ROTINA, type BlocoDaRotina } from "@/lib/posto/rotina";
import { frentePorId } from "@/lib/posto/cargos";
import type { Database } from "@/types/database";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

export interface MateriaDoResumo {
  blocosFeitos: string[];
  numeros: Record<string, number>;
  pendenciasAbertas: Pendencia[];
  /** Data já formatada pela tela, no fuso de Brasília. */
  dataTexto: string;
}

function linhaDeBloco(bloco: BlocoDaRotina): string {
  return `• ${bloco.label}`;
}

export function montarResumoDoDia(materia: MateriaDoResumo): string {
  const feitos = new Set(materia.blocosFeitos);
  const cumpridos = ROTINA.filter((b) => feitos.has(b.chave));
  const faltando = ROTINA.filter((b) => !feitos.has(b.chave));

  const partes: string[] = [`Resumo do dia — ${materia.dataTexto}`, ""];

  if (cumpridos.length > 0) {
    partes.push("Feito hoje:");
    partes.push(...cumpridos.map(linhaDeBloco));
  } else {
    // Dizer "nada feito" seria pior que não dizer: o dia dela tem cinco
    // frentes, e a rotina marcada é só uma delas.
    partes.push("Rotina do dia ainda sem marcação na tela.");
  }

  const anotados = NUMEROS.filter(
    (n) => materia.numeros[n.chave] !== undefined,
  );
  if (anotados.length > 0) {
    partes.push("", "Números:");
    partes.push(
      ...anotados.map((n) => {
        const valor = materia.numeros[n.chave]!;
        return `• ${n.label}: ${formatarValor(n, valor)} (meta: ${n.metaTexto})`;
      }),
    );
  }

  // Só as esperas e aprovações entram no resumo do gerente, e isso é
  // deliberado: é o que depende DELE. A lista de tarefas dela não é assunto do
  // resumo — vira cobrança sobre o próprio trabalho.
  const dependemDoGerente = materia.pendenciasAbertas.filter(
    (p) => p.tipo === "aprovacao",
  );
  if (dependemDoGerente.length > 0) {
    partes.push("", "Preciso da sua aprovação:");
    partes.push(
      ...dependemDoGerente.map((p) =>
        p.com_quem ? `• ${p.titulo} (${p.com_quem})` : `• ${p.titulo}`,
      ),
    );
  }

  const esperando = materia.pendenciasAbertas.filter(
    (p) => p.tipo === "espera" || p.tipo === "cobranca",
  );
  if (esperando.length > 0) {
    partes.push("", "Esperando resposta:");
    partes.push(
      ...esperando.map((p) =>
        p.com_quem ? `• ${p.titulo} — ${p.com_quem}` : `• ${p.titulo}`,
      ),
    );
  }

  if (faltando.length > 0) {
    partes.push(
      "",
      `Ficou para amanhã: ${faltando.map((b) => b.label.toLowerCase()).join("; ")}.`,
    );
  }

  return partes.join("\n");
}

/**
 * Para onde o tempo foi, contado por frente.
 *
 * Conta pendência FECHADA no dia, não tempo de relógio: ninguém vai cronometrar
 * o próprio dia, e contar o que terminou é a medida honesta que dá para
 * levantar sem pedir nada a mais dela. Serve à conta que o documento de
 * funções não fecha — três das cinco frentes não existem no papel.
 */
export function tempoPorFrente(
  pendenciasFechadas: Pendencia[],
): { frente: string; quantidade: number }[] {
  const porFrente = new Map<string, number>();
  for (const p of pendenciasFechadas) {
    const nome = frentePorId(p.frente).nome;
    porFrente.set(nome, (porFrente.get(nome) ?? 0) + 1);
  }
  return Array.from(porFrente.entries())
    .map(([frente, quantidade]) => ({ frente, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}
