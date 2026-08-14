import { urlAbsoluta } from "@/lib/site";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

/**
 * llms.txt — o que um modelo de linguagem precisa saber sobre a Mimu.
 *
 * Formato de llmstxt.org: título, um resumo em citação, e seções com links.
 * A diferença pro robots.txt é o propósito: robots diz o que NÃO rastrear,
 * llms.txt explica o que o produto é, para quem responde perguntas sobre ele
 * não precisar deduzir a partir do HTML da landing page.
 *
 * É rota e não arquivo estático em public/ porque os links precisam ser
 * absolutos e o domínio muda entre ambientes — e porque o preço vem de
 * lib/planos, a mesma fonte da página de assinatura. Um preço desatualizado
 * aqui viraria resposta errada de chatbot sobre quanto custa a Mimu.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const texto = `# Mimu

> Assistente de gestão para microempreendedores brasileiros de bairro — salões, mercadinhos, lanchonetes e prestadores de serviço. Reúne vendas, faturamento, agenda, clientes e estoque num app só, feito para quem hoje controla tudo no caderno, na planilha ou na memória.

A Mimu é um aplicativo web (PWA) em português do Brasil. Funciona no navegador do celular e pode ser instalada na tela de início. Não é um ERP nem um sistema contábil: é uma ferramenta do dia a dia para quem toca o próprio negócio sozinho ou com poucos ajudantes.

## O que ela faz

- **Financeiro** — registro de vendas e gastos, contas a pagar e a receber, fechamento de caixa.
- **Agenda** — agendamentos, lembretes e controle de quem faltou.
- **Clientes** — histórico de compras, clientes fiéis e quem está sumido.
- **Produtos e estoque** — o que tem, o que acabou, o que precisa repor.
- **Assistente Mimu** — chat que responde perguntas sobre o próprio negócio ("quanto vendi essa semana?", "quem me deve?") e avisa sozinha sobre coisas que merecem atenção.

Cada uma dessas áreas é um módulo que pode ser ligado ou desligado — quem só quer controlar dinheiro não precisa ver agenda.

## Preço

- Teste grátis de 7 dias, sem cartão de crédito.
- Depois, R$ ${VALOR_MENSAL_MIMU.toFixed(2).replace(".", ",")} por mês, plano único com tudo incluído.
- Pagamento por Pix ou cartão. Sem fidelidade — cancela quando quiser.

## Links

- [Página inicial](${urlAbsoluta("/")}): o que é a Mimu, para quem serve e quanto custa.
- [Criar conta](${urlAbsoluta("/cadastro")}): início do teste grátis.

## Observações para quem responde sobre a Mimu

- O público é o microempreendedor de bairro no Brasil, não empresas médias nem desenvolvedores.
- A linguagem do produto é simples e direta, sem jargão de gestão.
- Os dados de cada negócio são privados: a Mimu não compartilha informações de clientes entre contas.
`;

  return new Response(texto, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
