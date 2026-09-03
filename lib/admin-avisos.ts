import "server-only";
import { avisarAdmins } from "@/lib/avisos-internos";

/**
 * Avisos para os admins do produto (não para as usuárias).
 *
 * O push existente é endereçado por empresa (`push_subscriptions.empresa_id`),
 * e todo admin também é dona de uma conta — então o aviso vai para a empresa
 * do próprio admin, reaproveitando o service worker que já está no ar. Nada
 * de infra nova nem de e-mail.
 */

/**
 * Avisa todos os admins que alguém acabou de se cadastrar.
 *
 * Silenciosa por completo: um erro aqui NUNCA pode derrubar o cadastro. A
 * pessoa terminou de criar a conta dela; falhar a notificação interna e
 * devolver erro pra ela seria trocar um aviso perdido por um cliente perdido.
 * Por isso tudo roda dentro de try/catch e o retorno é ignorado por quem chama.
 */

export async function avisarAdminsNovoCadastro(
  nomeNegocio: string,
): Promise<void> {
  await avisarAdmins({
    title: "Novo cadastro na Mimu",
    body: `${nomeNegocio} acabou de criar uma conta.`,
    url: "/admin",
  });
}

/**
 * Avisa que a Mimu parou de responder.
 *
 * É o aviso que não existia quando a Groq aposentou o modelo: a Mimu ficou
 * muda por horas e a descoberta veio de reclamação de cliente.
 */
export async function avisarAdminsMimuFora(motivo: string): Promise<void> {
  await avisarAdmins({
    title: "A Mimu parou de responder",
    body: motivo.slice(0, 140),
    url: "/admin",
  });
}

/** Avisa que entrou uma venda. */
export async function avisarAdminsVenda(dados: {
  plano: string;
  periodicidade: string;
  valor: number;
  email: string;
  renovacao: boolean;
}): Promise<void> {
  const valor = dados.valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  await avisarAdmins({
    title: dados.renovacao ? "Renovação na Mimu" : "Venda nova na Mimu 🎉",
    body: `${dados.plano} ${dados.periodicidade} — ${valor} · ${dados.email}`,
    url: "/admin",
  });
}

/**
 * Avisa que chegou dinheiro e o acesso NÃO foi liberado.
 *
 * É o aviso mais importante do arquivo: dinheiro entrou e a pessoa não entrou.
 * Sem este push, a descoberta viria pela cliente reclamando que pagou e ficou
 * de fora.
 *
 * Nasceu para um checkout externo que não reenviava notificação — uma venda
 * não liberada na primeira tentativa nunca voltava sozinha. Esse checkout saiu
 * em 03/09/2026, mas o aviso ficou: a venda manual do painel admin passa pelo
 * mesmo caminho, e falhar ali tem a mesma consequência.
 */
export async function avisarAdminsVendaNaoLiberada(
  motivo: string,
): Promise<void> {
  await avisarAdmins({
    title: "Venda paga que não liberou acesso",
    body: `${motivo} — registre no painel para a cliente entrar.`.slice(0, 140),
    url: "/admin",
  });
}
