import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/supabase";
import { modulosLiberados } from "@/lib/planos";
import type { ModuloAtivo } from "@/types";
import { ehAdmin } from "@/lib/admin";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { FundoAmbiente } from "@/components/dashboard/FundoAmbiente";
import { PushPermissionPrompt } from "@/components/PushPermissionPrompt";
import { TravaBiometrica } from "@/components/TravaBiometrica";
import { TelaAbertura } from "@/components/TelaAbertura";

// Layout raiz de toda página autenticada (Home, Agenda, Financeiro, Clientes,
// Mimu) — concentra aqui o gate de auth/onboarding para as páginas dentro do
// grupo não precisarem repetir essa checagem cada uma.
//
// Responsivo: mobile usa bottom nav + FAB (comportamento original, intocado
// abaixo de md). A partir de md entra a sidebar lateral (compacta, só ícone;
// larga com labels a partir de lg) e o bottom nav some. O FAB flutuante some
// a partir de lg, substituído pelas ações rápidas no topo do conteúdo.
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, empresa, plano } = await getEmpresaAtual();

  if (!user) {
    redirect("/login");
  }
  if (!empresa?.onboarding_concluido) {
    redirect("/onboarding");
  }

  // Só decide se MOSTRA o atalho do painel. A autorização de verdade continua
  // no servidor (app/admin/layout.tsx e cada rota /api/admin/*), então forçar
  // esse valor no navegador não abre nada — só faz aparecer um link que leva
  // a um 404.
  const admin = await ehAdmin(user.id);

  // Os módulos vão daqui para a navegação como valor inicial.
  //
  // Antes, a barra de baixo e a sidebar liam `empresa.modulos_ativos` do
  // AuthProvider, que busca a empresa DE NOVO no navegador. Na primeira
  // visita esse dado só chegava depois de uma ida ao servidor, então a
  // navegação nascia com a lista vazia e mostrava só Home e Empresa. Recarregar
  // "resolvia" porque a resposta já estava no cache — foi o "só funciona na
  // segunda vez".
  //
  // Aqui o servidor já tem a empresa em mãos: é só entregar.
  //
  // Passa pelo teto do plano antes de sair: `modulos_ativos` é o que a pessoa
  // ESCOLHEU, e o plano é o que ela pode usar. Entregar a lista crua faria a
  // navegação de uma conta gratuita nascer com agenda, estoque e a Mimu, que
  // some depois — e some justamente porque o AuthProvider aplica o teto na
  // hidratação. Os dois lados precisam calcular a mesma coisa.
  const modulos = modulosLiberados(
    plano,
    (empresa.modulos_ativos ?? []) as ModuloAtivo[],
  );

  return (
    /*
      Sem `bg-fundo` aqui, e isso é o que faz o FundoAmbiente aparecer.

      Um elemento com z-index negativo é pintado DEPOIS do fundo do contexto
      de empilhamento (a raiz) mas ANTES do fundo dos blocos descendentes —
      então uma cor de fundo nesta div cobriria as manchas de luz por
      completo, sem erro nenhum, só um fundo liso de novo.

      A cor não se perde: `body` já é `bg-fundo` em globals.css, e o fundo do
      body é propagado para a tela inteira, atrás de tudo — inclusive atrás
      dos z-index negativos.
    */
    /*
      `relative` é o que dá altura ao FundoAmbiente.

      Ele é `absolute inset-0`, e sem um ancestral posicionado o `inset-0`
      resolve contra o bloco inicial — do tamanho da JANELA, ancorado no topo do
      documento. A luz cobriria só a primeira dobra e o resto da página ficaria
      preto liso de novo, que é justamente o que tirava a transparência dos
      cartões de baixo. Com `relative` aqui, `inset-0` passa a valer a altura
      inteira do conteúdo.
    */
    <div className="relative min-h-screen">
      {/*
        O cadeado biométrico, pintado antes de tudo.

        Roda inline e ANTES do conteúdo no HTML, de propósito: qualquer coisa
        que espere o React chega depois de o painel já ter aparecido na tela, e
        um cadeado que mostra o conteúdo antes de trancar não é um cadeado.

        Mora AQUI e não no layout raiz porque só as telas do app são trancadas.
        No raiz ele pintaria também o /login — e ali não existe
        <TravaBiometrica> para tirar a tinta depois, então a pessoa que
        tentasse entrar com a senha encontraria uma tela preta permanente.

        Ele não valida nada: só marca o <html> para o CSS cobrir a tela. Quem
        pergunta pela digital e libera é components/TravaBiometrica.tsx.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var r = localStorage.getItem('mimu:biometria');
              if (r && JSON.parse(r).credencial) {
                document.documentElement.classList.add('trancado');
              }
            } catch (e) {}
            try {
              // O olho de esconder valores. Mesma razão do cadeado acima: se
              // isto esperasse o React, os números apareceriam antes de sumir.
              if (localStorage.getItem('mimu:valores-escondidos') === '1') {
                document.documentElement.dataset.valores = 'escondidos';
              }
            } catch (e) {}
          })();`,
        }}
      />

      <FundoAmbiente />

      {/*
        A BARRA FLUTUANTE VALE NO COMPUTADOR TAMBÉM, e a lateral acabou.

        Havia dois aplicativos aqui: no celular, a barra de vidro flutuando
        embaixo; no computador, uma lista preta comprida colada na esquerda,
        mais uma lupa e um botão "Nova ação" soltos no alto — que ainda por
        cima caíam em cima do selo Pro do cabeçalho.

        Agora é a mesma barra nos dois, com o mesmo material e os mesmos
        destinos. Não é só coerência visual: quem aprende a usar a Mimu no
        celular não precisa reaprender no computador, e cada coisa passa a
        existir num lugar só.

        A busca saiu inteira. Ela flutuava no canto de toda tela, atropelava o
        cabeçalho, e o que ela resolve — achar uma cliente, uma venda — já se
        resolve dentro de cada tela e conversando com a Mimu.
      */}
      {/* O conteúdo rola por cima do fundo fixo, em z-1 e sem fundo próprio.
          Qualquer cor de fundo aqui apagaria o wallpaper atrás dos cards. */}
      <div className="relative z-[1]">
        <div className="respiro-barra respiro-topo mx-auto max-w-[430px] px-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          {children}
          {/*
            O pedido de notificação vem DEPOIS do conteúdo.

            Ele ficava antes, e no celular isso o punha entre a borda de cima e
            a arte da home: empurrava o topo inteiro para baixo e ainda caía
            debaixo da lupa flutuante. Um aviso que aparece uma vez na vida não
            pode desmontar a primeira tela do app — aqui ele é encontrado
            rolando, sem atropelar nada.
          */}
          <PushPermissionPrompt />
        </div>
      </div>

      <BottomNav admin={admin} modulosIniciais={modulos} />

      {/* Os dois cobrem a tela inteira, barra inclusa, e nesta ordem: o
          cadeado (z-100) vem por cima da abertura (z-80), porque quem trancou
          o app não deve ver nem a marca carregando antes de se identificar. */}
      <TelaAbertura />
      <TravaBiometrica />
    </div>
  );
}
