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

  // `dark` aqui é de propósito. Estas telas vêm logo depois da landing page,
  // que é escura, e quem chega nelas ainda não tem conta — logo não tem tema
  // escolhido, e o padrão do app é o claro. Sem isso, clicar em "Começar
  // grátis" numa página preta abria uma tela branca no susto.
  //
  // Forçando a classe, todos os tokens de cor já existentes (bg-fundo,
  // bg-superficie, text-escuro...) resolvem para os valores escuros, sem
  // precisar reescrever cor nenhuma aqui dentro.
  return (
    <div className="dark flex min-h-screen flex-col items-center bg-fundo px-6 py-10">
      <Logo size="sm" className="mb-8" />
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
