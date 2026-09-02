import { Logo } from "@/components/Logo";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * `dark` aqui é de propósito. Estas telas vêm logo depois da landing page,
   * que é escura, e quem chega nelas ainda não tem conta — logo não tem tema
   * escolhido, e o padrão do app é o claro. Sem isso, tocar em "Começar
   * grátis" numa página preta abria uma tela branca no susto.
   *
   * O MESMO PAPEL DE PAREDE DO APP, e não um fundo chapado. A tela de entrada
   * era a única do produto sem a luz de fundo, e o cartão dela era o único
   * opaco: quem se cadastrava conhecia um app, entrava, e encontrava outro. A
   * primeira tela é onde a promessa visual é feita — quebrá-la ali é quebrá-la
   * no pior lugar possível.
   */
  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center gap-8 bg-fundo px-6 py-12">
      <FundoAmbiente />

      <div className="relative z-[1] flex w-full max-w-sm flex-col items-center gap-8">
        <Logo size="md" />
        <div className="vidro-card w-full rounded-[24px] p-6">{children}</div>
      </div>
    </div>
  );
}
