/**
 * Texto corrido de /legal/:slug.
 *
 * Mora aqui, e não em Legal.tsx, para a página continuar sendo só um
 * renderizador: a prosa enterraria as 60 linhas de layout.
 *
 * ---
 * REVISAR COM O JURÍDICO ANTES DE PUBLICAR.
 *
 * Os documentos do template eram norte-americanos: GDPR, CCPA, foro em
 * Delaware, SOC 2. Nada disso descreve a Mimu, que atende microempreendedor
 * brasileiro. Foram reescritos sobre a LGPD (Lei 13.709/2018) e sobre os fatos
 * que o próprio site afirma — 7 dias grátis sem cartão, R$ 39 a R$ 299,
 * cancelamento sem multa, funcionamento offline, dados no Brasil.
 *
 * Ainda assim isto é minuta, não parecer jurídico: prazos, foro, hipóteses de
 * retenção e a razão social precisam ser confirmados por quem responde pela
 * empresa. Os campos que dependem de dado que não temos estão marcados com
 * CONFIRMAR.
 */

export type Part = string | { b: string } | { a: string; href: string };
export type Block = { h: string } | { p: Part[] };

export type LegalDoc = {
  title: string;
  /** O <time> impresso depois de "Atualizado em" — rótulo e atributo. */
  updated: string;
  datetime: string;
  /**
   * O nível e o preset do título mudam por documento, e o espaço acima também:
   * o h4 da privacidade mantém 32px em todos os tiers; o h2 dos termos cai para
   * 20px abaixo de 744.
   */
  heading: "h2" | "h4";
  blocks: Block[];
};

