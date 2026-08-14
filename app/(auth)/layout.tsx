import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `dark` aqui é de propósito. Estas telas vêm logo depois da landing page,
  // que é escura, e quem chega nelas ainda não tem conta — logo não tem tema
  // escolhido, e o padrão do app é o claro. Sem isso, clicar em "Começar
  // grátis" numa página preta abria uma tela branca no susto.
  //
  // Forçando a classe, todos os tokens de cor já existentes (bg-fundo,
  // bg-superficie, text-escuro...) resolvem para os valores escuros, sem
  // precisar reescrever cor nenhuma aqui dentro.
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center gap-8 bg-fundo px-6 py-12">
      <Logo size="md" />
      <div className="w-full max-w-sm rounded-card border border-neutro-border bg-superficie p-8">
        {children}
      </div>
    </div>
  );
}
