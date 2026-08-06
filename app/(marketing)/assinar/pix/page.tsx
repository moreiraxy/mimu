"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck, XCircle } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center bg-[#FFF5F4] px-6 py-10">
      <Logo size="md" />

      <div className="mt-8 w-full max-w-sm rounded-card border border-neutro-border bg-superficie p-6 shadow-sm">
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
            <p className="text-sm text-erro">{erro}</p>
            <Button className="w-full" onClick={gerarPix}>
              Tentar de novo
            </Button>
          </div>
        )}

        {!carregando && recusado && (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-erro" strokeWidth={1.75} />
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

            <p className="text-sm font-semibold text-ambar-text">
              Expira em {formatarContagem(segundosRestantes)}
            </p>

            <button
              type="button"
              onClick={copiarCodigo}
              className="flex w-full items-center justify-center gap-2 rounded-button border-[1.5px] border-coral py-3 text-sm font-bold text-coral transition-colors hover:bg-coral-light"
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

      <p className="mt-6 flex items-center gap-1.5 text-xs text-neutro-muted">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Pagamento seguro processado pelo Mercado Pago
      </p>
    </div>
  );
}
