import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";
import { classesBotao } from "@/components/ui/Button";

export const metadata: Metadata = {
  // `absolute` porque o layout raiz aplica o template "%s · Mimu", e sem isto
  // esta tela vira "Mimu · Mimu". Ela é a abertura do aplicativo, onde a marca
  // aparece uma vez e por extenso.
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
 * Quem baixou o aplicativo já foi convencida — abrir num anúncio é pedir para
 * ela se convencer de novo, e é o tipo de coisa que a diretriz 4.2 da Apple lê
 * como "site embrulhado". Quem manda para cá é o middleware, pela marca no
 * User-Agent; ver lib/supabase/middleware.ts.
 *
 * Duas saídas e mais nada. Não há preço, depoimento nem seção de recursos:
 * a decisão de usar a Mimu já foi tomada antes do download, e a única pergunta
 * que sobra é se a pessoa já tem conta.
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
        className="relative flex flex-1 flex-col"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Logo size="md" />

          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[32px] font-bold leading-[1.1] text-escuro">
              Enquanto você trabalha,
              <br />a Mimu cuida do
              <br />
              seu negócio.
            </h1>
            <p className="text-[15px] leading-snug text-neutro-muted">
              Vendas, faturamento, agenda e clientes
              <br />
              em um só lugar.
            </p>
          </div>
        </div>

        {/*
         * "Entrar" é o principal, e não "Criar conta". Quem está com o
         * aplicativo instalado na maioria das vezes já tem conta — o cadastro
         * acontece uma vez, a entrada acontece sempre.
         */}
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Link
            href="/login"
            className={classesBotao({ className: "grid place-items-center" })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={classesBotao({
              variant: "secondary",
              className: "grid place-items-center",
            })}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
