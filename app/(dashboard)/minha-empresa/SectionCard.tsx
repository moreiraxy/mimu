import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * O cartão de uma seção de ajustes.
 *
 * REESCRITO para falar a mesma língua do perfil. Antes ele tinha um ícone néon
 * dentro de um círculo, um título em corpo grande e uma borda opaca — e como as
 * seções por dentro já desenham as próprias caixas, o resultado era cartão
 * dentro de cartão, com dois níveis de borda competindo. Era o que fazia as
 * telas de configuração parecerem de outro aplicativo.
 *
 * Agora é o mesmo vidro, o mesmo raio e o mesmo respiro das opções do perfil.
 * O ícone continua existindo porque ajuda a varrer a página, mas em traço fino
 * e na cor apagada do texto secundário: dentro de uma tela que já se chama
 * "Preferências", um círculo néon não acrescenta informação — só peso.
 */
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
    <section className="vidro-card rounded-[18px] p-4">
      <div className="flex items-start gap-2.5">
        <Icone
          className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
          strokeWidth={2}
        />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-escuro">{titulo}</h2>
          {descricao && (
            <p className="mt-0.5 text-[13px] leading-snug text-neutro-muted">
              {descricao}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
