import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";
import { classesBotao } from "@/components/ui/Button";

export const metadata: Metadata = {
  // `absolute` porque o layout raiz aplica o template "%s · Mimu", e sem isto
  // esta tela vira "Mimu · Mimu".
  title: { absolute: "Mimu" },
  // Esta tela só existe para quem abriu o aplicativo. Indexá-la colocaria no
  // buscador uma página sem conteúdo, competindo com a landing pela mesma
  // busca.
  robots: { index: false, follow: false },
};

/**
 * A primeira tela de quem abre o aplicativo sem estar logada.
 *
 * O app carrega mimu.pro numa WebView, e a raiz do site é a página de vendas.
 * Quem baixou o aplicativo já foi convencida — abrir num anúncio é pedir que
 * ela se convença de novo, e é o tipo de coisa que a diretriz 4.2 da Apple lê
 * como "site embrulhado". Quem manda para cá é o middleware, pela marca no
 * User-Agent; ver lib/supabase/middleware.ts.
 *
 * ELA NÃO VENDE NADA, e a primeira versão vendia: trazia a manchete de três
 * linhas da landing e o subtítulo com a lista de funcionalidades. Ficou uma
 * página de conversão dentro de um app que a pessoa já baixou — quem chega
 * aqui não está decidindo se quer a Mimu, está decidindo se já tem conta.
 *
 * O padrão que Spotify, KOHO, Raycast e Splitwise seguem no iOS é o oposto do
 * que um site faz: marca grande e sozinha, no máximo uma linha curta, e as
 * duas saídas em botões altos. O silêncio em volta da marca é o que dá o ar de
 * app; texto ali é ruído.
 *
 * `dark` pelo mesmo motivo das telas de login e de onboarding: quem chega aqui
 * ainda não escolheu tema, o padrão do app é o claro, e abrir branco no susto
 * depois do splash escuro é um piscar feio logo na primeira impressão.
 */
export default function ComecarPage() {
  return (
    <div className="dark relative flex min-h-screen flex-col bg-fundo px-6">
      <FundoAmbiente />

      {/*
       * A safe-area entra aqui e não numa classe utilitária porque esta tela
       * não vive dentro do grupo (dashboard), que é quem aplica `.respiro-topo`
       * uma vez para todas as suas telas.
       */}
      <div
        className="relative flex flex-1 animate-entrar-tela flex-col motion-reduce:animate-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        }}
      >
        {/*
         * A marca fica ACIMA do centro, não nele.
         *
         * Centrada exatamente, ela divide a tela em duas metades iguais e o
         * olho não sabe onde pousar. Um pouco acima cria a hierarquia que
         * KOHO e Raycast usam: marca, respiro, saída.
         */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-6">
          <LogoMark size="lg" />
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[34px] font-semibold leading-none tracking-[-0.6px] text-primary-forte">
              mimu
            </p>
            <p className="text-[13px] tracking-wide text-neutro-muted">
              seu negócio, organizado
            </p>
          </div>
        </div>

        {/*
         * Botões altos e em pílula, e longe do rodapé.
         *
         * 56px é a altura que as referências usam numa tela cuja única função é
         * escolher entre dois caminhos — o `size="md"` de 48px é para
         * formulário, onde o botão divide espaço com outros campos. Colados na
         * borda de baixo eles pareceriam barra de sistema; o respiro embaixo é
         * o que os deixa como parte da composição.
         *
         * "Entrar" é o principal, e não "Criar conta": quem está com o
         * aplicativo instalado na maioria das vezes já tem conta — o cadastro
         * acontece uma vez, a entrada acontece sempre.
         */}
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 pb-[10vh]">
          <Link
            href="/login"
            className={classesBotao({
              className: "grid h-14 place-items-center rounded-full text-base",
            })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={classesBotao({
              variant: "secondary",
              className: "grid h-14 place-items-center rounded-full text-base",
            })}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
