/*
 * Conteúdo de /historias e /historias/:slug.
 *
 * Estrutura apenas — todo número de layout mora com o componente que o usa.
 *
 * As quatro histórias são os mesmos negócios que assinam os depoimentos da
 * home e o carrossel de segmentos. Isso é de propósito: um site que cita
 * "Andréia, Salão da Andréia" em três lugares e conta a história dela num
 * quarto lê como cliente real; nomes diferentes em cada seção leem como
 * preenchimento.
 *
 * REVISAR: os números (horas economizadas, valores recuperados) são
 * ilustrativos e precisam ser confirmados com os clientes reais antes de irem
 * ao ar — assim como a autorização de uso do nome e do depoimento de cada um.
 */

/** Um bloco do corpo da história, em ordem de documento. */
export type Block =
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  /** Citação destacada: a linha 0 é a fala, a linha 1 é a assinatura. */
  | { t: "quote"; lines: string[] }
  | { t: "img"; file: string; alt: string; w: number; h: number; ratio: number };

export type Asset = { file: string; alt: string; w: number; h: number };

export type Story = {
  slug: string;
  /** O que o card da listagem mostra. */
  card: {
    image: Asset;
    title: string;
    metric: string;
    metricLabel: string;
    label: string;
  };
  eyebrow: string;
  category: string;
  heading: string;
  company: string;
  about: string;
  /** Pares rótulo/valor do bloco lateral. */
  info: [string, string][];
  shareLabel: string;
  shareIcons: string[];
  banner: Asset;
  quote: string;
  avatar: Asset;
  name: string;
  role: string;
  /** Pares número/rótulo; duas histórias trazem três cards, duas trazem dois. */
  stats: [string, string][];
  body: Block[];
  ctaHeading: string;
  otherHeading: string;
  otherLabel: string;
  /** Slugs das duas histórias ligadas ao pé desta. */
  others: string[];
};

const SHARE_ICONS = [
  "bJ6BqkVCy3QqIGcTEXMoulF4Lw.svg",
  "Wc28Wmv6qRZFW1czVzUKnUm8b7w.png",
  "ekn77l6PEu99NPaYbN4J7Xhhfk4.png",
];

const CTA_HEADING = "Pronta para deixar o caderno de lado?";
const OTHER_HEADING = "Veja como outros negócios usam a Mimu";

