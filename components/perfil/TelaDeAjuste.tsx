"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O molde de TODA tela de ajuste.
 *
 * Existe porque as telas de dentro das configurações tinham desenho próprio —
 * seta pelada, título miúdo centralizado, e o conteúdo embrulhado num cartão
 * que continha outros cartões. Do perfil para dentro, o app trocava de
 * linguagem.
 *
 * O cabeçalho é o mesmo do perfil: botão de voltar em vidro no canto e o
 * título em corpo grande, alinhado à esquerda. Título grande à esquerda em vez
 * de miúdo no centro não é gosto — é a diferença entre a tela dizer "você está
 * em Preferências" e a tela sussurrar isso.
 */
export function TelaDeAjuste({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Voltar"
        className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
      >
        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-tight text-escuro">
        {titulo}
      </h1>

      <div className="mt-6 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

/**
 * O título de um bloco de ajustes — "Alertas da Mimu", "Segurança".
 *
 * Fica FORA dos cartões, pequeno e apagado, exatamente como no perfil. É o que
 * agrupa sem embrulhar: agrupar com uma caixa em volta produz cartão dentro de
 * cartão, que foi o problema destas telas.
 */
export function TituloDeBloco({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pb-0.5 pt-4 text-[13px] font-semibold text-neutro-muted">
      {children}
    </h2>
  );
}

/**
 * Um ajuste: o cartão de vidro que embrulha UMA decisão.
 *
 * Mesma caixa das opções do perfil — mesmo vidro, mesmo raio, mesmo respiro.
 * `controle` é o que fica à direita (um interruptor, um seletor); quando o
 * ajuste é maior que isso, o conteúdo desce para baixo em `children`.
 */
export function CartaoAjuste({
  titulo,
  descricao,
  controle,
  children,
  className,
}: {
  titulo?: string;
  descricao?: string;
  controle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("vidro-card rounded-[18px] p-4", className)}>
      {(titulo || controle) && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {titulo && (
              <p className="text-[15px] font-semibold text-escuro">{titulo}</p>
            )}
            {descricao && (
              <p className="mt-0.5 text-[13px] leading-snug text-neutro-muted">
                {descricao}
              </p>
            )}
          </div>
          {controle && <div className="flex-shrink-0 pt-0.5">{controle}</div>}
        </div>
      )}
      {children && <div className={cn(titulo && "mt-4")}>{children}</div>}
    </section>
  );
}
