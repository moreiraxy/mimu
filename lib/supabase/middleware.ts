import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { assinaturaVencida, trialVencido, planoEfetivo } from "@/lib/assinatura";
import { enderecoExiste } from "@/lib/rotas-existentes";
import { PLANO_GRATUITO, modulosLiberados } from "@/lib/planos";
import { moduloExigidoPor } from "@/lib/rotas-modulos";
import type { ModuloAtivo } from "@/types";
import { ehAppIOS } from "@/lib/plataforma";
import { NextResponse, type NextRequest } from "next/server";

const GUEST_ONLY_ROUTES = ["/login", "/cadastro", "/recuperar-senha"];

// /redefinir-senha depende de um token de recuperação que chega no #hash da
// URL — o servidor nunca vê esse hash, então essa rota fica de fora tanto da
// exigência de sessão quanto do redirect de "usuário já logado".
// "/" é a landing page pública; o redirect de quem já está logada acontece
// mais abaixo, não na página, porque "/" agora é reescrito para o HTML dela.
// /auth/confirmar é onde os links dos e-mails aterrissam. Quem chega ali
// ainda NÃO tem sessão: é justamente a rota que a cria. Exigir login aqui
// mandaria a pessoa para o login com o link na mão, que era o sintoma.
// /obrigado é onde a Cakto larga quem acabou de pagar. Quem compra por um
// link compartilhado não tem conta nem sessão — é justamente a tela que
// explica como criar a senha. Exigir login aqui mandaria para /login quem
// acabou de pagar e ainda não tem senha nenhuma, que é o beco sem saída.
// /conta-excluida é onde cai quem acabou de apagar a própria conta. O usuário
// do auth já não existe nesse ponto: exigir sessão aqui mandaria pro login
// exatamente quem não tem mais como fazer login, e a despedida viraria um
// erro. Ver app/api/conta/route.ts.
const ALWAYS_PUBLIC_ROUTES = [
  "/redefinir-senha",
  "/auth/confirmar",
  "/obrigado",
  "/afiliados",
  "/conta-excluida",
  "/",
];

// Páginas internas da landing page (histórias de clientes e textos legais).
// Precisam ser públicas pelo motivo óbvio: quem lê a política de privacidade
// antes de se cadastrar ainda não tem conta. Como o slug é dinâmico, a
// comparação é por prefixo e não por igualdade.
const ROTAS_PUBLICAS_DA_LANDING = ["/historias", "/legal"];

// Chamadas de servidor para servidor: nunca têm sessão de usuário, então
// ficam de fora até da exigência de login. Cada uma se protege por conta
// própria — o webhook do Mercado Pago confere a assinatura HMAC, o da Cakto
// confere o segredo que vem no corpo (é o que eles oferecem), e a tarefa
// diária exige um segredo no cabeçalho.
const ROTAS_PUBLICAS_SEM_AUTH = [
  "/api/pagamento/webhook",
  "/api/webhooks/cakto",
  "/api/cron/alertas-diarios",
  "/api/cron/saude",
];

// Exige login, mas nunca entra no gate de assinatura abaixo — senão
// /assinar acaba redirecionando pra /assinar (loop).
const ROTAS_SEM_GATE_DE_ASSINATURA = [
  "/onboarding",
  "/bem-vindo",
  "/assinar",
  "/trial-vencido",
  // O painel admin exige login, mas não pode passar pelo gate de assinatura:
  // quem administra não necessariamente tem assinatura ativa, e seria
  // empurrada pra /assinar ao tentar entrar. Quem checa se ela é MESMO admin
  // é o layout do painel, no servidor (app/admin/layout.tsx) — o middleware
  // aqui só garante que existe sessão.
  "/admin",
];

// Onde para quem teve a conta suspensa pelo painel admin. Fica fora do gate
// para não virar um redirect infinito pra si mesma.
const ROTA_CONTA_SUSPENSA = "/conta-suspensa";

/*
 * Tudo que cobra pelo checkout próprio (Mercado Pago).
 *
 * Existe para uma coisa só: sumir inteiro de dentro do app iOS, onde quem
 * cobra é a Apple. Rota nova de pagamento entra AQUI no mesmo commit em que
 * nasce — uma que fique de fora vira um caminho de compra vivo dentro do app,
 * e é exatamente o que a revisão da Apple procura.
 */
