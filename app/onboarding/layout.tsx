import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";
import { Logo } from "@/components/Logo";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, empresa } = await getEmpresaAtual();

  if (!user) {
    redirect("/login");
  }
  if (empresa?.onboarding_concluido) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-fundo px-6 py-10">
      <Logo size="sm" className="mb-8" />
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
