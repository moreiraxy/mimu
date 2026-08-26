import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { FormaPagamentoMP, OrigemPagamento } from "@/types";
import { MODULOS } from "@/lib/modulos";
import {
  proximaCobrancaDe,
  valorDoPlano,
  type Periodicidade,
  type PlanoPago,
} from "@/lib/planos";

type Supabase = SupabaseClient<Database>;

/**
 * Uma compra aprovada num checkout que NÃO é o da Mimu.
 *
 * O checkout próprio tem a ordem invertida: a pessoa se cadastra, faz o
 * onboarding e só então paga, então quando o pagamento cai a conta já existe e
 * o webhook só vira uma chave. Num link de checkout externo, compartilhado no
 * Instagram ou por afiliado, ninguém passou pelo mimu.app — a compra chega
 * antes da conta, e é este módulo que fecha esse buraco.
 *
 * Os campos chegam normalizados de propósito. O adaptador de cada provedor
 * traduz o payload dele para isto, e o miolo aqui não precisa saber de quem
 * veio a venda. Trocar de plataforma amanhã é reescrever o adaptador.
 */
export interface CompraExterna {
  origem: OrigemPagamento;
  /** E-mail usado no checkout. É por ele que a conta é encontrada ou criada. */
  email: string;
  /** Vira o nome da empresa. Nulo quando o provedor não coleta. */
  nomeNegocio: string | null;
  plano: PlanoPago;
  /** Mensal ou anual. Decide o valor esperado e quando a renovação cai. */
  periodicidade: Periodicidade;
  valor: number;
  formaPagamento: FormaPagamentoMP;
  /** Id da transação no provedor. É a chave de idempotência do webhook. */
  pagamentoId: string;
  /** Status cru do provedor, guardado sem tradução, para depuração. */
  statusProvedor: string | null;
}

export type ResultadoCompra =
  | {
      ok: true;
      empresaId: string;
      /** true quando a conta nasceu agora e a pessoa ainda precisa definir senha. */
      contaNova: boolean;
      /** true quando esta notificação já tinha sido processada antes. */
      jaProcessado: boolean;
    }
  | { ok: false; motivo: string };

/*
 * Cada provedor grava o id dele na própria coluna, em vez de dividirem uma
 * coluna genérica. É proposital: o painel do Mercado Pago lê `mp_payment_id`
 * para a pontuação de qualidade da integração, e unificar isso agora mexeria
 * justamente no caminho que precisa ficar parado. O preço é este par de mapas,
 * que concentra a diferença num lugar só.
 */
const COLUNA_ID = {
  mercadopago: "mp_payment_id",
  cakto: "cakto_payment_id",
  // Venda manual não tem transação de provedor. A referência é escrita por
  // quem registra (o id do Pix, por exemplo) e serve de chave de idempotência
  // do mesmo jeito: registrar a mesma venda duas vezes não cria duas linhas.
  manual: "manual_referencia",
} as const satisfies Record<OrigemPagamento, string>;

/**
 * As colunas do provedor, montadas explicitamente em vez de por chave
 * computada: `{ [coluna]: valor }` faz o TypeScript alargar o objeto para uma
 * assinatura de índice, e o insert tipado do Supabase recusa isso.
 */
function colunasDoProvedor(compra: CompraExterna) {
  if (compra.origem === "manual") {
    return { manual_referencia: compra.pagamentoId };
  }
  return compra.origem === "cakto"
    ? {
        cakto_payment_id: compra.pagamentoId,
        cakto_status: compra.statusProvedor,
      }
    : {
        mp_payment_id: compra.pagamentoId,
        mp_status: compra.statusProvedor,
      };
}

/**
 * Acha a conta pelo e-mail do comprador, ou cria uma.
 *
 * O admin do Supabase não expõe busca por e-mail. O caminho que funciona é
 * tentar criar e usar a falha como resposta: se o e-mail já existe, o
 * `generateLink` resolve o endereço e devolve o usuário junto.
 */
