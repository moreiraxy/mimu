import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { assinaturaVencida, trialVencido } from "@/lib/assinatura";
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
const ALWAYS_PUBLIC_ROUTES = [
  "/redefinir-senha",
  "/auth/confirmar",
  "/obrigado",
  "/",
];

// Páginas internas da landing page (histórias de clientes e textos legais).
// Precisam ser públicas pelo motivo óbvio: quem lê a política de privacidade
// antes de se cadastrar ainda não tem conta. Como o slug é dinâmico, a
// comparação é por prefixo e não por igualdade.
const ROTAS_PUBLICAS_DA_LANDING = ["/historias", "/legal"];

// Chamadas de servidor para servidor: nunca têm sessão de usuário, então
// ficam de fora até da exigência de login. Cada uma se protege por conta
// própria — o webhook confere a assinatura do Mercado Pago, e a tarefa
// diária exige um segredo no cabeçalho.
const ROTAS_PUBLICAS_SEM_AUTH = [
  "/api/pagamento/webhook",
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

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.includes(pathname);

  if (!user && !isGuestOnlyRoute) {
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
      .select("id, onboarding_concluido, suspensa_em, assinaturas(*)")
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
         * Marca com a service role, não com a sessão.
         *
         * A auditoria revogou escrita em `assinaturas` para quem está logado,
         * porque dava para virar Premium de graça pelo console. Esta gravação
         * é do sistema, mas passava pela sessão de quem estava navegando:
         * depois da revogação ela falhava calada.
         *
         * O bloqueio continuava funcionando, porque o redirect abaixo não
         * depende dela. O que quebrava era o registro: a conta ficava marcada
         * como "trial" para sempre, e o painel admin contava como conta em
         * teste uma pessoa cujo teste tinha acabado.
         */
        const { error: erroAoVencer } = await createServiceClient()
          .from("assinaturas")
          .update({ status: "vencida" })
          .eq("id", assinatura.id);

        if (erroAoVencer) {
          console.error("Não consegui marcar a assinatura como vencida.", erroAoVencer);
        }

        const url = request.nextUrl.clone();
        // Quem pagou não teve "período gratuito acabando": vai para o checkout
        // escolher o plano de novo, e não para a tela que fala de teste.
        url.pathname = pagaVencidaAgora ? "/assinar" : "/trial-vencido";
        return NextResponse.redirect(url);
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
        url.pathname = "/trial-vencido";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
