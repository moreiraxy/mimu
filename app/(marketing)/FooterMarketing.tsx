import Link from "next/link";
import { linkWhatsApp } from "@/lib/contato";
import { LogoMark } from "@/components/Logo";

const COLUNAS = [
  [
    { label: "Produto", href: "#produto" },
    { label: "Preço", href: "#preco" },
  ],
  [
    // WhatsApp e não e-mail: `@mimu.app` é domínio de outra empresa, então
    // toda mensagem enviada por ali se perdia.
    { label: "Ajuda", href: linkWhatsApp("Oi! Preciso de ajuda com a Mimu.") },
    { label: "Contato", href: linkWhatsApp("Oi! Queria falar sobre a Mimu.") },
  ],
  [
    { label: "Privacidade", href: "#" },
    { label: "Termos", href: "#" },
  ],
] as const;

export function FooterMarketing() {
  return (
    <footer className="border-t border-neutro-border bg-superficie px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex items-start gap-2.5">
          <LogoMark size="sm" className="h-8 w-8 rounded-[8px]" />
          <div>
            <p className="text-base font-extrabold text-primary-forte">mimu</p>
            <p className="mt-0.5 max-w-[220px] text-xs text-neutro-muted">
              Enquanto você trabalha, a Mimu cuida do seu negócio.
            </p>
            <p className="mt-0.5 max-w-[220px] text-[11px] text-neutro-disabled-text">
              A Mimu substitui o caderno, a planilha e a memória.
            </p>
          </div>
        </div>

        <div className="flex gap-10">
          {COLUNAS.map((coluna, indice) => (
            <div key={indice} className="flex flex-col gap-2.5">
              {coluna.map((link) => (
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

      <p className="mx-auto mt-10 max-w-[1200px] border-t border-neutro-border pt-6 text-center text-xs text-neutro-disabled-text sm:text-left">
        © 2026 Mimu
      </p>
    </footer>
  );
}
