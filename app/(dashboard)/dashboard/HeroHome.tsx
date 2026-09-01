"use client";

import Link from "next/link";
import { Eye, EyeOff, Hand, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useValores } from "@/hooks/useValores";
import { ehPlanoGratuito } from "@/lib/planos";
import { saudacaoPorHorario, formatDataComDiaSemana } from "@/lib/formatters";

/**
 * O topo da home: a arte, a saudação por cima dela e os dois controles.
 *
 * A ARTE NÃO É ENFEITE. Ela é o que faz o vidro do resto da tela existir:
 * superfície translúcida sobre fundo liso é indistinguível de superfície
 * opaca — não há o que atravessar. É o mesmo motivo pelo qual a referência
 * tem uma ilustração de tela cheia atrás dos primeiros cartões.
 *
 * Sangra para fora do respiro da página (`-mx-4 -mt-4`) porque uma imagem com
 * margem branca em volta lê como figura colada na tela; encostando nas bordas,
 * ela vira o fundo. E se funde com o app por um degradê, em vez de terminar
 * numa linha reta — o corte seco denunciaria onde a imagem acaba.
 */
export function HeroHome({
  nome,
  primeiroNome,
  plano,
  atalhos,
}: {
  nome: string;
  primeiroNome: string;
  plano: string | null;
  atalhos: readonly {
    href: string;
    label: string;
    icone: LucideIcon;
  }[];
}) {
  const { escondidos, alternar } = useValores();
  const gratuito = ehPlanoGratuito(plano);

  return (
    /*
      O cabeçalho NÃO FURA MAIS O CONTAINER.

      Ele saía do respiro da página com margens negativas para a arte encostar
      nas bordas do aparelho. Só que a arte saiu daqui — quem ilumina agora é o
      FundoAmbiente, que já é fixo e cobre a tela inteira. Sobrou o
      arrombamento sem a razão dele, e com um efeito colateral que só aparece
      em tela larga: o conteúdo do cabeçalho ia para a borda da JANELA enquanto
      os cartões ficavam na coluna centralizada de 430px. Num celular os dois
      valores coincidem e o defeito fica invisível; num navegador de
      computador, o retrato e a saudação ficam dezenas de pixels à esquerda de
      tudo.

      Sem margem nenhuma, ele é um bloco normal e se alinha com os cartões em
      qualquer largura — que é o único jeito de isso não voltar.
    */
    <header className="relative mb-1 pb-8">
      {/*
        O CABEÇALHO NÃO TEM FUNDO NENHUM. Nem imagem, nem véu, nem degradê.

        Ainda restava aqui uma camada escura em degradê, para dar contraste ao
        texto branco. Ela era um RETÂNGULO: começava e terminava onde o
        cabeçalho começa e termina. No celular isso passava despercebido porque
        o cabeçalho ocupa a largura da tela; no computador, onde o conteúdo é
        uma coluna centralizada, ela desenhava três arestas retas — duas
        verticais e uma horizontal — atravessando a luz do fundo. É a mesma
        listra que já apareceu antes, pela mesma causa: dois fundos sempre se
        encontram, e todo encontro desenha uma borda.

        A regra que sobrou desta história: existe UM fundo no app, o
        FundoAmbiente, e ele é fixo e cobre a tela. Nenhum componente pinta
        atrás de si mesmo.

        O contraste do texto não depende mais dele: a luz é fraca o bastante
        para branco em corpo grande ficar legível por cima, e quem garante isso
        é a calibragem do FundoAmbiente, não uma camada aqui.
      */}

      {/*
        A folga para a lupa saiu junto com a lupa.

        Havia `pr-12` aqui reservando o canto direito para o botão de busca,
        que flutuava por cima de toda tela. A busca deixou de existir, e a
        reserva junto — senão sobraria um buraco de 48px empurrando o selo Pro
        para dentro sem motivo.
      */}
      {/*
        A FILEIRA DE CIMA É GRUDENTA — o vídeo da referência mostra isso e eu
        não tinha visto: o retrato com o nome e o selo Pro ficam parados no
        topo enquanto todo o resto passa por baixo.
        Não é enfeite. Numa lista longa de widgets, é o que mantém à mão as
        duas coisas que não pertencem a widget nenhum: quem você é (a conta) e
        o que você pode esconder da tela (o olho).
      */}
      <div className="sticky top-0 z-30 -mx-4 flex items-start justify-between gap-3 px-4 py-2">
        <Link
          href="/minha-empresa"
          aria-label="Sua conta"
          className="vidro-pilula flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5"
        >
          <Avatar nome={nome} size="sm" />
          {/* O nome ao lado do retrato, dentro de uma pílula de vidro — é o
              formato exato da referência quando a tela rola. */}
          <span className="max-w-[130px] truncate text-[15px] font-bold text-escuro">
            {primeiroNome}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alternar}
            aria-pressed={escondidos}
            aria-label={escondidos ? "Mostrar valores" : "Esconder valores"}
            className="vidro-pilula flex h-10 w-10 items-center justify-center rounded-full text-escuro"
          >
            {escondidos ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>

          {/*
            O selo do plano. Para quem paga ele é identidade; para quem não
            paga é um convite que fica quieto num canto, e não um bloqueio no
            meio do caminho — a mesma escolha do banner do perfil.
          */}
          <Link
            href={gratuito ? "/minha-empresa/assinatura" : "/minha-empresa/assinatura"}
            className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[13px] font-bold text-primary-text"
          >
            Mimu Pro
          </Link>
        </div>
      </div>

      {/*
        A fileira de chips sobre a arte — o lugar que na referência tem
        "Conexões / Cartão / Investimentos".

        Não são os mesmos destinos (não temos conta bancária), mas o papel é o
        mesmo: os atalhos mais usados, em pílula de vidro, flutuando sobre o
        fundo antes da saudação. É onde o dedo cai primeiro ao abrir o app.

        Rola na horizontal porque a lista cresce com os módulos da conta: uma
        conta com tudo ligado tem quatro, e quatro pílulas com rótulo não cabem
        em 390px. `scroll-fade-x` avisa que tem mais para o lado.
      */}
      {atalhos.length > 0 && (
        <div className="scroll-fade-x relative mt-7 -mr-4 flex gap-2 overflow-x-auto pb-1 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {atalhos.map((acao) => (
            <Link
              key={acao.href}
              href={acao.href}
              className="vidro-pilula flex flex-shrink-0 items-center gap-2 rounded-full py-2.5 pl-3.5 pr-4 text-[13px] font-semibold text-white"
            >
              <acao.icone className="h-4 w-4 text-primary" strokeWidth={2.5} />
              {acao.label}
            </Link>
          ))}
        </div>
      )}

      <div className="relative mt-7">
        <h1 className="flex flex-wrap items-center gap-x-3 text-[38px] font-semibold leading-[1.05] tracking-tight text-white">
          <span className="w-full">{saudacaoPorHorario()},</span>
          <span>{primeiroNome}</span>
          {/* A mãozinha acenando ao lado do nome. */}
          <Hand
            className="h-7 w-7 flex-shrink-0 text-primary"
            strokeWidth={2.25}
          />
        </h1>
        <p className="mt-1.5 text-[13px] text-white/60">
          {formatDataComDiaSemana()}
        </p>
      </div>
    </header>
  );
}
