/**
 * Os widgets do painel: quais existem, que tamanhos aceitam, e como a escolha
 * de cada pessoa é guardada.
 *
 * O PAINEL DEIXOU DE SER UMA TELA FIXA. Ele era uma lista de cartões na ordem
 * que eu escolhi, igual para todo mundo — e "todo mundo" aqui é um salão, um
 * mercadinho e uma manicure, que olham coisas diferentes ao abrir o app de
 * manhã. Agora cada uma monta a sua: escolhe quais widgets ficam, em que
 * ordem e de que tamanho.
 *
 * A configuração é do APARELHO (localStorage), e não da conta. É a mesma razão
 * do olho de esconder valores: o painel do celular do balcão e o do computador
 * de casa não precisam ser iguais, e sincronizar isso pelo banco custaria uma
 * migration e uma ida à rede para resolver um problema que ninguém tem.
 */

export type TamanhoWidget = "pequeno" | "medio" | "grande";

export type IdWidget =
  | "hoje"
  | "a-receber"
  | "a-pagar"
  | "faturamento"
  | "agenda"
  | "alertas"
  | "mimu";

export interface WidgetNoPainel {
  id: IdWidget;
  tamanho: TamanhoWidget;
}

export interface DefinicaoWidget {
  id: IdWidget;
  nome: string;
  descricao: string;
  /** Os tamanhos que fazem sentido para ESTE widget. */
  tamanhos: TamanhoWidget[];
  /** O módulo que a conta precisa ter. `null` quando vale para todas. */
  modulo: string | null;
}

/**
 * O catálogo.
 *
 * `tamanhos` é por widget e não uma lista única porque nem todo conteúdo cabe
 * em qualquer caixa: um gráfico de doze meses não vive num quadrado de meia
 * largura, e "A receber" — um rótulo e um número — ficaria oco ocupando a
 * linha inteira e alto.
 */
export const CATALOGO: DefinicaoWidget[] = [
  {
    id: "hoje",
    nome: "Hoje",
    descricao: "Faturamento do dia, meta e como o dia está indo.",
    tamanhos: ["medio", "grande"],
    modulo: "financeiro",
  },
  {
    id: "a-receber",
    nome: "A receber",
    descricao: "O que ainda vai entrar.",
    tamanhos: ["pequeno", "medio"],
    modulo: "financeiro",
  },
  {
    id: "a-pagar",
    nome: "A pagar",
    descricao: "O que ainda vai sair.",
    tamanhos: ["pequeno", "medio"],
    modulo: "financeiro",
  },
  {
    id: "faturamento",
    nome: "Faturamento",
    descricao: "O gráfico da semana, com atalho para o histórico.",
    tamanhos: ["medio", "grande"],
    modulo: "financeiro",
  },
  {
    id: "agenda",
    nome: "Agenda de hoje",
    descricao: "Os atendimentos do dia.",
    tamanhos: ["medio"],
    modulo: "agenda",
  },
  {
    id: "alertas",
    nome: "Avisos da Mimu",
    descricao: "O que ela percebeu no seu negócio.",
    tamanhos: ["medio"],
    modulo: null,
  },
  {
    id: "mimu",
    nome: "Mensagens da Mimu",
    descricao: "Quantas conversas você ainda tem hoje.",
    tamanhos: ["pequeno", "medio"],
    modulo: "ia",
  },
];

/** O painel de quem nunca mexeu — o mesmo de antes, para nada mudar sozinho. */
export const PAINEL_PADRAO: WidgetNoPainel[] = [
  { id: "hoje", tamanho: "medio" },
  { id: "a-receber", tamanho: "pequeno" },
  { id: "a-pagar", tamanho: "pequeno" },
  { id: "faturamento", tamanho: "medio" },
  { id: "agenda", tamanho: "medio" },
  { id: "alertas", tamanho: "medio" },
];

const CHAVE = "mimu:painel";

export function definicaoDe(id: IdWidget): DefinicaoWidget | undefined {
  return CATALOGO.find((w) => w.id === id);
}

/**
 * O painel guardado, filtrado pelo que a conta pode ver.
 *
 * O filtro por módulo acontece na LEITURA, e não na gravação: alguém que
 * assina o Pro, põe o widget da agenda e depois volta para o gratuito não deve
 * perder a escolha — ela some da tela enquanto o módulo não existe e volta
 * inteira quando ele voltar.
 */
export function lerPainel(modulos: readonly string[]): WidgetNoPainel[] {
  let guardado: WidgetNoPainel[] | null = null;

  if (typeof window !== "undefined") {
    try {
      const bruto = window.localStorage.getItem(CHAVE);
      if (bruto) {
        const lido = JSON.parse(bruto) as WidgetNoPainel[];
        // Ignora entrada de widget que não existe mais no catálogo: um id
        // removido numa versão nova quebraria a tela inteira.
        guardado = lido.filter((w) => definicaoDe(w.id));
      }
    } catch {
      // JSON corrompido ou armazenamento bloqueado — vale o padrão.
    }
  }

  return (guardado ?? PAINEL_PADRAO).filter((w) => {
    const def = definicaoDe(w.id)!;
    return def.modulo === null || modulos.includes(def.modulo);
  });
}

export function gravarPainel(painel: WidgetNoPainel[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(painel));
  } catch {
    // Sem armazenamento, a montagem vale só nesta sessão.
  }
}

/**
 * A forma de cada tamanho, MEDIDA no vídeo da referência (quadro em resolução
 * cheia, 1170px = 390 CSS a 3×):
 *
 *   meia largura   507 × 589 px de aparelho = 169 × 196 CSS
 *   espaço entre   58 px = 19 CSS
 *   margem da tela 50 px = 17 CSS
 *   raio           ~55 px = 18 CSS
 *
 * DUAS COISAS QUE EU TINHA ERRADO, e as duas por ter estimado em vez de medir:
 *
 * O widget pequeno NÃO É QUADRADO. Ele é mais alto que largo (169×196), e essa
 * diferença de 27px é o que dá lugar para o gráfico em cima e o texto embaixo
 * sem os dois se encostarem. Quadrado, o conteúdo fica espremido e o cartão
 * parece um botão.
 *
 * E o widget de largura cheia NÃO TEM proporção travada. Eu tinha imposto 2:1 e
 * 1:1 achando que copiava a Apple; na referência a altura dele vem do
 * conteúdo — "Saldo em contas" é alto porque tem duas linhas de conta,
 * "Gastos do mês" é mais baixo. Travar a proporção obrigava a cortar conteúdo
 * para caber numa caixa que ninguém pediu.
 */
export const CLASSES_TAMANHO: Record<TamanhoWidget, string> = {
  pequeno: "col-span-1 aspect-[169/196]",
  medio: "col-span-2",
  grande: "col-span-2",
};
