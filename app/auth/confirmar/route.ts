import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/destino-pos-login";
import { ehAppIOS } from "@/lib/plataforma";
import { urlAbsoluta } from "@/lib/site";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Onde os links dos e-mails da Mimu chegam.
 *
 * Esta rota não existia, e era por isso que quem confirmava o e-mail voltava
 * para a tela de login. O link do e-mail leva ao Supabase, que valida e
 * devolve a pessoa para o site — mas a sessão só nasce quando alguém troca o
 * código recebido por ela. Sem ninguém fazendo essa troca, a pessoa
 * aterrissava deslogada e o middleware a mandava para o login. O e-mail dizia
 * "confirme e comece" e ela caía num formulário de senha.
 *
 * A recuperação de senha tinha o mesmo defeito: /redefinir-senha espera uma
 * sessão de recuperação que nunca chegava.
 *
 * Usamos `token_hash` com `verifyOtp`, e não o fluxo PKCE que vem por padrão.
 * O PKCE guarda um segredo no navegador que iniciou o cadastro e só funciona
 * se o link for aberto NAQUELE navegador. Quem se cadastra pelo celular e abre
 * o e-mail no computador, ou usa o navegador de dentro do app de e-mail,
 * ficaria travado do mesmo jeito. Com `token_hash` o link vale em qualquer
 * lugar, que é como as pessoas de fato usam e-mail.
 */

/** Tipos que a Mimu de fato envia. Qualquer outro é link forjado ou antigo. */
const TIPOS_ACEITOS = new Set<EmailOtpType>([
  "signup",
  "recovery",
  "magiclink",
  "email_change",
  "invite",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  /**
   * O destino sai do endereço público configurado, não da requisição.
   *
   * Atrás do proxy do Railway, `request.nextUrl` traz o endereço interno do
   * contêiner: quem confirmava o e-mail era mandado para
   * https://localhost:8080/login e batia numa página que não existe na
   * máquina dela. Medido na produção, era esse o cabeçalho Location.
   *
   * Clonar a URL da requisição não resolve, porque o clone carrega o mesmo
   * origin errado. O middleware escapa disso porque respostas de middleware
   * são reescritas pelo Next em relação à requisição original, o que não vale
   * para uma rota como esta. Então aqui o endereço é o de lib/site.ts, que já
   * é a fonte única do endereço público do produto.
   */
  const paraRota = (caminho: string, erro?: string) =>
    NextResponse.redirect(
      urlAbsoluta(erro ? `${caminho}?erro=${erro}` : caminho),
    );

  const paraLogin = (motivo: string) => paraRota("/login", motivo);

  if (!tokenHash || !tipo || !TIPOS_ACEITOS.has(tipo)) {
    return paraLogin("link-invalido");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: tipo,
    token_hash: tokenHash,
  });

  if (error || !data.user) {
    // O link expira e só pode ser usado uma vez. É o caso mais comum aqui, e
    // merece uma mensagem própria: "inválido" faria a pessoa achar que o
    // cadastro dela deu errado, quando o que houve foi demora ou um segundo
    // clique.
    return paraLogin("link-expirado");
  }

  // A sessão já existe a partir daqui. Recuperação vai escolher a senha nova;
  // o resto entra no produto, no ponto certo para o estado da conta.
  if (tipo === "recovery") {
    return paraRota("/redefinir-senha");
  }

  const noApp = ehAppIOS(request.headers.get("user-agent"));

  /*
   * Cadastrou no aplicativo e confirmou no navegador.
   *
   * É o caminho normal hoje, e não a exceção: o link do e-mail é um https
   * comum, então o iOS o entrega ao navegador padrão. O problema é que a
   * WKWebView do Capacitor tem cookies SEPARADOS do Safari — a sessão que
   * acabou de nascer aqui não existe dentro do aplicativo, e voltar para ele
   * mostra a tela de começar como se o cadastro tivesse falhado.
   *
   * Mandar essa pessoa para o produto no navegador seria pior do que parece:
   * ela usaria a Mimu no Safari achando que é o app, e o app continuaria
   * inútil no aparelho dela.
   *
   * O conserto de verdade é o Universal Link, que faz o toque no e-mail abrir
   * o aplicativo — e exige versão nova na loja. Até lá, esta tela ao menos
   * explica.
   */
  if (data.user.user_metadata?.cadastro_no_app && !noApp) {
    return paraRota("/email-confirmado");
  }

  const destino = await destinoAposLogin(
    supabase,
    data.user.id,
    // Dentro do app iOS o destino nunca pode ser o checkout próprio.
    noApp,
  );
  return paraRota(destino);
}