const PRIVACIDADE_BLOCKS: Block[] = [
  { h: "1. Quem somos e o que este documento explica" },
  { p: ["A Mimu é uma assistente de gestão para microempreendedores. Esta Política de Privacidade explica, em português claro, quais dados coletamos, por que coletamos, com quem compartilhamos e o que você pode pedir a qualquer momento."] },
  { p: ["Ela vale para o aplicativo, para o site e para o atendimento, o que chamamos aqui de \"Serviço\". Ao usar a Mimu, você concorda com o que está escrito abaixo. Se não concordar, é melhor não usar o Serviço."] },
  { p: ["Tratamos seus dados de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."] },
  { h: "2. Quais dados a gente coleta" },
  { p: [{ b: "2.1 O que você nos dá" }] },
  { p: ["Dados de cadastro, seu nome, telefone, e-mail e o tipo do seu negócio. Dados de pagamento, processados pelo nosso parceiro de pagamentos; a Mimu não guarda o número completo do seu cartão. Dados do seu negócio, vendas, contas a pagar, agendamentos, produtos, fiado e o que mais você registrar. Dados dos seus clientes, nome, contato e histórico de atendimento, quando você escolhe cadastrá-los. Conversas, o que você fala com a Mimu e com o suporte."] },
  { p: [{ b: "2.2 O que o sistema registra sozinho" }] },
  { p: ["Uso do aplicativo, telas abertas, recursos usados e horários, para entendermos o que precisa melhorar. Dados do aparelho, modelo, sistema operacional, versão do app e identificadores técnicos. Registros de acesso, endereço IP e data e hora das requisições, que a legislação brasileira nos obriga a guardar."] },
  { h: "3. Por que a gente usa esses dados" },
  { p: ["Usamos os dados para:"] },
  { p: ["Fazer o Serviço funcionar, registrar vendas, calcular seu faturamento, organizar sua agenda e manter tudo sincronizado entre seus aparelhos. Deixar a assistente útil, a Mimu entende o que você escreve e sugere lançamentos a partir do seu histórico. Cobrar a assinatura, processar o pagamento e enviar confirmação. Falar com você, avisos da conta, alertas de segurança e respostas do suporte. Melhorar o produto, analisar padrões de uso para corrigir falhas e criar recursos novos. Cumprir a lei, atender determinação legal ou judicial."] },
  { p: ["A Mimu não vende os seus dados nem os dados do seu negócio. Não repassamos seu movimento para anunciante, banco, seguradora ou agência de crédito."] },
  { h: "4. Com quem a gente compartilha" },
  { p: [{ b: "4.1 Fornecedores" }, " Compartilhamos o mínimo necessário com empresas que nos ajudam a operar: hospedagem em nuvem, processamento de pagamento e ferramentas de suporte. Todas são obrigadas por contrato a usar os dados apenas para prestar esse serviço à Mimu."] },
  { p: [{ b: "4.2 Obrigação legal" }, " Podemos divulgar informações quando a lei exigir ou mediante ordem judicial. Sempre que for permitido, avisamos você antes."] },
  { p: [{ b: "4.3 Mudança societária" }, " Se a Mimu for vendida ou incorporada, seus dados podem ser transferidos junto. Nesse caso você é avisado com antecedência e pode encerrar a conta antes que outra política passe a valer."] },
  { p: ["Fora dessas três situações, ninguém mais recebe seus dados."] },
  { h: "5. Por quanto tempo a gente guarda" },
  { p: ["Guardamos seus dados enquanto sua conta existir. Se você cancelar, mantemos tudo por 90 dias para o caso de você querer voltar, depois desse prazo, apagamos ou anonimizamos, salvo o que a lei nos obrigue a reter, como os registros de acesso."] },
  { p: ["Você pode pedir a exclusão antes disso escrevendo para ", { a: "privacidade@mimu.app", href: "mailto:privacidade@mimu.app" }, ". Respondemos em até 15 dias."] },
  { h: "6. Como a gente protege" },
  { p: ["Os dados trafegam e ficam guardados criptografados, com backup diário e servidores no Brasil. O acesso interno é restrito: ninguém da equipe abre o movimento de um cliente para olhar, e todo acesso técnico necessário fica registrado."] },
  { p: ["Nenhum sistema é impenetrável. Se acontecer um incidente que possa te afetar, avisamos você e a Autoridade Nacional de Proteção de Dados (ANPD), como a LGPD determina."] },
  { h: "7. Funcionamento offline" },
  { p: ["A Mimu funciona sem internet. Enquanto você está offline, os lançamentos ficam guardados no próprio aparelho e sobem para os nossos servidores assim que a conexão volta. Isso significa que parte dos seus dados vive no seu celular, se ele for perdido ou emprestado, quem tiver o aparelho desbloqueado pode ver o que estava lá. Recomendamos manter bloqueio de tela."] },
  { h: "8. Os dados dos seus clientes" },
  { p: ["Quando você cadastra um cliente, você é o controlador daqueles dados e a Mimu é a operadora, nós tratamos em seu nome, seguindo suas instruções. Cabe a você ter uma base legal para guardar as informações de quem te procura, e usá-las apenas para atender e se relacionar com essas pessoas."] },
  { p: ["A Mimu não usa os dados dos seus clientes para nada além de fazer o seu aplicativo funcionar."] },
  { h: "9. Seus direitos" },
  { p: ["A LGPD garante que você possa, a qualquer momento:"] },
  { p: [{ b: "Confirmar e acessar" }, ", saber se tratamos seus dados e receber uma cópia. ", { b: "Corrigir" }, ", pedir o acerto de informação incompleta ou desatualizada. ", { b: "Excluir" }, ", pedir a eliminação dos dados tratados com base no seu consentimento. ", { b: "Levar embora" }, ", receber seu histórico em formato que dê para abrir em outro lugar. ", { b: "Revogar o consentimento" }, ", voltar atrás em qualquer autorização que você tenha dado. ", { b: "Se opor" }, ", questionar um tratamento que você considere indevido. ", { b: "Reclamar" }, ", levar o caso à ANPD."] },
  { p: ["Para exercer qualquer um deles, escreva para ", { a: "privacidade@mimu.app", href: "mailto:privacidade@mimu.app" }, ". Não cobramos nada por isso."] },
  { h: "10. Cookies no site" },
  { p: ["No site da Mimu usamos cookies essenciais, que fazem as páginas funcionarem, e cookies de medição, que nos dizem quantas pessoas visitaram cada seção. Não usamos cookies para montar perfil de publicidade. Você pode bloqueá-los no seu navegador; os essenciais, se bloqueados, podem quebrar partes do site."] },
  { h: "11. Menores de idade" },
  { p: ["O Serviço é destinado a maiores de 18 anos, que é a idade para assumir a responsabilidade por um negócio. Não coletamos dados de crianças e adolescentes de propósito. Se descobrirmos que isso aconteceu, apagamos. Se você acha que é o caso, avise em ", { a: "privacidade@mimu.app", href: "mailto:privacidade@mimu.app" }, "."] },
  { h: "12. Mudanças nesta política" },
  { p: ["Se mudarmos algo relevante, avisamos por e-mail ou dentro do aplicativo com pelo menos 14 dias de antecedência. A data de atualização no topo desta página sempre mostra a última revisão."] },
  { h: "13. Fale com a gente" },
  { p: ["Dúvida, pedido ou reclamação sobre privacidade, escreva para o nosso encarregado de dados:"] },
  { p: [{ a: "privacidade@mimu.app", href: "mailto:privacidade@mimu.app" }] },
  { p: ["CONFIRMAR: razão social, CNPJ, endereço e nome do encarregado de dados precisam ser preenchidos aqui antes da publicação."] },
];

