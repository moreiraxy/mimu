"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";

const POLL_MS = 5000;

interface DadosPix {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiraEm: string;
}

function formatarContagem(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

/** Igual à tela de cartão: o que acontece depois que o pagamento cair. */
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

export default function AssinarPixPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [dados, setDados] = useState<DadosPix | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [expirado, setExpirado] = useState(false);
  const [recusado, setRecusado] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gerarPix = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setExpirado(false);
    setRecusado(false);

    try {
      const resposta = await fetch("/api/pagamento/pix", { method: "POST" });
      const json = await resposta.json();

      if (!resposta.ok) {
        throw new Error(json?.error ?? "Não foi possível gerar o Pix.");
      }

      setDados(json);
      const restante = Math.max(
        0,
        Math.round((new Date(json.expiraEm).getTime() - Date.now()) / 1000),
      );
      setSegundosRestantes(restante);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível gerar o Pix.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    gerarPix();
  }, [gerarPix]);

  // Contagem regressiva de 30min.
  useEffect(() => {
    if (!dados || expirado) return;
    if (segundosRestantes <= 0) {
      setExpirado(true);
      return;
    }
    const id = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [dados, segundosRestantes, expirado]);

  // Polling do status a cada 5s.
  useEffect(() => {
    if (!dados || expirado || recusado) return;

    async function verificar() {
      if (!dados) return;
      try {
        const resposta = await fetch(`/api/pagamento/status/${dados.paymentId}`);
        const json = await resposta.json();
        if (!resposta.ok) return;

        if (json.status === "aprovado") {
          if (pollRef.current) clearInterval(pollRef.current);
          showToast("Assinatura ativada! Bem-vinda de volta.", Check);
          router.push("/dashboard");
        } else if (json.status === "recusado") {
          if (pollRef.current) clearInterval(pollRef.current);
          setRecusado(true);
        }
      } catch {
        // Falha de rede momentânea não deve parar o polling.
      }
    }

    pollRef.current = setInterval(verificar, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dados, expirado, recusado, router, showToast]);

  async function copiarCodigo() {
    if (!dados) return;
    await navigator.clipboard.writeText(dados.qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="dark min-h-screen bg-fundo px-5 py-10">
      <div className="mx-auto w-full max-w-[1060px]">
        <div className="flex justify-center lg:justify-start">
          <Logo size="md" />
        </div>

        {/* Mesmo desenho da tela de cartão: no computador a mensagem à
            esquerda e o pagamento à direita; no celular o pagamento primeiro,
            porque é o que a pessoa veio fazer. */}
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
      <div className="w-full rounded-card border border-neutro-border bg-superficie p-6">
        <p className="text-center text-lg font-semibold text-escuro">
          Pagar com Pix
        </p>
        <p className="mt-1 text-center text-sm text-neutro-muted">
          Escaneie o QR Code ou copie o código no seu app do banco.
        </p>

        {carregando && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <Skeleton className="h-56 w-56 rounded-card" />
            <Skeleton className="h-10 w-full rounded-button" />
          </div>
        )}

        {!carregando && erro && !dados && (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-erro-texto">{erro}</p>
            <Button className="w-full" onClick={gerarPix}>
              Tentar de novo
            </Button>
          </div>
        )}

        {!carregando && recusado && (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-erro-texto" strokeWidth={1.75} />
            <p className="text-sm text-escuro">
              Esse Pix não foi aprovado. Tente gerar um novo código.
            </p>
            <Button className="w-full" onClick={gerarPix}>
              Gerar novo Pix
            </Button>
          </div>
        )}

        {!carregando && expirado && !recusado && (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-escuro">
              O tempo para pagar esse Pix acabou.
            </p>
            <Button className="w-full" onClick={gerarPix}>
              Gerar novo Pix
            </Button>
          </div>
        )}

        {!carregando && dados && !expirado && !recusado && (
          <div className="mt-6 flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI dinâmico, next/image não otimiza base64 */}
            <img
              src={`data:image/png;base64,${dados.qrCodeBase64}`}
              alt="QR Code do Pix"
              className="h-56 w-56 rounded-card border border-neutro-border"
            />

            <p className="text-sm font-semibold text-ambar-texto">
              Expira em {formatarContagem(segundosRestantes)}
            </p>

            <button
              type="button"
              onClick={copiarCodigo}
              className="flex w-full items-center justify-center gap-2 rounded-button border-[1.5px] border-primary-forte py-3 text-sm font-bold text-primary-forte transition-colors hover:bg-primary-light"
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.25} />
                  Código copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" strokeWidth={2.25} />
                  Copiar código
                </>
              )}
            </button>

            <p className="text-center text-xs text-neutro-muted">
              Assim que o pagamento for confirmado, você é levada direto pro
              painel.
            </p>
          </div>
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
