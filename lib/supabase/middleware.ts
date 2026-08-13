import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const GUEST_ONLY_ROUTES = ["/login", "/cadastro", "/recuperar-senha"];

// /redefinir-senha depende de um token de recuperação que chega no #hash da
// URL — o servidor nunca vê esse hash, então essa rota fica de fora tanto da
// exigência de sessão quanto do redirect de "usuário já logado".
// "/" é a landing page pública — quem já está logada é redirecionada pro
// /dashboard dentro do próprio page.tsx (getEmpresaAtual), não aqui.
const ALWAYS_PUBLIC_ROUTES = ["/redefinir-senha", "/"];

// Notificação servidor-a-servidor do Mercado Pago — nunca tem sessão de
// usuário, então fica de fora até da exigência de login.
const ROTAS_PUBLICAS_SEM_AUTH = ["/api/pagamento/webhook"];

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

  if (ALWAYS_PUBLIC_ROUTES.includes(pathname)) {
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
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Gate de assinatura — só pra quem está logado, fora do onboarding, fora
  // das próprias telas de assinatura, e fora de rotas de API (que cuidam da
  // própria autorização internamente e não podem virar um redirect HTML).
  if (
    user &&
    !isGuestOnlyRoute &&
    !pathname.startsWith("/api/") &&
    !comecaCom(pathname, ROTAS_SEM_GATE_DE_ASSINATURA)
  ) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, onboarding_concluido")
      .eq("user_id", user.id)
      .maybeSingle();

    // Onboarding ainda não terminou — a própria dashboard layout já manda
    // pra /onboarding; não faz sentido cobrar assinatura de quem nem
    // chegou no fim do cadastro (o trial só nasce ao concluir).
    if (empresa?.onboarding_concluido) {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("empresa_id", empresa.id)
        .maybeSingle();

      if (!assinatura) {
        const url = request.nextUrl.clone();
        url.pathname = "/assinar";
        return NextResponse.redirect(url);
      }

      const trialVencidoAgora =
        assinatura.status === "trial" &&
        assinatura.trial_fim !== null &&
        new Date(assinatura.trial_fim) < new Date();

      if (trialVencidoAgora) {
        await supabase
          .from("assinaturas")
          .update({ status: "vencida" })
          .eq("id", assinatura.id);

        const url = request.nextUrl.clone();
        url.pathname = "/trial-vencido";
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