const ROTAS_DE_PAGAMENTO_PROPRIO = [
  "/assinar",
  "/trial-vencido",
  "/api/pagamento",
];

function comecaCom(pathname: string, rotas: string[]): boolean {
  return rotas.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (ROTAS_PUBLICAS_SEM_AUTH.includes(pathname)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (comecaCom(pathname, ROTAS_PUBLICAS_DA_LANDING)) {
    return response;
  }

  if (ALWAYS_PUBLIC_ROUTES.includes(pathname)) {
    // Quem já é cliente não precisa ver a página de vendas. Essa decisão
    // morava na page.tsx da raiz, mas "/" agora é reescrito para o HTML da
    // landing page (next.config.mjs) e aquela página deixou de ser servida —
    // se ficasse lá, a regra simplesmente sumiria sem ninguém perceber.
    /*
     * ...MENOS quem pediu explicitamente para ver o site.
     *
     * Quem está com o teste vencido ou a conta suspensa era mandada daqui para
     * o painel, o painel devolvia para a tela de cobrança, e o link "voltar ao
     * site" daquela tela caía aqui de novo. Círculo fechado: a pessoa não
     * conseguia rever preços, ler os termos nem achar o contato do suporte.
     *
     * O `?sair=1` é posto pelas telas de bloqueio, então ele só existe quando a
     * própria pessoa clicou para sair. Quem chega em "/" por fora continua indo
     * para o painel, que é o certo: cliente ativa não precisa da página de
     * vendas.
     */
    const querendoVerOSite = request.nextUrl.searchParams.has("sair");

    if (user && pathname === "/" && !querendoVerOSite) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  /*
   * Dentro do app iOS, o checkout do Mercado Pago não existe.
   *
   * A diretriz 3.1.1 da Apple exige que assinatura digital consumida dentro de
   * um app iOS passe pelo In-App Purchase. Mostrar ali o nosso checkout —
   * ou levar a pessoa até ele por um redirect — é reprovação na revisão, e o
   * redirect é o jeito fácil de fazer isso sem perceber: ninguém lê
   * `url.pathname = "/assinar"` como um botão de compra, mas é o que a Apple
   * vê. Por isso o bloqueio é por rota e vem ANTES de qualquer outro gate.
   *
   * O destino é o painel e não uma tela de erro: quem tocou num link antigo
   * não fez nada errado, e no iOS o caminho de assinar é o IAP, que mora
   * dentro do app. Na web nada disso muda — /assinar segue sendo por onde se
   * vende.
   *
   * As rotas de API entram na lista porque o bloqueio de tela não basta: um
   * POST direto em /api/pagamento/cartao pagaria por fora do IAP do mesmo
   * jeito.
   */
  if (ehAppIOS(request.headers.get("user-agent"))) {
    if (comecaCom(pathname, ROTAS_DE_PAGAMENTO_PROPRIO)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Assinatura pelo app é feita pela App Store." },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.includes(pathname);

  if (!user && !isGuestOnlyRoute) {
    /*
     * Endereço que não existe vira 404 nosso, não desvio para o login.
     *
     * O "pega tudo" abaixo alcançava também o que nunca existiu: digitar
     * `mimu.pro/qualqercoisa` respondia 307 para /login. A pessoa via um
     * formulário de senha em vez de "essa página não existe", e o buscador
     * via um redirecionamento no lugar de um 404 — que é como endereço
     * inventado acaba indexado. A tela de 404 existia, com marca e saídas, e
     * era inalcançável.
     *
     * Deixar passar não abre nada: o que exige sessão continua exigindo no
     * layout, que redireciona por conta própria. E `enderecoExiste` só
     * responde por endereços que NÃO existem — para os que existem, nada
     * muda.
     */
    if (!enderecoExiste(pathname)) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isGuestOnlyRoute) {
    const url = request.nextUrl.clone();
    // Quem já tem conta e clica num plano pago na landing cai aqui, em
    // /cadastro?plano=X. Mandar pro /dashboard jogaria a escolha fora e a
    // pessoa não teria como assinar: ela pediu para pagar, então vai pro
    // checkout. (Trocar de plano com assinatura em dia é outra conversa, e
    // ainda não existe.)
    const indoPagar =
      pathname === "/cadastro" && url.searchParams.has("plano");
    url.pathname = indoPagar ? "/assinar" : "/dashboard";

    // O plano SÓ é descartado quando o destino é o painel, onde ele não
    // significa nada. Indo pro checkout ele tem que seguir junto: sem o
    // parâmetro a tela caía no plano padrão, e quem clicava em "Assinar
    // Premium" via o Pro no checkout.
    if (!indoPagar) {
      url.searchParams.delete("plano");
    }
    return NextResponse.redirect(url);
  }

  // Gates de acesso — só pra quem está logado e fora de rotas de API (que
  // cuidam da própria autorização internamente e não podem virar um redirect
  // HTML). A consulta a `empresas` é uma só, compartilhada pelos dois gates.
  if (
    user &&
    !isGuestOnlyRoute &&
    !pathname.startsWith("/api/") &&
    pathname !== ROTA_CONTA_SUSPENSA
  ) {
    /*
     * Empresa e assinatura numa consulta só, com junção.
     *
     * Eram duas idas em sequência, e o middleware roda em TODA navegação: a
     * segunda só começava depois da primeira voltar, e as duas somavam ao
     * tempo antes de qualquer pixel aparecer. Medido num celular médio, o HTML
     * levava dois segundos para chegar.
     *
     * A junção é possível porque assinatura tem no máximo uma por empresa, e
     * o gate abaixo já lia as duas de qualquer jeito.
     */
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, onboarding_concluido, suspensa_em, modulos_ativos, assinaturas(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    // Suspensão vem primeiro, e de propósito NÃO respeita
    // ROTAS_SEM_GATE_DE_ASSINATURA: quem foi tirada da plataforma não pode
    // contornar a suspensão indo pagar em /assinar. É a diferença entre
    // "sua assinatura venceu" (resolve pagando) e "sua conta foi suspensa"
    // (só quem administra desfaz).
    if (empresa?.suspensa_em) {
      const url = request.nextUrl.clone();
      url.pathname = ROTA_CONTA_SUSPENSA;
      return NextResponse.redirect(url);
    }

    if (comecaCom(pathname, ROTAS_SEM_GATE_DE_ASSINATURA)) {
      return response;
    }

    // Onboarding ainda não terminou — a própria dashboard layout já manda
    // pra /onboarding; não faz sentido cobrar assinatura de quem nem
    // chegou no fim do cadastro (o trial só nasce ao concluir).
    if (empresa?.onboarding_concluido) {
      // A junção devolve lista; a relação é de no máximo uma.
      const assinatura = Array.isArray(empresa.assinaturas)
        ? (empresa.assinaturas[0] ?? null)
        : (empresa.assinaturas ?? null);

      if (!assinatura) {
        const url = request.nextUrl.clone();
        url.pathname = "/assinar";
        return NextResponse.redirect(url);
      }

      /*
       * Duas formas de vencer, tratadas do mesmo jeito.
       *
       * O trial vence quando passa de `trial_fim`. A assinatura paga vence
       * quando passa de `proxima_cobranca` — e isso NÃO era checado: a data era
       * gravada na ativação e nunca mais lida, então uma conta `ativa` ficava
       * liberada para sempre até alguém marcar `vencida` na mão. Numa venda
       * anual, isso é um ano inteiro de acesso de graça passando batido.
       */
      const trialVencidoAgora = trialVencido(assinatura);
      const pagaVencidaAgora = assinaturaVencida(assinatura);

      if (trialVencidoAgora || pagaVencidaAgora) {
        /*
         * A conta CAI PARA O GRATUITO. Antes era uma parede.
         *
         * O que existia aqui marcava 'vencida' e redirecionava para /assinar
         * ou /trial-vencido: quem não pagasse perdia o acesso a tudo, com o
         * histórico do próprio negócio do outro lado do bloqueio. Isso
         * transformava um mês apertado em ex-cliente.
         *
         * Agora o acesso continua, reduzido ao que o plano gratuito cobre
         * (ver MODULOS_DO_PLANO em lib/planos.ts). Ninguém perde dado, ninguém
         * bate em porta fechada, e a conversa sobre voltar a pagar acontece
         * com a pessoa ainda dentro do produto.
         *
         * É escolha de produto, e não exigência da Apple: com o IAP no iOS um
         * paywall duro seria aprovado normalmente. O que pesa é outra coisa —
         * dentro do app não existe PIX, só o que estiver no Apple ID. Quem não
         * tem cartão fica sem caminho nenhum, e o gratuito é o que a mantém
         * usando a Mimu até conseguir assinar pela web.
         *
         * Marca com a service role, não com a sessão. A auditoria revogou
         * escrita em `assinaturas` para quem está logado, porque dava para
         * virar Premium de graça pelo console; esta gravação é do sistema, mas
         * passava pela sessão de quem estava navegando e falhava calada.
         */
        const { error: erroAoRebaixar } = await createServiceClient()
          .from("assinaturas")
          .update({
            plano: PLANO_GRATUITO,
            status: "ativa",
            // Sem data de cobrança o acesso não vence de novo: é o que faz
            // `assinaturaVencida()` devolver false e o gratuito ser permanente.
            proxima_cobranca: null,
            valor_mensal: 0,
          })
          .eq("id", assinatura.id);

        if (erroAoRebaixar) {
          /*
           * Falhou o rebaixamento: a pessoa SEGUE, não é bloqueada.
           *
           * O estado no banco continua o antigo e a próxima navegação tenta de
           * novo. Barrar aqui seria punir alguém por uma falha nossa de
           * escrita — e o pior caso de deixar passar é algumas telas a mais
           * até a gravação funcionar.
           */
          console.error(
            "Não consegui rebaixar a assinatura para o gratuito.",
            erroAoRebaixar,
          );
        }

        return response;
      }

      /*
       * O TETO DO PLANO, aplicado por rota.
       *
       * A navegação já esconde o que o plano não cobre, mas esconder item de
       * menu não fecha porta: /agenda digitada na barra de endereço abria
       * normalmente numa conta gratuita. Aqui é onde fecha de verdade, e vale
       * igual para a tela e para a rota de API.
       *
       * O destino é o painel, sem mensagem de erro: quem chegou aqui
       * provavelmente veio de um link salvo ou do histórico do navegador de
       * quando ainda tinha o módulo, e não fez nada errado.
       */
      const moduloExigido = moduloExigidoPor(pathname);

      if (
        moduloExigido &&
        !modulosLiberados(
          // O plano EFETIVO, e não o gravado: uma linha 'pendente' pode dizer
          // 'pro' sem nunca ter sido paga, e o teto não pode acreditar nela.
          planoEfetivo(assinatura),
          (empresa.modulos_ativos ?? []) as ModuloAtivo[],
        ).includes(moduloExigido)
      ) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Esse recurso não está no seu plano." },
            { status: 403 },
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }

      /*
       * Daqui pra baixo, todo caminho leva ao checkout próprio — e dentro do
       * app iOS o checkout próprio não existe.
       *
       * Sem esta saída o app entra em LAÇO: o gate manda para /assinar, o
       * bloqueio de pagamento do iOS (mais acima) devolve para /dashboard, e
       * o gate manda para /assinar de novo. A conta fica girando sem nunca
       * pintar uma tela.
       *
       * A saída é a mesma promessa do plano gratuito: quem não tem assinatura
       * válida usa a Mimu reduzida em vez de bater numa porta. O teto logo
       * acima já garante que ela veja só o que o gratuito cobre, porque
       * `planoEfetivo()` ignora o plano gravado de quem não pagou. Assinar,
       * no iOS, é pelo IAP — dentro do app, não por aqui.
       */
      if (ehAppIOS(request.headers.get("user-agent"))) {
        return response;
      }

      // Escolheu plano pago e ainda não pagou: o caminho dela é o checkout.
      // Mandar pra /trial-vencido diria "seu período gratuito acabou" pra
      // quem nunca teve período gratuito.
      if (assinatura.status === "pendente") {
        const url = request.nextUrl.clone();
        url.pathname = "/assinar";
        return NextResponse.redirect(url);
      }

      if (
        assinatura.status === "vencida" ||
        assinatura.status === "cancelada"
      ) {
        const url = request.nextUrl.clone();
        /*
         * Cancelada vai para o checkout, não para a tela de teste vencido.
         *
         * Quem teve o pagamento revertido, ou cancelou a assinatura, nunca
         * esteve num "período gratuito acabando". Mandar essa pessoa para uma
         * tela que fala de teste grátis é dizer a coisa errada no momento em
         * que ela mais precisa entender o que aconteceu.
         *
         * Vencida também só é a tela de teste quando o teste é o que venceu:
         * quem pagou e chegou ao fim do prazo já é mandada para /assinar mais
         * acima, no mesmo trecho que marca o vencimento.
         */
        url.pathname =
          assinatura.status === "cancelada" ? "/assinar" : "/trial-vencido";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
