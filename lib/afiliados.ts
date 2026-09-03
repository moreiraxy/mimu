import { PLANOS, valorDoPlano, type PlanoPago, type Periodicidade } from "@/lib/planos";

/**
 * O programa de afiliados, num lugar só.
 *
 * TUDO AQUI PRECISA BATER COM O PAINEL DA CAKTO. Esta é a página que o afiliado
 * lê antes de se inscrever; se ela promete uma comissão e a Cakto paga outra, a
 * reclamação é certa e justa. Quando mudar lá, mude aqui.
 */

/**
 * Enquanto for `false`, `/afiliados` responde 404.
 *
 * Existe porque a página precisa ser escrita e revisada antes de o programa
 * abrir, e uma página de afiliados no ar sem programa ativo convida gente a se
 * inscrever no nada. Ligar o programa é virar este booleano e publicar — não
 * escrever a página às pressas no dia.
 *
 * Ligado em 26/08/2026 para que a URL pudesse ser colada no campo de página de
 * afiliado da Cakto, e DESLIGADO em 03/09/2026 junto com ela.
 *
 * O programa era pago pela Cakto — comissão, rastreio de indicação e repasse
 * eram dela. Sem a plataforma não existe programa, e uma página no ar
 * prometendo comissão que ninguém vai pagar é pior do que página nenhuma: ela
 * convida gente a se inscrever no nada.
 *
 * O texto e os números seguem aqui, prontos. Se um dia entrar outra plataforma
 * de afiliados, é revisar os valores e virar este booleano — não reescrever a
 * página às pressas no dia.
 *
 * ANTES DE RELIGAR: a página ainda diz, por escrito, que a inscrição acontece
 * pela Cakto. Com o programa desligado ela responde 404 e ninguém lê aquilo,
 * mas religar sem trocar esse trecho anunciaria uma plataforma que não é mais
 * usada.
 */
export const PROGRAMA_ATIVO = false;

/**
 * Percentual pago ao afiliado. Confirmado pela Rayssa em 2026-08-26.
 *
 * A Mimu tem custo por cliente todo mês (IA, banco, hospedagem, suporte),
 * diferente de infoproduto. Como a comissão é RECORRENTE, ela sai de toda
 * renovação e não só da primeira venda: por isso 25 e não os 30 ou 40 que se vê
 * em produto de pagamento único.
 */
export const COMISSAO_PERCENTUAL = 25;

/**
 * Se a comissão se repete a cada renovação ou vale só o primeiro pagamento.
 *
 * Recorrente, confirmado em 2026-08-26. `null` continua sendo um estado válido
 * do tipo: se um dia isso voltar a ficar em aberto, a página deixa de afirmar
 * qualquer uma das duas coisas em vez de chutar. É a resposta pela qual o
 * afiliado decide se vale a pena.
 */
export const COMISSAO_RECORRENTE: boolean | null = true;

/**
 * E-mail de suporte ao afiliado. `null` enquanto não houver um que alguém abra
 * de verdade.
 *
 * Não use nada `@mimu.app`: o domínio é de outra empresa, e já causou o
 * problema de mandar gente escrever para o vazio (ver lib/contato.ts).
 */
export const EMAIL_AFILIADOS: string | null = "suportemimu@gmail.com";

/** Uma linha da tabela de quanto o afiliado ganha por venda. */
export interface GanhoPorPlano {
  rotulo: string;
  precoFormatado: number;
  comissao: number;
}

/**
 * As combinações que o afiliado pode vender, com o que ele ganha em cada uma.
 *
 * Sai de `lib/planos.ts` em vez de ser digitada: preço na página de afiliado
 * que não bate com o preço do checkout é reclamação garantida, e manter dois
 * lugares em dia nunca funciona.
 *
 * Premium anual não aparece porque não é vendido — `valorDoPlano` devolve null
 * e `liberarCompraExterna` recusa a combinação. Anunciar aqui algo que o
 * sistema recusa na liberação seria vender o que não dá para entregar.
 */
export function ganhosPorPlano(): GanhoPorPlano[] {
  const combinacoes: Array<{ plano: PlanoPago; periodicidade: Periodicidade }> = [
    { plano: "pro", periodicidade: "mensal" },
    { plano: "pro", periodicidade: "anual" },
    { plano: "premium", periodicidade: "mensal" },
    { plano: "premium", periodicidade: "anual" },
  ];

  return combinacoes.flatMap(({ plano, periodicidade }) => {
    const preco = valorDoPlano(plano, periodicidade);
    if (preco === null) return [];

    return [
      {
        rotulo: `${PLANOS[plano].nome} ${periodicidade}`,
        precoFormatado: preco,
        comissao: (preco * COMISSAO_PERCENTUAL) / 100,
      },
    ];
  });
}
