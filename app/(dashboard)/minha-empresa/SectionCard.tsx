import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SectionCard({
  icone: Icone,
  titulo,
  descricao,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-neutro-border bg-superficie p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
          <Icone className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="font-semibold text-escuro">{titulo}</h2>
          {descricao && (
            <p className="mt-0.5 text-xs text-neutro-muted">{descricao}</p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
