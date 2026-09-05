import { ehAppIOSNoNavegador } from "@/lib/plataforma";

/**
 * O que só existe quando a Mimu roda dentro do aplicativo.
 *
 * A página é a mesma no navegador e dentro do app — o que muda é que ali
 * existe uma camada nativa por baixo. Este arquivo é a porta para ela, e
 * segue a mesma forma de `lib/iap.ts`: contrato tipado, import dinâmico, e
 * silêncio quando o plugin não está lá.
 *
 * O IMPORT É DINÂMICO, E ISSO NÃO É DETALHE. `@capacitor/haptics` e companhia
 * não têm nada a fazer no bundle de quem abre a Mimu pelo navegador, que é a
 * maioria — e este app já paga caro por JavaScript que chega antes da primeira
 * pintura. O `ehAppIOSNoNavegador()` na frente de cada função é o que garante
 * que o pedaço nem seja buscado fora do aplicativo.
 *
 * FALHAR AQUI É SEMPRE SILENCIOSO, de propósito. Nada neste arquivo é
 * essencial: vibração, splash e cor de barra são acabamento. Uma versão antiga
 * do app, instalada antes de o plugin existir, tem que continuar funcionando —
 * e um `catch` vazio é exatamente o comportamento certo para "não deu, segue".
 */

/** Força do toque. Nomeada pelo que se sente, não pela API da Apple. */
export type ForcaDoToque = "leve" | "media";

/**
 * O tremidinho que confirma um gesto.
 *
 * Existe porque `navigator.vibrate()` NÃO FUNCIONA NO IOS — o Safari nunca
 * implementou a Vibration API, e a WebView herda isso. A chamada não dá erro:
 * ela simplesmente não faz nada, que é a pior forma de não funcionar. O toque
 * longo do painel de widgets abria o menu sem nenhuma confirmação no dedo.
 *
 * No Android pelo navegador o `vibrate` funciona, então ele continua ali como
 * saída para quem não está no aplicativo.
 */
export async function vibrar(forca: ForcaDoToque = "leve"): Promise<void> {
  if (!ehAppIOSNoNavegador()) {
    navigator.vibrate?.(12);
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({
      style: forca === "leve" ? ImpactStyle.Light : ImpactStyle.Medium,
    });
  } catch {
    // App antigo, sem o plugin embarcado. Segue sem o toque.
  }
}

/**
 * Tira a tela de abertura do sistema.
 *
 * A splash nativa é a única coisa que aparece enquanto a WebView ainda está
 * buscando mimu.pro — antes dela, o app seria um retângulo vazio. Quem a
 * sucede é a `TelaAbertura`, que é web e só existe depois do carregamento.
 *
 * As duas usam o mesmo fundo (`#0A0A0A`, em `ios.backgroundColor`), então a
 * troca não pisca: a marca do sistema sai e a marca da web entra sobre a mesma
 * cor.
 *
 * Chamar isto duas vezes não faz mal, e é bom que não faça: o `launchShowDuration`
 * do config já esconde sozinho depois de alguns segundos, como rede de
 * segurança para o caso de a página nunca carregar.
 */
export async function esconderSplashNativa(): Promise<void> {
  if (!ehAppIOSNoNavegador()) return;

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // Sem o plugin, quem esconde é o próprio sistema.
  }
}

/**
 * Acerta a barra de status com o tema.
 *
 * O nome da constante da Apple é ao contrário do que parece: `Style.Dark`
 * significa CONTEÚDO claro, para fundo escuro. Trocar os dois deixa o relógio
 * preto sobre o preto da Mimu — invisível, e o tipo de coisa que ninguém nota
 * numa captura de tela e todo mundo nota no celular.
 */
export async function pintarBarraDeStatus(
  tema: "claro" | "escuro",
): Promise<void> {
  if (!ehAppIOSNoNavegador()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({
      style: tema === "escuro" ? Style.Dark : Style.Light,
    });
  } catch {
    // Sem o plugin, a barra fica no padrão do sistema.
  }
}

/**
 * Inscreve o aparelho no APNs e manda o token para o servidor.
 *
 * SUBSTITUI O WEB PUSH DENTRO DO APLICATIVO, não convive com ele: a WKWebView
 * não expõe `PushManager`, então `lib/push-client.ts` nem chega a criar uma
 * inscrição ali. Quem abre pelo Safari continua no caminho de sempre.
 *
 * Devolve `false` em silêncio quando a pessoa recusa a permissão — recusar é
 * uma resposta, não um erro, e insistir é o que faz desinstalarem o app.
 */
