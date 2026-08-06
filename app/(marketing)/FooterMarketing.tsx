import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { label: "Produto", href: "#produto" },
      { label: "Preço", href: "#preco" },
    ],
  },
  {
    titulo: "Suporte",
    links: [
      { label: "Ajuda", href: "mailto:oi@mimu.app" },
      { label: "Contato", href: "mailto:oi@mimu.app" },
    ],
  },
] as const;

export function FooterMarketing() {
  return (
    <footer className="border-t border-neutro-border bg-superficie px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex items-start gap-2.5">
          <LogoMark size="sm" className="h-8 w-8 rounded-[8px]" />
          <div>
            <p className="text-base font-extrabold text-coral">mimu</p>
            <p className="mt-0.5 max-w-[220px] text-xs text-neutro-muted">
              Enquanto você trabalha, a Mimu cuida do seu negócio.
            </p>
          </div>
        </div>

        <div className="flex gap-10">
          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo} className="flex flex-col gap-2.5">
              <p className="text-xs font-bold text-neutro-muted">{coluna.titulo}</p>
              {coluna.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-medium text-neutro-muted-strong hover:text-escuro"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-5xl border-t border-neutro-border pt-6 text-center text-xs text-neutro-disabled-text sm:text-left">
        © 2026 Mimu. Feito com carinho para o negócio de bairro.
      </p>
    </footer>
  );
}
