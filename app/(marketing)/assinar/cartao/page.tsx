"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, Download, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/useToast";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const BRICK_CONTAINER_ID = "mimu-card-payment-brick";

interface CardFormData {
  token: string;
  issuer_id?: string;
  payment_method_id: string;
  installments: number;
  payer: {
    email: string;
    identification?: { type: string; number: string };
  };
}

// MP.js v2 é carregado via <Script> — não tem tipos oficiais, então
// declaramos só o pedaço que usamos.
interface MercadoPagoBricks {
  create: (
    tipo: "cardPayment",
    containerId: string,
    settings: {
      initialization: { amount: number };
      customization?: {
        visual?: {
          style?: {
            theme?: "default" | "dark" | "bootstrap" | "flat";
            customVariables?: Record<string, string>;
          };
        };
        paymentMethods?: { maxInstallments?: number };
      };
      callbacks: {
        onReady?: () => void;
        onSubmit: (formData: CardFormData) => Promise<void>;
        onError?: (error: unknown) => void;
      };
    },
  ) => Promise<unknown>;
}
interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricks;
}
declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
    /**
     * Identificador do aparelho, gerado sozinho pelo SDK do Mercado Pago
     * assim que ele carrega. Vai junto com o pagamento e é o que permite a
     * análise antifraude reconhecer o dispositivo — sem ele, o Mercado Pago
     * marca a integração como incompleta e a aprovação de cartão cai.
     */
    MP_DEVICE_SESSION_ID?: string;
  }
}

/** O que acontece depois do pagamento. Tudo aqui é o que o produto faz de fato. */
const O_QUE_VEM_DEPOIS = [
  {
    icone: Sparkles,
    titulo: "Os 5 módulos liberados",
    texto: "Financeiro, agenda, clientes, produtos e a Mimu, na hora.",
  },
  {
    icone: ShieldCheck,
    titulo: "Cancele quando quiser",
    texto: "Sem fidelidade e sem multa. É só parar de renovar.",
  },
  {
    icone: Download,
    titulo: "Seus dados são seus",
    texto: "Dá para exportar seu histórico a qualquer momento.",
  },
] as const;

