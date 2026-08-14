"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, ShieldCheck } from "lucide-react";
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
  }
}

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
              body: JSON.stringify(formData),
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
    <div className="dark flex min-h-screen flex-col items-center bg-fundo px-5 py-10">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onReady={() => setScriptPronto(true)}
      />

      <Logo size="md" />

      <div className="mt-8 w-full max-w-sm rounded-card border border-neutro-border bg-superficie p-6 shadow-sm">
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

      <p className="mt-6 flex items-center gap-1.5 text-xs text-neutro-muted">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Pagamento seguro processado pelo Mercado Pago
      </p>
    </div>
  );
}
