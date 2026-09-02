import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";
import { Logo } from "@/components/Logo";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";

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
  /*
   * O MESMO papel de parede e o MESMO vidro do app, como a tela de entrada.
   *
   * Estas três telas são as primeiras que a pessoa vê depois de criar a conta
   * — e eram as únicas do produto sem a luz de fundo, com o conteúdo solto
   * sobre preto liso. Quem acabava o cadastro atravessava três telas de um app
   * e caía num outro. A primeira impressão do produto se forma aqui, não no
   * painel.
   */
  return (
    <div className="dark relative flex min-h-screen flex-col items-center bg-fundo px-5 py-10">
      <FundoAmbiente />

      <div className="relative z-[1] flex w-full max-w-lg flex-col items-center">
        <Logo size="sm" className="mb-8" />
        <div className="vidro-card w-full rounded-[24px] p-6">{children}</div>
      </div>
    </div>
  );
}
