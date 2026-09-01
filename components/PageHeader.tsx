"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * O cabeçalho de toda tela interna do app.
 *
 * Era uma seta pelada com o título miúdo centralizado — o formato que as
 * telas de configuração tinham antes e que a gente já corrigiu lá. Agora é o
 * MESMO cabeçalho do perfil e dos ajustes: botão de voltar em vidro no canto e
 * o título em corpo grande, alinhado à esquerda.
 *
 * Mudar aqui, e não em cada tela, é o que faz agenda, clientes, produtos,
 * estoque, faturamento e todas as outras passarem a falar a mesma língua de
 * uma vez — e o que impede que a próxima tela nasça diferente.
 *
 * Título grande à esquerda em vez de miúdo no centro não é gosto: é a
 * diferença entre a tela dizer onde você está e a tela sussurrar isso.
 */
export function PageHeader({
  title,
  onBack,
  action,
  voltar = true,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  /**
   * As telas de ABA (agenda, clientes, financeiro) não têm de onde voltar —
   * elas são o primeiro nível. Ali o cabeçalho é só o título.
   *
   * Sem isso elas não tinham cabeçalho NENHUM: a lista de clientes abria com
   * um vazio no meio da tela e nada dizendo onde a pessoa estava.
   */
  voltar?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="mb-6">
      {(voltar || action) && (
        <div className="flex items-center justify-between gap-3">
          {voltar ? (
            <button
              type="button"
              onClick={onBack ?? (() => router.back())}
              aria-label="Voltar"
              className="vidro flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-escuro"
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}

      <h1 className="mt-6 text-[28px] first:mt-0 font-semibold leading-tight tracking-tight text-escuro">
        {title}
      </h1>
    </header>
  );
}