async function acharOuCriarUsuario(
  service: Supabase,
  email: string,
  nomeNegocio: string | null,
): Promise<{ userId: string; contaNova: boolean } | null> {
  const { data: criado, error: erroCriar } = await service.auth.admin.createUser(
    {
      email,
      // Veio de um pagamento aprovado: o e-mail já se provou. Exigir
      // confirmação aqui trancaria do lado de fora quem acabou de pagar.
      email_confirm: true,
      // O trigger `on_auth_user_created` lê exatamente esta chave para criar a
      // empresa. Sem ela a empresa nasce como "Meu negócio".
      user_metadata: { nome_negocio: nomeNegocio ?? "Meu negócio" },
    },
  );

  if (!erroCriar && criado?.user) {
    return { userId: criado.user.id, contaNova: true };
  }

  const { data: link, error: erroLink } = await service.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (erroLink || !link?.user) {
    console.error("Não consegui achar nem criar a conta do comprador:", {
      erroCriar: erroCriar?.message,
      erroLink: erroLink?.message,
    });
    return null;
  }

  return { userId: link.user.id, contaNova: false };
}

/**
 * Libera o acesso a partir de uma compra aprovada fora do mimu.app.
 *
 * Roda com a service role: não existe sessão de usuário quando um webhook
 * chega, e nada aqui pode depender de RLS.
 */
export async function liberarCompraExterna(
  service: Supabase,
  compra: CompraExterna,
): Promise<ResultadoCompra> {
  /*
   * Recusa a combinação que a Mimu não vende, antes de gravar qualquer coisa.
   *
   * A checagem mora AQUI e não em quem chama porque o webhook do provedor
   * externo entra por esta porta direto, sem passar pela rota do painel: uma
   * validação feita lá fora protege só um dos dois caminhos.
   *
   * O que se valida é a EXISTÊNCIA da combinação, não o valor. O valor cobrado
   * continua vindo do payload e é ele que fica gravado, porque com cupom o
   * cobrado difere legitimamente da tabela. Mas plano sem preço naquela
   * periodicidade é um plano que não está à venda, e aceitar assim mesmo criaria
   * uma assinatura com renovação marcada para um prazo que ninguém definiu.
   */
  if (valorDoPlano(compra.plano, compra.periodicidade) === null) {
    console.error("Compra externa recusada: combinação não vendida.", {
      origem: compra.origem,
      plano: compra.plano,
      periodicidade: compra.periodicidade,
      pagamentoId: compra.pagamentoId,
    });
    return { ok: false, motivo: "combinacao_nao_vendida" };
  }

  const colunaId = COLUNA_ID[compra.origem];

  /*
   * Idempotência antes de tudo. Provedor de pagamento reenvia notificação
   * quando não recebe 200 rápido o bastante, e sem esta checagem a mesma
   * compra viraria duas linhas em `pagamentos` — ou pior, um segundo e-mail de
   * "defina sua senha" para quem já definiu.
   */
  const { data: existente } = await service
    .from("pagamentos")
    .select("id, empresa_id")
    .eq("origem", compra.origem)
    .eq(colunaId, compra.pagamentoId)
    .maybeSingle();

  if (existente) {
    return {
      ok: true,
      empresaId: existente.empresa_id,
      contaNova: false,
      jaProcessado: true,
    };
  }

  const usuario = await acharOuCriarUsuario(
    service,
    compra.email,
    compra.nomeNegocio,
  );

  if (!usuario) {
    return { ok: false, motivo: "conta_nao_resolvida" };
  }

  // A empresa não é criada aqui: o trigger `on_auth_user_created` já fez isso
  // no insert do usuário. Contas antigas também já têm a delas.
  const { data: empresa } = await service
    .from("empresas")
    .select("id, modulos_ativos")
    .eq("user_id", usuario.userId)
    .maybeSingle();

  if (!empresa) {
    return { ok: false, motivo: "empresa_nao_encontrada" };
  }

  // A periodicidade da compra decide quando a renovação cai. Era um mês fixo,
  // e quem pagava o ano adiantado ficava com a próxima cobrança marcada para
  // daqui a trinta dias.
  const proximaCobranca = proximaCobrancaDe(compra.periodicidade);

  /*
   * Upsert por `empresa_id`, que é único em `assinaturas`.
   *
   * Insert puro quebraria no caso mais provável de todos: quem já usava a Mimu
   * no teste grátis e comprou pelo link da Cakto. Essa conta já tem uma linha
   * de assinatura em "trial", e o que precisa acontecer é ela virar "ativa" —
   * não nascer uma segunda.
   */
  const { data: assinatura, error: erroAssinatura } = await service
    .from("assinaturas")
    .upsert(
      {
        empresa_id: empresa.id,
        status: "ativa",
        plano: compra.plano,
        // Guarda o valor efetivamente cobrado, que numa anual é o do ano
        // inteiro. A coluna se chama `valor_mensal` por herança; o comentário
        // dela no banco explica.
        valor_mensal: compra.valor,
        periodicidade: compra.periodicidade,
        proxima_cobranca: proximaCobranca.toISOString(),
        origem: compra.origem,
      },
      { onConflict: "empresa_id" },
    )
    .select("id")
    .single();

  if (erroAssinatura || !assinatura) {
    console.error("Erro ao ativar assinatura de compra externa:", erroAssinatura);
    return { ok: false, motivo: "assinatura_nao_ativada" };
  }

  /*
   * Liga os módulos, porque os dois planos dão todos.
   *
   * Sem isto a pessoa pagava e entrava numa conta com zero módulo: o menu vinha
   * vazio e não havia nada para usar. Quem compra pelo checkout próprio passa
   * pelo onboarding e escolhe ali; quem compra por fora cai direto no app, e a
   * escolha nunca acontece.
   *
   * Só liga o que falta. Uma conta que já usava a Mimu no teste e comprou
   * depois pode ter desligado um módulo de propósito, e religar na hora do
   * pagamento seria desfazer uma decisão dela.
   */
  const TODOS = MODULOS.flatMap((m) => m.chaves);
  const jaAtivos = empresa.modulos_ativos ?? [];
  const faltando = TODOS.filter((m) => !jaAtivos.includes(m));

  if (jaAtivos.length === 0) {
    const { error: erroModulos } = await service
      .from("empresas")
      .update({ modulos_ativos: TODOS })
      .eq("id", empresa.id);

    if (erroModulos) {
      // Não derruba a compra: o pagamento já foi feito e a assinatura já está
      // ativa. Mas registra alto, porque a pessoa vai abrir um app vazio.
      console.error("Compra liberada, mas os módulos não ligaram.", {
        empresaId: empresa.id,
        erro: erroModulos.message,
      });
    }
  } else if (faltando.length > 0) {
    console.info("Compra externa: conta já tinha módulos escolhidos, mantidos como estavam.", {
      empresaId: empresa.id,
      faltando,
    });
  }

  const { error: erroPagamento } = await service.from("pagamentos").insert({
    empresa_id: empresa.id,
    assinatura_id: assinatura.id,
    valor: compra.valor,
    status: "aprovado",
    forma_pagamento: compra.formaPagamento,
    origem: compra.origem,
    ...colunasDoProvedor(compra),
  });

  if (erroPagamento) {
    // A assinatura já está ativa, então a pessoa tem acesso. O que se perde é
    // o histórico da cobrança, e isso não justifica devolver erro e fazer o
    // provedor reenviar a notificação inteira.
    console.error("Assinatura ativada, mas o pagamento não foi gravado:", {
      empresaId: empresa.id,
      origem: compra.origem,
      pagamentoId: compra.pagamentoId,
      erro: erroPagamento.message,
    });
  }

  return {
    ok: true,
    empresaId: empresa.id,
    contaNova: usuario.contaNova,
    jaProcessado: false,
  };
}

