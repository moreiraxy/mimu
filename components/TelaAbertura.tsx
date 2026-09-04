"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/Logo";
import { esconderSplashNativa } from "@/lib/nativo";

/**
 * Já abrimos o app nesta sessão?
 *
 * Mora fora do componente de propósito: o módulo continua vivo entre as
 * navegações, e é isso que distingue as duas situações —
 *
 *   abrir o app  → a pessoa ainda não viu nada, e o que ela deve ver é a
 *                  marca. É o momento em que o app se apresenta.
 *   trocar de tela → ela já está dentro, sabe onde está, e o que ajuda é o
 *                  contorno do conteúdo que vem vindo. Uma tela de marca aqui
 *                  pareceria que o app reiniciou sozinho.
 */
let jaAbriu = false;

/*
 * Quantas telas ainda estão buscando dados.
 *
 * É um CONTADOR e não um booleano porque mais de uma coisa carrega ao mesmo
 * tempo — o painel busca faturamento enquanto o cabeçalho busca a cota. Com
 * um booleano, a primeira que terminasse apagaria a espera das outras.
 */
const ouvintes = new Set<() => void>();
let pendentes = 0;

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

/**
 * Diz à tela de abertura que ESTA tela ainda está carregando.
 *
 * A marca só sai quando o último `carregando` vira false. É o que a
 * referência faz: a logo fica, e a tela aparece pronta — sem o intervalo de
 * esqueleto cinza no meio, que é a parte que denuncia que ainda falta coisa
 * chegando.
 *
 * Chamar isto é opcional: uma tela que não chame simplesmente não segura a
 * abertura, e o comportamento é o de antes.
 */
export function useSeguraAbertura(carregando: boolean) {
  useEffect(() => {
    if (!carregando) return;
    pendentes += 1;
    avisar();
    return () => {
      pendentes -= 1;
      avisar();
    };
  }, [carregando]);
}

/**
 * A marca ocupando a tela enquanto o app abre.
 *
 * ONDE ISTO MORA É A DECISÃO INTEIRA, e eu errei duas vezes.
 *
 * A primeira versão vivia em `(dashboard)/loading.tsx`, o fallback de Suspense
 * do Next — que só existe enquanto o SERVIDOR monta a página e some assim que
 * o HTML chega. Numa conexão normal isso dura um piscar.
 *
 * A segunda ficou presa só ao `loading` do AuthProvider: a marca saía quando a
 * SESSÃO chegava, e aí cada tela mostrava o próprio esqueleto cinza enquanto
 * buscava os dados dela. Do lado de fora não há diferença entre "ainda não sei
 * quem você é" e "ainda não tenho seus números" — nos dois casos a tela não
 * está pronta, e o pedido era que a marca ficasse até estar.
 *
 * Agora ela espera as duas coisas: a sessão E o que as telas registrarem por
 * `useSeguraAbertura`.
 */
export function TelaAbertura() {
  const { loading } = useAuth();

  /*
   * No servidor a resposta é sempre "é a abertura".
   *
   * `jaAbriu` é estado de MÓDULO, e no servidor o módulo é compartilhado entre
   * requisições de pessoas diferentes — deixar o valor do servidor decidir
   * faria a segunda visitante do dia não ver a marca só porque a primeira já
   * tinha passado por ali.
   */
  const [primeira] = useState(() =>
    typeof window === "undefined" ? true : !jaAbriu,
  );

  const [aguardandoTelas, setAguardandoTelas] = useState(false);

  useEffect(() => {
    const ouvinte = () => setAguardandoTelas(pendentes > 0);
    ouvintes.add(ouvinte);
    ouvinte();
    return () => {
      ouvintes.delete(ouvinte);
    };
  }, []);

  const abrindo = loading || aguardandoTelas;

  // Marca a abertura como concluída só quando ela de fato terminou. Marcar na
  // montagem faria uma recarga rápida contar como "já abriu" antes de a marca
  // ter aparecido.
  useEffect(() => {
    if (!abrindo) jaAbriu = true;
  }, [abrindo]);

  /*
   * A troca de bastão com a tela de abertura do sistema.
   *
   * Enquanto a WebView carrega, quem está na tela é a splash NATIVA; quem
   * assume depois é este componente. Esconder a nativa cedo demais mostraria o
   * fundo vazio no meio, e tarde demais deixaria a marca do sistema por cima
   * do app já pronto.
   *
   * O momento certo é este: assim que a abertura termina. As duas usam o mesmo
   * `#0A0A0A`, então a troca não pisca.
   */
  useEffect(() => {
    if (abrindo) return;
    void esconderSplashNativa();
  }, [abrindo]);

  if (!primeira || !abrindo) return null;

  return (
    <div
      // Cobre a tela inteira, barra de baixo incluída: o pedido é ver só a
      // marca, e uma barra de navegação flutuando sobre a tela de abertura
      // seria justamente a metade de interface que não deveria estar ali
      // ainda. Abaixo do cadeado biométrico (z-100), que vem antes de tudo.
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-fundo"
      role="status"
      aria-label="Abrindo a Mimu"
    >
      {/*
       * Dois tempos: a marca assenta com mola e o nome sobe.
       *
       * O TERCEIRO TEMPO — o traço se desenhando — foi tirado, e não por
       * gosto. A splash NATIVA já mostra a marca inteira (ver
       * scripts/gerar-assets-nativos.mjs), então redesenhá-la aqui a faria
       * sumir e voltar no meio da abertura. Ou a marca nasce na web e a nativa
       * é um retângulo vazio, ou ela vem pronta da nativa e aqui só assenta.
       * A primeira opção deixava quem abre o app deslogado — que não vê esta
       * tela, porque ela só é montada em (dashboard)/layout.tsx — encarando
       * três segundos de preto.
       *
       * O `animate-respirar` de antes saiu daqui: ele pulsava para sempre, e
       * pulsar sem parar é o que uma tela diz quando não sabe se vai
       * conseguir. Uma abertura que assenta diz o contrário.
       *
       * A escala mora numa div POR FORA da marca. Pôr `transform` no mesmo
       * elemento que anima o traço faria o Safari recalcular o path a cada
       * quadro do salto.
       */}
      <div className="animate-assentar-marca motion-reduce:animate-none">
        <LogoMark size="lg" />
      </div>
      <p className="animate-subir-nome text-3xl font-semibold leading-none tracking-[-0.5px] text-primary-forte motion-reduce:animate-none">
        mimu
      </p>
    </div>
  );
}
