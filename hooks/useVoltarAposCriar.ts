"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Depois de criar alguma coisa, a pessoa vai para a TELA DONA do registro.
 *
 * Venda e despesa terminam no Financeiro, produto termina em Produtos,
 * agendamento na Agenda, cliente em Clientes — sempre no topo, com o registro
 * novo já visível na lista.
 *
 * ANTES ISSO ERA `router.back()`, e o raciocínio parecia bom: "devolve a tela
 * de origem, seja ela qual for". Na prática ele entrega um destino que depende
 * do caminho — quem toca em "Nova venda" na home volta para a home, quem toca
 * no "+" da barra volta para a tela em que estava, quem chega pelo chat volta
 * para o chat. O mesmo gesto terminando em três lugares diferentes é o tipo de
 * coisa que faz a pessoa achar que o registro não foi salvo: ela olha para uma
 * tela que não mudou.
 *
 * `replace` e não `push`: o formulário já enviado não merece uma parada no
 * histórico. Voltar dali é voltar para antes de começar, e não para um
 * formulário preenchido que já virou lançamento.
 */
export function useVoltarAposCriar(rota: string) {
  const router = useRouter();

  return useCallback(() => {
    router.replace(rota);

    /*
     * O topo, explicitamente.
     *
     * Quem registrou uma venda quer ver o saldo — que é a primeira coisa da
     * tela. Chegar no meio da lista, na altura em que estava antes, esconde
     * justamente o número que mudou.
     */
    window.scrollTo({ top: 0 });
  }, [router, rota]);
}