export default function AssinarCartaoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const brickRef = useRef<HTMLDivElement>(null);
  const brickCriado = useRef(false);

  const [scriptPronto, setScriptPronto] = useState(false);
  const [brickPronto, setBrickPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!scriptPronto || brickCriado.current) return;
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

    if (!publicKey || !window.MercadoPago) {
      setErro("Não foi possível carregar o pagamento com cartão agora.");
      return;
    }

    brickCriado.current = true;
    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

    mp.bricks().create("cardPayment", BRICK_CONTAINER_ID, {
      initialization: { amount: VALOR_MENSAL_MIMU },
      customization: {
        visual: {
          style: {
            theme: "default",
            customVariables: {
              baseColor: "#CCFF00",
              // O texto do botão de pagar precisa ser escuro: o padrão do
              // Mercado Pago é branco, e branco sobre o néon da marca dá
              // 1.18:1 de contraste — o "Pagar" some do botão.
              baseColorSecondaryVariant: "#0A0A0A",
              buttonTextColor: "#0A0A0A",
              formBackgroundColor: "#FFFFFF",
              borderRadiusMedium: "12px",
            },
          },
        },
        paymentMethods: { maxInstallments: 1 },
      },
      callbacks: {
        onReady: () => setBrickPronto(true),
        onError: () => {
          setErro("Verifique os dados do cartão.");
        },
        onSubmit: async (formData) => {
          setErro(null);
          setProcessando(true);

          try {
            const resposta = await fetch("/api/pagamento/cartao", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              // O identificador do aparelho só existe aqui no navegador; o
              // servidor não tem como calculá-lo. Por isso ele viaja junto e
              // é repassado ao Mercado Pago na criação do pagamento.
              body: JSON.stringify({
                ...formData,
                device_id: window.MP_DEVICE_SESSION_ID ?? null,
              }),
            });
            const json = await resposta.json();

            if (!resposta.ok || json.status === "recusado") {
              setErro(
                json?.error ??
                  "Seu cartão não foi aprovado. Tente outro cartão ou pague com Pix.",
              );
              setProcessando(false);
              return;
            }

            showToast("Assinatura ativada! Bem-vinda de volta.", Check);
            router.push("/dashboard");
          } catch {
            setErro("Não foi possível processar o pagamento. Tente de novo.");
            setProcessando(false);
          }
        },
      },
    });
  }, [scriptPronto, router, showToast]);

  return (
    <div className="dark min-h-screen bg-fundo px-5 py-10">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onReady={() => setScriptPronto(true)}
      />
      {/*
        Script separado do SDK, e obrigatório: é ele que calcula o
        identificador do aparelho e o publica em window.MP_DEVICE_SESSION_ID.
        Sem ele, a análise antifraude do Mercado Pago não reconhece o
        dispositivo, a integração fica marcada como incompleta no painel e a
        aprovação de cartão cai.

        `view="checkout"` diz ao Mercado Pago em que etapa da compra estamos,
        que é o que ele usa para calibrar a análise.
      */}
      <Script
        src="https://www.mercadopago.com/v2/security.js"
        strategy="afterInteractive"
        {...{ view: "checkout" }}
      />

      <div className="mx-auto w-full max-w-[1060px]">
        <div className="flex justify-center lg:justify-start">
          <Logo size="md" />
        </div>

        {/*
          Duas colunas a partir de lg. Antes o formulário vivia num cartão de
          384px em qualquer tela: no celular está certo, no computador o
          Mercado Pago era obrigado a empilhar vencimento e código de segurança
          um embaixo do outro, e a tela virava uma coluna estreita e comprida
          no meio de um monitor vazio.

          A ordem se inverte entre os tamanhos: no celular o formulário vem
          primeiro, porque quem chegou aqui veio pagar e a mensagem é o que
          pode esperar; no computador a mensagem fica à esquerda, onde a
          leitura começa.
        */}
        <div className="mt-10 flex flex-col gap-10 lg:mt-14 lg:flex-row lg:items-start lg:gap-16">
          <aside className="order-2 w-full lg:order-1 lg:flex-1 lg:pt-2">
            <h1 className="text-balance font-display text-[30px] font-bold leading-[1.15] text-escuro lg:text-[38px]">
              A Mimu está pronta para estruturar o seu negócio.
            </h1>
            <p className="mt-4 text-balance text-[17px] leading-relaxed text-neutro-muted">
              Obrigado por nos escolher para fazer parte da sua trajetória.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              {O_QUE_VEM_DEPOIS.map((item) => (
                <li key={item.titulo} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                    <item.icone className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-escuro">
                      {item.titulo}
                    </span>
                    <span className="block text-sm text-neutro-muted">
                      {item.texto}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="order-1 w-full lg:order-2 lg:w-[480px] lg:flex-none">
            <div className="rounded-card border border-neutro-border bg-superficie p-6">
              <p className="text-center text-lg font-semibold text-escuro">
                Pagar com Cartão
              </p>
              <p className="mt-1 text-center text-sm text-neutro-muted">
                Parcelamento em 1x, sem juros.
              </p>

              {!brickPronto && !erro && (
                <p className="mt-6 text-center text-sm text-neutro-muted">
                  Carregando formulário seguro...
                </p>
              )}

              <div ref={brickRef} id={BRICK_CONTAINER_ID} className="mt-4" />

              {erro && (
                <p className="mt-4 rounded-button bg-erro-light px-3 py-2 text-center text-sm text-erro-texto">
                  {erro}
                </p>
              )}

              {processando && (
                <p className="mt-3 text-center text-sm text-neutro-muted">
                  Confirmando pagamento...
                </p>
              )}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-neutro-muted">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Pagamento seguro processado pelo Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