/**
 * Manda o e-mail de "defina sua senha" para quem comprou fora do mimu.app.
 *
 * Quem chega por aqui nunca escolheu senha: a conta foi criada pelo webhook a
 * partir do e-mail do checkout. O link de recuperação é o mesmo mecanismo do
 * "esqueci minha senha", e cai na tela `/redefinir-senha` que já existe.
 */
export async function enviarLinkParaDefinirSenha(
  service: Supabase,
  email: string,
  origin: string,
) {
  const { error } = await service.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha?primeiro_acesso=1`,
  });

  if (error) {
    console.error("Erro ao enviar link de primeiro acesso:", error.message);
  }

  return { error };
}

/**
 * O que aconteceu com um pagamento que foi desfeito.
 *
 * Reembolso e chargeback chegam pelo mesmo webhook, com status diferente, e
 * têm o mesmo efeito no acesso: quem pediu o dinheiro de volta não continua
 * usando. A distinção é guardada para conferência, não para mudar o
 * comportamento.
 */
export type TipoReversao = "reembolso" | "chargeback";

export type ResultadoReversao =
  | { ok: true; empresaId: string; jaRevertido: boolean }
  | { ok: false; motivo: string };

/**
 * Revoga o acesso de uma compra que foi desfeita.
 *
 * Sem isto, quem pedia reembolso ou abria chargeback continuava com o app
 * liberado indefinidamente: o pagamento voltava para a pessoa e a assinatura
 * seguia ativa, porque nada no sistema ligava uma coisa à outra.
 *
 * Encontra o pagamento pelo id do provedor, que é a única coisa que o webhook
 * de reversão traz com certeza. Se não achar, não inventa: devolve
 * `pagamento_nao_encontrado` em vez de cancelar a assinatura por adivinhação.
 */
export async function reverterCompraExterna(
  service: Supabase,
  reversao: {
    origem: OrigemPagamento;
    /** Id da transação no provedor, o mesmo usado na compra. */
    pagamentoId: string;
    tipo: TipoReversao;
    /** Status cru do provedor, guardado sem tradução. */
    statusProvedor: string | null;
  },
): Promise<ResultadoReversao> {
  const colunaId = COLUNA_ID[reversao.origem];

  const { data: pagamento, error: erroBusca } = await service
    .from("pagamentos")
    .select("id, empresa_id, status")
    .eq("origem", reversao.origem)
    .eq(colunaId, reversao.pagamentoId)
    .maybeSingle();

  if (erroBusca) {
    console.error("Erro ao buscar pagamento para reverter:", erroBusca);
    return { ok: false, motivo: "erro_ao_buscar_pagamento" };
  }

  if (!pagamento) {
    // Acontece de verdade: chargeback de uma compra feita antes de a
    // integração existir, ou notificação de um provedor que não é o nosso.
    console.error("Reversão recebida para pagamento desconhecido.", {
      origem: reversao.origem,
      pagamentoId: reversao.pagamentoId,
    });
    return { ok: false, motivo: "pagamento_nao_encontrado" };
  }

  /*
   * Idempotência. Provedor reenvia notificação até receber 200, e um
   * chargeback costuma vir acompanhado de um reembolso logo em seguida. Sem
   * isto, a segunda chamada cancelaria de novo uma assinatura já cancelada e
   * registraria um segundo evento como se fosse outro caso.
   */
  if (pagamento.status === "reembolsado") {
    return { ok: true, empresaId: pagamento.empresa_id, jaRevertido: true };
  }

  const { error: erroPagamento } = await service
    .from("pagamentos")
    .update({ status: "reembolsado", ...colunasDeStatus(reversao) })
    .eq("id", pagamento.id);

  if (erroPagamento) {
    console.error("Erro ao marcar pagamento como revertido:", erroPagamento);
    return { ok: false, motivo: "pagamento_nao_atualizado" };
  }

  /*
   * A assinatura vira "cancelada", e não "vencida".
   *
   * Vencida é o prazo que acabou naturalmente; cancelada é o acordo desfeito.
   * A diferença aparece na tela: quem venceu é convidada a renovar, quem teve
   * o pagamento revertido precisa falar com a gente antes.
   *
   * A data de próxima cobrança é limpa junto. Deixá-la no futuro faria a conta
   * parecer paga em qualquer relatório que olhe só a data.
   */
  const { error: erroAssinatura } = await service
    .from("assinaturas")
    .update({ status: "cancelada", proxima_cobranca: null })
    .eq("empresa_id", pagamento.empresa_id);

  if (erroAssinatura) {
    console.error("Pagamento revertido, mas a assinatura não foi cancelada.", {
      empresaId: pagamento.empresa_id,
      erro: erroAssinatura.message,
    });
    return { ok: false, motivo: "assinatura_nao_cancelada" };
  }

  return { ok: true, empresaId: pagamento.empresa_id, jaRevertido: false };
}

/**
 * Guarda o status cru do provedor na coluna dele.
 *
 * Venda manual não tem coluna de status: a reversão de uma venda feita na mão
 * é registrada só pela mudança para "reembolsado".
 */
function colunasDeStatus(reversao: {
  origem: OrigemPagamento;
  statusProvedor: string | null;
}) {
  if (reversao.origem === "cakto") {
    return { cakto_status: reversao.statusProvedor };
  }
  if (reversao.origem === "mercadopago") {
    return { mp_status: reversao.statusProvedor };
  }
  return {};
}
