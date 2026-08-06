import { Logo } from "@/components/Logo";

export function FooterMarketing() {
  return (
    <footer className="border-t border-neutro-border px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center">
        <Logo size="sm" />
        <p className="text-xs text-neutro-muted">
          © 2026 Mimu. Feito com carinho para o negócio de bairro.
        </p>
      </div>
    </footer>
  );
}