export async function registrarPushNativo(): Promise<boolean> {
  if (!ehAppIOSNoNavegador()) return false;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permissao = await PushNotifications.requestPermissions();
    if (permissao.receive !== "granted") return false;

    /*
     * A ESPERA PELO TOKEN NÃO PRENDE A TELA, e prendia.
     *
     * A permissão já foi decidida na linha acima — é ela que a pessoa
     * respondeu. O que vem depois é conversa entre o aparelho e a Apple, e
     * pode simplesmente não acontecer: sem o entitlement `aps-environment`,
     * ou sem sinal, o evento de registro nunca chega. O prompt esperava por
     * ele para fechar, e o botão ficava em "aguarde" até o prazo estourar.
     *
     * Agora a inscrição segue por fora. Se der certo, o aparelho passa a
     * receber; se não, ninguém fica olhando para um botão girando por causa
     * de algo que não depende dela.
     */
    void inscreverNoApns(PushNotifications);
    return true;
  } catch {
    // App antigo, sem o plugin embarcado.
    return false;
  }
}

type PluginDePush = Awaited<
  typeof import("@capacitor/push-notifications")
>["PushNotifications"];

/**
 * Pede o token ao APNs e o manda para o servidor. Sem pressa e sem plateia.
 */
function inscreverNoApns(PushNotifications: PluginDePush): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    /*
     * O token chega por EVENTO, não como retorno de `register()`.
     *
     * `register()` devolve void assim que pede; quem traz o token é o
     * ouvinte, milissegundos depois. Esperar o retorno dele — que é o
     * caminho intuitivo — devolve sempre "deu certo" sem token nenhum.
     *
     * O prazo existe porque o evento pode não vir: sem sinal, sem o
     * entitlement `aps-environment`, ou com o APNs fora do ar. Ninguém mais
     * espera por ele na tela, mas uma promessa pendurada para sempre segura o
     * ouvinte e o import junto — e num app que fica aberto o dia inteiro isso
     * se acumula a cada tentativa.
     */
    const prazo = setTimeout(() => resolve(false), 15_000);

    void PushNotifications.addListener("registration", (token) => {
      clearTimeout(prazo);
      void fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tipo: "apns", token: token.value }),
      })
        .then((r) => resolve(r.ok))
        .catch(() => resolve(false));
    });

    void PushNotifications.addListener("registrationError", () => {
      clearTimeout(prazo);
      resolve(false);
    });

    void PushNotifications.register();
  });
}

/**
 * Leva para a tela certa quando alguém toca na notificação.
 *
 * Sem isto, tocar num aviso de "cliente chegando" abre o app no painel — e a
 * pessoa tem que procurar sozinha o que o aviso dizia. O `destino` é posto
 * pelo servidor em lib/push-apns.ts, e espelha o que public/sw.js já faz do
 * lado do Web Push.
 *
 * Devolve a função que desliga o ouvinte, para quem montar poder desmontar.
 */
export async function aoTocarNaNotificacao(
  navegar: (destino: string) => void,
): Promise<() => void> {
  if (!ehAppIOSNoNavegador()) return () => {};

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const ouvinte = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (acao) => {
        const destino = acao.notification.data?.destino;
        navegar(typeof destino === "string" ? destino : "/dashboard");
      },
    );
    return () => void ouvinte.remove();
  } catch {
    return () => {};
  }
}

/**
 * Leva a WebView para onde o link tocado apontava.
 *
 * Quando o Universal Link funciona, o iOS abre o aplicativo em vez do Safari —
 * mas ele NÃO navega sozinho: entrega a URL e para por aí. Sem este ouvinte, o
 * app abre na tela onde estava, e quem tocou em "confirmar meu e-mail" não vê
 * nada acontecer. É a metade do conserto que não aparece no entitlement.
 *
 * Navega por `location.href`, e não pelo router do Next, porque o app pode
 * estar em qualquer estado — inclusive na tela de começar, que é uma árvore de
 * React diferente da que atenderia a rota. Uma navegação de verdade é o que
 * garante que o servidor veja o `token_hash` e crie a sessão.
 *
 * SÓ ACEITA O NOSSO DOMÍNIO. A checagem parece redundante — o iOS só entrega
 * links que o apple-app-site-association reivindica — mas é ela que impede que
 * um dia alguém amplie o escopo daquele arquivo e transforme isto num
 * redirecionador aberto.
 *
 * Devolve a função que desliga o ouvinte.
 */
export async function aoAbrirPorLink(): Promise<() => void> {
  if (!ehAppIOSNoNavegador()) return () => {};

  try {
    const { App } = await import("@capacitor/app");
    const ouvinte = await App.addListener("appUrlOpen", ({ url }) => {
      let destino: URL;
      try {
        destino = new URL(url);
      } catch {
        return;
      }
      if (destino.host !== window.location.host) return;
      window.location.href = destino.pathname + destino.search;
    });
    return () => void ouvinte.remove();
  } catch {
    // App antigo, sem o plugin embarcado.
    return () => {};
  }
}
