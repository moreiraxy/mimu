import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";

export const metadata: Metadata = {
  title: { absolute: "E-mail confirmado · Mimu" },
  robots: { index: false, follow: false },
};

/**
 * Para quem se cadastrou NO APLICATIVO e confirmou o e-mail NO NAVEGADOR.
 *
 * O link do e-mail é um https comum: sem Universal Links, o iOS o entrega ao
 * navegador padrão, não ao aplicativo. E a WKWebView do Capacitor tem
 * armazenamento de cookies SEPARADO do Safari — a sessão nasce no navegador, e
 * o aplicativo continua deslogado. Quem voltava para ele encontrava a tela de
 * começar de novo, sem entender o que tinha dado errado no cadastro.
 *
 * Esta tela não conserta isso: ela conta o que aconteceu. O conserto é o
 * Universal Link (app/.well-known/apple-app-site-association), que faz o toque
 * no e-mail abrir o aplicativo — mas ele exige uma versão nova na loja, e
 * quem está travado agora está travado agora.
 *
 * Por isso a instrução é entrar de novo, e não "volte para o aplicativo": a
 * senha a pessoa acabou de escolher, e a conta já está confirmada. São dois
 * toques, contra um cadastro que parecia perdido.
 */
export default function EmailConfirmadoPage() {
  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <FundoAmbiente />

      <div className="relative flex flex-col items-center gap-6">
        <LogoMark size="lg" />

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[28px] font-bold leading-tight text-escuro">
            E-mail confirmado.
          </h1>
          <p className="max-w-xs text-[15px] leading-snug text-neutro-muted">
            Sua conta está pronta. Abra a Mimu no seu iPhone e entre com o
            e-mail e a senha que você acabou de criar.
          </p>
        </div>
      </div>
    </div>
  );
}
