import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";

export { VALOR_MENSAL_MIMU } from "@/lib/planos";

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  options: { timeout: 8000 },
});

export const mpPayment = new Payment(mpConfig);

/**
 * Assinatura recorrente do Mercado Pago.
 *
 * O checkout de cartão criava um pagamento AVULSO: a pessoa pagava, ganhava 30
 * dias, e quando a data passava batia numa parede e pagava de novo na mão.
 * Isso perdia gente todo mês por esquecimento, não por falta de dinheiro.
 *
 * Com o PreApproval quem cobra é o Mercado Pago, na frequência combinada, e
 * quem avisa o resultado é o webhook. O Pix continua avulso — Pix não tem
 * recorrência, é uma limitação do meio e não do nosso código.
 */
export const mpPreApproval = new PreApproval(mpConfig);
