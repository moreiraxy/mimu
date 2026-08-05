import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-fundo px-6 py-12">
      <Logo size="md" />
      <div className="w-full max-w-sm rounded-card border border-neutro-border bg-white p-8">
        {children}
      </div>
    </div>
  );
}
