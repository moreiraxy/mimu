import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/destino-pos-login";
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
   * O destino é montado a partir da URL da própria requisição, e NÃO com
   * `origin` colado à mão.
   *
   * Atrás do proxy do Railway, `request.nextUrl.origin` é o endereço interno
   * do contêiner: quem confirmava o e-mail era mandado para
   * https://localhost:8080/login e batia numa página que não existe na
   * máquina dela. Clonando a URL e trocando só o caminho, o Next percebe que
   * o destino é o mesmo host e devolve um endereço relativo, que funciona em
   * qualquer ambiente. É o que o middleware já fazia.
   */
  const paraRota = (caminho: string, erro?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = caminho;
    url.search = erro ? `?erro=${erro}` : "";
    return NextResponse.redirect(url);
  };

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

  const destino = await destinoAposLogin(supabase, data.user.id);
  return paraRota(destino);
}
