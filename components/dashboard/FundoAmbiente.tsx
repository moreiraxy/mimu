/**
 * O fundo do app: IMÓVEL, ocupando a tela inteira, atrás de tudo.
 *
 * ESTE É O MECANISMO DA TRANSPARÊNCIA, e vale escrever por extenso porque eu
 * já errei nas duas direções.
 *
 * O fundo fica parado e os widgets sobem por cima dele. É o movimento RELATIVO
 * entre os dois que revela o vidro: enquanto a pessoa rola, cada cartão
 * atravessa uma região diferente da luz, e a cor por trás dele muda ao vivo.
 * É esse deslizar de cor sob a superfície que faz o olho entender que ali tem
 * material translúcido.
 *
 * Um fundo que rola JUNTO com o conteúdo produz o contrário: cada cartão vê
 * sempre exatamente a mesma coisa atrás de si, nada muda, e a transparência
 * some — vira um cartão pintado com a cor do que estava atrás.
 *
 * A CAMADA: ele é `fixed inset-0` em `z-0`, e o conteúdo do app rola por cima
 * em `z-1` com fundo transparente. É essa separação que faz o fundo aparecer
 * ATRAVÉS dos cards conforme eles sobem — se o conteúdo tivesse fundo próprio,
 * ou se o fundo rolasse junto, o efeito morreria.
 *
 * `fixed` também resolve dois problemas de uma vez: a luz cobre a tela inteira
 * em qualquer posição de rolagem (então não existe "abaixo da primeira dobra
 * ficou preto liso") e não há emenda nenhuma entre o topo e o resto, porque
 * não há dois fundos — há um só.
 *
 * VALE NO COMPUTADOR TAMBÉM. Ele era `md:hidden`, com a justificativa de que
 * numa tela larga as manchas ficariam esticadas atrás de uma tabela — e o
 * resultado foi um app com duas personalidades: néon no celular, preto liso no
 * computador, com os mesmos cartões de vidro flutuando sobre nada.
 *
 * O que estava errado não era a luz na tela larga: era o TAMANHO dela. Manchas
 * medidas em pixels ficam pequenas e perdidas num monitor. Aqui elas passam a
 * ser medidas em porcentagem da janela a partir de `md`, então acompanham
 * qualquer largura sem esticar e sem sumir.
 */
export function FundoAmbiente() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/*
        AQUI ENTRA A ILUSTRAÇÃO, quando ela existir:

          <div
            className="absolute inset-x-0 top-0 h-[62%] bg-cover bg-top"
            style={{ backgroundImage: "url(/img/hero-home.webp)" }}
          />
          <div className="absolute inset-x-0 top-[42%] h-[24%] bg-gradient-to-b from-transparent to-[#0A0A0A]" />

        Ela mora AQUI e não dentro do cabeçalho, e essa é a diferença que
        elimina a linha reta: no cabeçalho, a arte terminava onde o elemento
        terminava, e o encontro com o fundo da página desenhava um corte reto
        atravessando a tela. No fundo fixo não existe encontro — existe um
        degradê que dissolve a imagem na cor do app, e ele é a única borda.

        Está comentada, e não apontando para um arquivo ausente, porque um
        background inexistente é pedido em TODA visita e leva 404: uma ida à
        rede por carregamento para não pintar nada.
      */}

      {/*
        As luzes cobrem a tela inteira, de borda a borda.

        Elas transbordam para fora dos quatro lados de propósito: uma mancha
        que termina dentro da tela deixa um anel escuro em volta, e é o que
        produzia as "brechas" nas laterais. Começando fora, o que se vê é
        sempre o miolo da luz.

        A DOSE tem que deixar preto entre uma mancha e outra. Luz forte demais
        cobrindo tudo por igual não é transparência — é a tela ficar verde, e
        rolar deixa de revelar coisa nenhuma porque não há nada de diferente
        para revelar. O contraste entre claro e escuro é que faz o cartão mudar
        de cor conforme sobe.
      */}
      {/*
        A luz é CONCENTRADA NO ALTO, e não espalhada por igual.

        É o que a referência faz: a ilustração ocupa mais ou menos os 45% de
        cima da tela e o resto é preto. Como o fundo é fixo, essa faixa clara
        vira uma zona por onde os cartões PASSAM ao subir — eles acendem ao
        entrar nela e escurecem ao sair. Luz uniforme dos dois lados não produz
        travessia nenhuma: tudo fica igual o tempo todo, e rolar não revela
        nada.

        Lá embaixo fica só um resto de brilho, para o vidro da barra e da
        pílula da Mimu não ficarem sobre preto absoluto.
      */}
      <span className="absolute -right-24 -top-28 h-[380px] w-[380px] rounded-full bg-primary/24 blur-[100px] dark:bg-primary/[0.17] md:-right-[10vw] md:-top-[18vh] md:h-[55vw] md:w-[55vw] md:blur-[160px]" />
      <span className="absolute -left-28 -top-10 h-[320px] w-[320px] rounded-full bg-verde/20 blur-[100px] dark:bg-verde/[0.13] md:-left-[12vw] md:-top-[8vh] md:h-[45vw] md:w-[45vw] md:blur-[160px]" />
      <span className="absolute -right-16 top-[26%] h-[300px] w-[300px] rounded-full bg-primary/16 blur-[100px] dark:bg-primary/[0.10] md:-right-[8vw] md:top-[30%] md:h-[40vw] md:w-[40vw] md:blur-[160px]" />
      <span className="absolute -bottom-24 -left-16 h-[300px] w-[300px] rounded-full bg-verde/12 blur-[110px] dark:bg-verde/[0.07] md:-bottom-[12vh] md:-left-[6vw] md:h-[42vw] md:w-[42vw] md:blur-[170px]" />
    </div>
  );
}
