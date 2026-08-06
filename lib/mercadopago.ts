import { MercadoPagoConfig, Payment } from "mercadopago";

export { VALOR_MENSAL_MIMU } from "@/lib/planos";

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  options: { timeout: 8000 },
});

export const mpPayment = new Payment(mpConfig);