const TERMOS_BLOCKS: Block[] = [
  { h: "1. O que você aceita ao usar a Mimu" },
  { p: ["Ao criar uma conta ou usar a Mimu (\"o Serviço\"), você concorda com estes Termos de Uso. Se não concordar, não use o Serviço."] },
  { p: ["Estes Termos valem para todo mundo que acessa a Mimu. Ao se cadastrar, você confirma que tem pelo menos 18 anos e que pode assumir esse compromisso."] },
  { h: "2. O que a Mimu faz" },
  { p: ["A Mimu é uma assistente de gestão para microempreendedores. Ela registra vendas, organiza contas a pagar e a receber, controla fiado, guarda a agenda e o cadastro de clientes, e mostra o faturamento realizado e o previsto."] },
  { p: ["A Mimu é uma ferramenta de organização, e não substitui contador, contabilidade formal nem obrigação fiscal. Os números que ela mostra servem para você tocar o dia a dia, a apuração oficial do seu negócio continua sendo responsabilidade sua e do seu contador."] },
  { h: "3. Sua conta" },
  { p: ["Para usar o Serviço você cria uma conta com informações verdadeiras. Você é responsável por:"] },
  { p: ["Guardar sua senha e não emprestar seu acesso. Tudo o que acontecer dentro da sua conta. Avisar a gente em ", { a: "oi@mimu.app", href: "mailto:oi@mimu.app" }, " se desconfiar que alguém entrou sem autorização."] },
  { p: ["Podemos suspender ou encerrar contas que informem dados falsos ou descumpram estes Termos."] },
  { h: "4. Teste grátis" },
  { p: ["Você tem 7 dias para usar a Mimu inteira sem pagar nada e sem informar cartão de crédito. Ao fim do teste, o acesso aos recursos pagos é interrompido até você escolher um plano. A gente não cobra automaticamente quem só testou."] },
  { h: "5. Planos e cobrança" },
  { p: [{ b: "5.1 Planos" }, " A Mimu tem um único conjunto de recursos e quatro periodicidades: mensal (R$ 39), trimestral (R$ 99), semestral (R$ 179) e anual (R$ 299). Todos dão acesso às mesmas funções, o que muda é o tempo contratado e o valor por mês."] },
  { p: [{ b: "5.2 Renovação" }, " A assinatura se renova automaticamente ao fim de cada período, pelo mesmo prazo, até você cancelar. Ao informar uma forma de pagamento, você autoriza essa cobrança recorrente."] },
  { p: [{ b: "5.3 Mudança de preço" }, " Se os valores mudarem, avisamos com pelo menos 30 dias de antecedência. Quem já é assinante mantém o preço até o fim do período contratado, e pode cancelar antes da renovação se não concordar com o valor novo."] },
  { p: [{ b: "5.4 Arrependimento e reembolso" }, " Você pode desistir em até 7 dias corridos após a contratação e receber o valor de volta integralmente, como garante o Código de Defesa do Consumidor. Passado esse prazo, planos de mais de um mês podem ser reembolsados proporcionalmente ao tempo não usado. Peça em ", { a: "oi@mimu.app", href: "mailto:oi@mimu.app" }, "."] },
  { h: "6. Cancelamento" },
  { p: ["Você cancela quando quiser, direto no aplicativo, sem multa e sem precisar ligar para ninguém. O cancelamento vale para a próxima renovação: você continua usando até o fim do período já pago."] },
  { p: ["Depois de cancelar, seus dados ficam guardados por 90 dias, caso você queira voltar. Antes disso, você pode exportar todo o seu histórico, os dados são seus."] },
  { h: "7. Uso adequado" },
  { p: ["Você concorda em não usar o Serviço para:"] },
  { p: ["Descumprir a lei. Registrar informação falsa para enganar terceiros. Tentar invadir, sobrecarregar ou atrapalhar o funcionamento do Serviço. Copiar, descompilar ou tentar extrair o código da Mimu. Enviar programa malicioso. Revender ou ceder seu acesso a outra pessoa sem a nossa autorização por escrito."] },
  { p: ["Quem descumprir estes pontos pode ter o acesso suspenso ou encerrado."] },
  { h: "8. Propriedade" },
  { p: ["O aplicativo, o nome Mimu, a marca, o desenho das telas e o software são nossos e protegidos por lei. Você recebe uma licença limitada, pessoal e intransferível para usar o Serviço no seu negócio."] },
  { h: "9. Os seus dados" },
  { p: ["Tudo o que você registra na Mimu continua sendo seu. Ao usar o Serviço, você nos autoriza a guardar e processar esse conteúdo com um único objetivo: fazer a Mimu funcionar para você."] },
  { p: ["Não vendemos o seu conteúdo. O tratamento dos dados é detalhado na nossa Política de Privacidade."] },
  { h: "10. Disponibilidade" },
  { p: ["A gente trabalha para manter a Mimu no ar o tempo todo, e o aplicativo funciona mesmo sem internet, sincronizando depois. Ainda assim, não é possível garantir funcionamento ininterrupto: pode haver manutenção programada, falha de fornecedor ou instabilidade fora do nosso controle. Avisamos com antecedência sempre que a manutenção for planejada."] },
  { h: "11. Limites de responsabilidade" },
  { p: ["A Mimu é oferecida como está. A gente responde pelos defeitos do próprio Serviço, nos termos do Código de Defesa do Consumidor, mas não por decisões de negócio que você tome a partir dos números exibidos, nem por prejuízo causado por informação que você mesmo registrou errado."] },
  { p: ["Nossa responsabilidade por qualquer reclamação relacionada ao Serviço fica limitada ao valor que você pagou à Mimu nos 12 meses anteriores ao fato, ressalvadas as hipóteses em que a lei não admite limitação."] },
  { h: "12. Mudanças no Serviço e nestes Termos" },
  { p: ["Podemos alterar, suspender ou encerrar partes do Serviço. Mudanças relevantes nestes Termos são comunicadas por e-mail ou dentro do aplicativo com pelo menos 14 dias de antecedência. Continuar usando a Mimu depois disso significa aceitar a versão nova; se não concordar, você pode cancelar sem custo."] },
  { h: "13. Lei aplicável e foro" },
  { p: ["Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do consumidor para resolver qualquer disputa, como determina o Código de Defesa do Consumidor."] },
  { h: "14. Fale com a gente" },
  { p: ["Dúvidas sobre estes Termos:"] },
  { p: [{ b: "Mimu" }, " ", { a: "oi@mimu.app", href: "mailto:oi@mimu.app" }] },
  { p: ["CONFIRMAR: razão social, CNPJ e endereço completo precisam ser preenchidos aqui antes da publicação."] },
];

export const LEGAL: Record<string, LegalDoc> = {
  privacidade: {
    title: "Política de Privacidade",
    updated: "21 de maio de 2026",
    datetime: "2026-05-21T00:00:00.000Z",
    heading: "h4",
    blocks: PRIVACIDADE_BLOCKS,
  },
  termos: {
    title: "Termos de Uso",
    updated: "20 de maio de 2026",
    datetime: "2026-05-20T00:00:00.000Z",
    heading: "h2",
    blocks: TERMOS_BLOCKS,
  },
};