export const STORIES: Story[] = [
  {
    slug: "salao-da-andreia",
    card: {
      image: {
        file: "J14tiC4MnSpdAaV0BhQVmfLmzQg.png",
        alt: "Imagem de abertura da história do Salão da Andréia.",
        w: 1880,
        h: 1240,
      },
      title: "Agora eu sei, todo dia, se o salão deu lucro",
      metric: "6 h",
      metricLabel: "por semana de volta para o atendimento",
      label: "Salão e barbearia",
    },
    eyebrow: "Histórias",
    category: "Salão e barbearia",
    heading: "Agora eu sei, todo dia, se o salão deu lucro",
    company: "Salão da Andréia",
    about:
      "O Salão da Andréia funciona há nove anos na mesma rua, com duas cadeiras e uma clientela que vem de indicação. Andréia atende, compra material, cobra e fecha o caixa — tudo sozinha.",
    info: [
      ["Onde fica", "Zona Norte, São Paulo"],
      ["Tamanho", "2 pessoas"],
      ["Ramo", "Salão de beleza"],
      ["Usa a Mimu há", "1 ano e 2 meses"],
    ],
    shareLabel: "Compartilhar",
    shareIcons: SHARE_ICONS,
    banner: {
      file: "J14tiC4MnSpdAaV0BhQVmfLmzQg.png",
      alt: "Imagem de abertura da história do Salão da Andréia.",
      w: 1880,
      h: 1240,
    },
    quote:
      "“Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.”",
    avatar: {
      file: "WXyn7lOXcfhlfB9BfdUN8clhx4.png",
      alt: "",
      w: 498,
      h: 540,
    },
    name: "Andréia",
    role: "Dona do Salão da Andréia",
    stats: [
      ["6 h", "por semana de volta para o atendimento"],
      ["R$ 0", "de material comprado sem precisar, depois do controle"],
      ["1 min", "para fechar o caixa no fim do dia"],
    ],
    body: [
      { t: "h2", text: "O problema" },
      {
        t: "p",
        text: "Andréia sabia quanto entrava — mais ou menos. Sabia quanto gastava — mais ou menos. O que ela não sabia era a conta dos dois juntos. O movimento ficava anotado num caderno atrás do balcão, os gastos de material iam para a memória, e o mês só fechava quando ela sentava no domingo à noite para tentar lembrar de tudo. Quase sempre faltava alguma coisa.",
      },
      {
        t: "quote",
        lines: [
          "“Eu trabalhava o mês inteiro e no fim não sabia dizer se tinha sobrado. Comprava material achando que dava, e às vezes não dava.”",
          "Andréia, Salão da Andréia",
        ],
      },
      { t: "h2", text: "O que ela precisava" },
      {
        t: "p",
        text: "Três coisas, e nenhuma delas era um sistema complicado. Primeira: registrar a venda no intervalo entre uma cliente e outra, sem parar o atendimento. Segunda: enxergar o dia inteiro numa tela só — o que entrou, o que ainda vai entrar e o que precisa ser pago. Terceira: nada que exigisse aprender computador, porque o salão não tem computador.",
      },
      { t: "h2", text: "A solução" },
      {
        t: "p",
        text: "Andréia configurou a Mimu em dois minutos, no próprio celular. Passou a mandar mensagem no intervalo dos atendimentos — “escova da Maria, 120” — e a Mimu entendia, confirmava e lançava. A agenda do dia virou faturamento previsto: assim que marcava um horário, o valor já aparecia como entrada esperada. No fim da tarde, o resumo chegava pronto.",
      },
      {
        t: "quote",
        lines: [
          "“Eu falo com ela como falo com uma amiga. Não tem menu, não tem formulário. Eu digito do jeito que eu falo e ela entende.”",
          "Andréia, Salão da Andréia",
        ],
      },
      {
        t: "img",
        file: "9YFD5qeREtDHEDRwOkGMDa458A.jpg",
        alt: "Duas pessoas conversando sobre o movimento do negócio em uma mesa clara.",
        w: 600,
        h: 337,
        ratio: 1.7804154302670623,
      },
      { t: "h2", text: "O resultado" },
      {
        t: "p",
        text: "O domingo à noite deixou de ser dia de fechar conta. As seis horas que Andréia gastava por semana tentando reconstruir o movimento voltaram para o salão — e parte delas virou horário disponível na agenda. Com o previsto na tela, ela passou a comprar material sabendo quanto ia entrar na semana, e parou de antecipar compra que podia esperar.",
      },
      {
        t: "quote",
        lines: [
          "“O que mudou não foi só o tempo. Foi eu saber. Antes eu ia no escuro e torcia. Hoje eu olho o celular e sei se o dia foi bom.”",
          "Andréia, Salão da Andréia",
        ],
      },
    ],
    ctaHeading: CTA_HEADING,
    otherHeading: OTHER_HEADING,
    otherLabel: "Outras histórias",
    others: ["mercadinho-do-rodrigo", "manicure-da-carol"],
  },
  {
    slug: "mercadinho-do-rodrigo",
    card: {
      image: {
        file: "l30902jBnhYRkmqxvNvup7pAxNE.png",
        alt: "Imagem de abertura da história do Mercadinho do Rodrigo.",
        w: 1880,
        h: 1240,
      },
      title: "O fiado deixou de sumir no caderno",
      metric: "R$ 940",
      metricLabel: "em fiado esquecido, recuperados no primeiro mês",
      label: "Mercadinho e lanchonete",
    },
    eyebrow: "Histórias",
    category: "Mercadinho e lanchonete",
    heading: "O fiado deixou de sumir no caderno",
    company: "Mercadinho do Rodrigo",
    about:
      "O Mercadinho do Rodrigo atende a vizinhança há doze anos. Boa parte dos clientes compra fiado e acerta no fim do mês — um arranjo de confiança que funciona há uma década e que nenhum sistema tinha conseguido acompanhar.",
    info: [
      ["Onde fica", "Bairro Santa Rita, Contagem"],
      ["Tamanho", "3 pessoas"],
      ["Ramo", "Mercadinho de bairro"],
      ["Usa a Mimu há", "10 meses"],
    ],
    shareLabel: "Compartilhar",
    shareIcons: SHARE_ICONS,
    banner: {
      file: "l30902jBnhYRkmqxvNvup7pAxNE.png",
      alt: "Imagem de abertura da história do Mercadinho do Rodrigo.",
      w: 1880,
      h: 1240,
    },
    quote:
      "“Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.”",
    avatar: {
      file: "ZG1ulyOSE6IqRZHtg7SAYqykB1I.png",
      alt: "",
      w: 498,
      h: 540,
    },
    name: "Rodrigo",
    role: "Dono do Mercadinho do Rodrigo",
    stats: [
      ["R$ 940", "em fiado esquecido, recuperados no primeiro mês"],
      ["0", "cadernos de anotação em uso hoje"],
    ],
    body: [
      { t: "h2", text: "O negócio" },
      {
        t: "p",
        text: "Rodrigo abre às sete e fecha às oito da noite. Entre um cliente e outro, repõe prateleira, confere entrega e anota fiado. O caderno de fiado ficava embaixo do balcão, e era ali que morava a parte mais importante do caixa.",
      },
      { t: "h2", text: "O problema" },
      {
        t: "p",
        text: "Caderno molha, rasga e some. Pior: o que estava escrito nem sempre era legível dali a três semanas. Rodrigo perdia dinheiro de dois jeitos — o que ele esquecia de anotar e o que ele anotava mas não conseguia mais ler. Quando o cliente dizia “acho que já paguei”, não havia como discordar.",
      },
      {
        t: "quote",
        lines: [
          "“Eu não ia brigar com freguês de doze anos por causa de trinta reais que eu não sabia provar. Então eu engolia. E isso acontecia várias vezes por mês.”",
          "Rodrigo, Mercadinho do Rodrigo",
        ],
      },
      { t: "h2", text: "O que ele precisava" },
      {
        t: "p",
        text: "Um lugar onde o fiado ficasse guardado com data e valor, que ele pudesse consultar na frente do cliente sem constrangimento, e que continuasse funcionando quando a internet do bairro caísse — o que acontece com frequência.",
      },
      { t: "h2", text: "A solução" },
      {
        t: "p",
        text: "Rodrigo passou a lançar o fiado na hora, falando com a Mimu enquanto embalava a compra. Cada cliente ficou com seu histórico: quanto deve, desde quando, e o que foi levando. Quando alguém paga, ele avisa e a Mimu dá baixa e atualiza o caixa. Nos dias em que a internet cai, ele registra do mesmo jeito — sobe sozinho depois.",
      },
      {
        t: "quote",
        lines: [
          "“Agora eu viro o celular pro cliente e mostro. Não tem discussão, tem a data ali. E ninguém ficou bravo, porque é justo dos dois lados.”",
          "Rodrigo, Mercadinho do Rodrigo",
        ],
      },
      {
        t: "img",
        file: "DKpcX1kASlpg6vB0cppXDOa5WM.jpg",
        alt: "Pessoa conferindo o movimento do negócio em um aparelho sobre a bancada.",
        w: 500,
        h: 333,
        ratio: 1.4992503748125936,
      },
      { t: "h2", text: "O resultado" },
      {
        t: "p",
        text: "No primeiro mês, a Mimu apontou R$ 940 em fiado que já tinha vencido e que Rodrigo não estava cobrando porque simplesmente não lembrava. Ele mandou mensagem para cada um, e quase todos pagaram — nenhum deles estava fugindo, todos tinham esquecido também.",
      },
      {
        t: "p",
        text: "O caderno de baixo do balcão saiu de circulação. O controle de estoque veio junto: quando um produto está acabando, a Mimu avisa antes de a prateleira ficar vazia.",
      },
      {
        t: "quote",
        lines: [
          "“Não era gente má-pagadora. Era eu que não estava cobrando. A Mimu não deixa mais isso passar.”",
          "Rodrigo, Mercadinho do Rodrigo",
        ],
      },
    ],
    ctaHeading: CTA_HEADING,
    otherHeading: OTHER_HEADING,
    otherLabel: "Outras histórias",
    others: ["salao-da-andreia", "barbearia-do-marcos"],
  },
  {
    slug: "manicure-da-carol",
    card: {
      image: {
        file: "A18qNo9ab5918UyxPOb5q0qSY.png",
        alt: "Imagem de abertura da história da Manicure da Carol.",
        w: 1880,
        h: 1240,
      },
      title: "Organizada sem parar de atender nenhuma vez",
      metric: "100%",
      metricLabel: "dos atendimentos registrados na hora",
      label: "Autônoma",
    },
    eyebrow: "Histórias",
    category: "Autônoma",
    heading: "Organizada sem parar de atender nenhuma vez",
    company: "Manicure da Carol",
    about:
      "Carol atende em domicílio e em casa. Não tem funcionário, não tem ponto comercial e não tem hora livre no meio do dia — cada atendimento emenda no outro.",
    info: [
      ["Onde fica", "Atende em domicílio, Niterói"],
      ["Tamanho", "1 pessoa"],
      ["Ramo", "Manicure e pedicure"],
      ["Usa a Mimu há", "8 meses"],
    ],
    shareLabel: "Compartilhar",
    shareIcons: SHARE_ICONS,
    banner: {
      file: "A18qNo9ab5918UyxPOb5q0qSY.png",
      alt: "Imagem de abertura da história da Manicure da Carol.",
      w: 1880,
      h: 1240,
    },
    quote:
      "“Recomendo para toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.”",
    avatar: {
      file: "QsqmBl8epkM6A7UWvnLY3DxB6sY.png",
      alt: "",
      w: 498,
      h: 540,
    },
    name: "Carol",
    role: "Manicure autônoma",
    stats: [
      ["100%", "dos atendimentos registrados na hora"],
      ["3", "amigas que passaram a usar por indicação dela"],
    ],
    body: [
      { t: "h2", text: "O problema" },
      {
        t: "p",
        text: "Quem trabalha por conta não tem intervalo administrativo. Carol saía de um atendimento e entrava no outro, e a anotação ficava para “mais tarde” — que virava a noite, que virava o dia seguinte, que virava nunca. No fim da semana ela reconstruía de memória quanto tinha recebido, e sempre com a sensação de estar esquecendo alguém.",
      },
      {
        t: "quote",
        lines: [
          "“Eu chegava em casa às nove da noite. A última coisa que eu queria era abrir planilha para lembrar quanto a Fernanda tinha me pagado na terça.”",
          "Carol, Manicure da Carol",
        ],
      },
      { t: "h2", text: "O que ela precisava" },
      {
        t: "p",
        text: "Um jeito de registrar que coubesse nos trinta segundos entre guardar o material e sair para o próximo endereço. Nada que exigisse sentar, abrir aplicativo pesado ou preencher campo por campo.",
      },
      { t: "h2", text: "A solução" },
      {
        t: "p",
        text: "Carol passou a registrar no caminho, enquanto esperava o transporte. Uma frase — “pé e mão da Fernanda, 70” — e estava lançado. O cadastro das clientes foi se formando sozinho, sem ela precisar preencher nada: a Mimu foi guardando quem era, quanto pagava e de quanto em quanto tempo voltava.",
      },
      {
        t: "img",
        file: "Jhux45eGhbpDpSJre40r4VTaQ.jpg",
        alt: "Duas pessoas revisando informações do trabalho em um ambiente claro.",
        w: 982,
        h: 655,
        ratio: 1.499236641221374,
      },
      { t: "h2", text: "O resultado" },
      {
        t: "p",
        text: "Todos os atendimentos passaram a ser registrados no mesmo dia, o que antes nunca acontecia. Com o histórico de frequência na mão, Carol começou a perceber quem estava demorando mais que o normal para voltar e a mandar uma mensagem — e boa parte dessas clientes remarcou.",
      },
      {
        t: "p",
        text: "Ela indicou a Mimu para três amigas que também trabalham por conta. Todas continuam usando.",
      },
      {
        t: "quote",
        lines: [
          "“Eu não mudei minha rotina para usar. Ela é que coube na minha rotina. Por isso deu certo.”",
          "Carol, Manicure da Carol",
        ],
      },
    ],
    ctaHeading: CTA_HEADING,
    otherHeading: OTHER_HEADING,
    otherLabel: "Outras histórias",
    others: ["salao-da-andreia", "mercadinho-do-rodrigo"],
  },
  {
    slug: "barbearia-do-marcos",
    card: {
      image: {
        file: "Azf7B94a8i0c4Y8qVu4e5gm7q4g.png",
        alt: "Imagem de abertura da história da Barbearia do Marcos.",
        w: 1880,
        h: 1240,
      },
      title: "Troquei o caderno molhado do balcão pelo celular",
      metric: "2 min",
      metricLabel: "foi o que levou para configurar tudo",
      label: "Salão e barbearia",
    },
    eyebrow: "Histórias",
    category: "Salão e barbearia",
    heading: "Troquei o caderno molhado do balcão pelo celular",
    company: "Barbearia do Marcos",
    about:
      "A Barbearia do Marcos tem três cadeiras e movimento forte de sexta a domingo. Marcos já tinha tentado dois aplicativos de gestão antes, e desistido dos dois na primeira semana.",
    info: [
      ["Onde fica", "Centro, Campinas"],
      ["Tamanho", "3 pessoas"],
      ["Ramo", "Barbearia"],
      ["Usa a Mimu há", "6 meses"],
    ],
    shareLabel: "Compartilhar",
    shareIcons: SHARE_ICONS,
    banner: {
      file: "Azf7B94a8i0c4Y8qVu4e5gm7q4g.png",
      alt: "Imagem de abertura da história da Barbearia do Marcos.",
      w: 1880,
      h: 1240,
    },
    quote:
      "“Eu anotava tudo num caderno que vivia molhado no balcão. Agora falo com a Mimu entre um cliente e outro e pronto, tá lançado.”",
    avatar: {
      file: "ipx8j5wOmCg7qnlU6EwXrdHU.png",
      alt: "",
      w: 498,
      h: 540,
    },
    name: "Marcos",
    role: "Dono da Barbearia do Marcos",
    stats: [
      ["2 min", "foi o que levou para configurar tudo"],
      ["3 de 3", "barbeiros usando desde a primeira semana"],
      ["0", "treinamentos necessários"],
    ],
    body: [
      { t: "h2", text: "O problema" },
      {
        t: "p",
        text: "Marcos não tinha um problema de controle: tinha um problema de adesão. Ele já sabia que precisava organizar o caixa, e já tinha tentado. Os dois aplicativos anteriores exigiam cadastrar serviço por serviço, escolher categoria e preencher formulário — coisas que ninguém faz com a tesoura na mão e um cliente esperando.",
      },
      {
        t: "quote",
        lines: [
          "“O problema nunca foi eu ser desorganizado. Era que todo aplicativo dava mais trabalho do que o caderno. Aí eu voltava pro caderno.”",
          "Marcos, Barbearia do Marcos",
        ],
      },
      { t: "h2", text: "O que ele precisava" },
      {
        t: "p",
        text: "Algo que os três barbeiros usassem sem ninguém precisar cobrar. Se dependesse de lembrete, ia falhar na segunda semana, como já tinha falhado duas vezes.",
      },
      {
        t: "img",
        file: "Y6hJ3PcmySTnfK3wvO487b3DxCo.jpg",
        alt: "Dois profissionais conferindo os números do negócio em uma mesa de trabalho.",
        w: 912,
        h: 608,
        ratio: 1.5,
      },
      { t: "h2", text: "A solução" },
      {
        t: "p",
        text: "Marcos configurou a Mimu numa terça de manhã, entre dois cortes. Levou dois minutos: disse que era barbearia e pronto. Não teve cadastro de serviço, não teve categoria para escolher. Ele mostrou para os outros dois barbeiros no mesmo dia — a explicação inteira foi “manda mensagem falando o que você fez e quanto foi”.",
      },
      {
        t: "quote",
        lines: [
          "“Não teve treinamento. Eu falei uma frase pros meninos e os dois já estavam usando na mesma tarde.”",
          "Marcos, Barbearia do Marcos",
        ],
      },
      { t: "h2", text: "O resultado" },
      {
        t: "p",
        text: "Os três barbeiros usam desde a primeira semana, sem ninguém cobrar. O caderno saiu do balcão. Marcos passou a saber quanto cada cadeira faz por dia, o que antes ele só estimava — e usou esse número para reorganizar a escala do fim de semana, quando o movimento é maior.",
      },
      {
        t: "quote",
        lines: [
          "“Eu já tinha desistido de aplicativo de gestão. Esse deu certo porque ele não me obrigou a mudar como eu trabalho.”",
          "Marcos, Barbearia do Marcos",
        ],
      },
    ],
    ctaHeading: CTA_HEADING,
    otherHeading: OTHER_HEADING,
    otherLabel: "Outras histórias",
    others: ["salao-da-andreia", "manicure-da-carol"],
  },
];

export const BY_SLUG = new Map(STORIES.map((s) => [s.slug, s]));

/*
 * Abas da listagem. A ordem é a de leitura (do segmento maior para o menor) e
 * não pode ser derivada de STORIES, porque duas histórias dividem a mesma
 * categoria.
 */
export const CATEGORIES = [
  "Todas",
  "Salão e barbearia",
  "Mercadinho e lanchonete",
  "Autônoma",
];
