import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/destino-pos-login";
import { ehAppIOS } from "@/lib/plataforma";
import { urlAbsoluta } from "@/lib/site";

/**
 * Onde a Apple e o Google devolvem a pessoa depois do login.
 *
 * O provedor não entrega uma sessão: entrega um CÓDIGO de uso único, e alguém
 * precisa trocar esse código por sessão. É o que esta rota faz. Sem ela, quem
 * entrasse com o Google voltaria para o site deslogado e o middleware o
 * mandaria de volta para o login — um laço, e do lado de fora parece que o
 * botão não funciona.
 *
 * Existe SEPARADA de /auth/confirmar porque as duas trocas são diferentes: o
 * link de e-mail traz um `token_hash` e usa `verifyOtp`; o login social traz um
 * `code` e usa `exchangeCodeForSession`. Misturar as duas num arquivo só faria
 * cada uma carregar o `if` da outra.
 *
 * JÁ FUNCIONA, mesmo com os botões desligados: ela é o que faltava para o dia
 * de ligar ser só preencher credenciais. Ver lib/login-social.ts.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get("code");

  /*
   * O endereço de destino sai de lib/site.ts, e não da requisição.
   *
   * É a mesma armadilha documentada em /auth/confirmar: atrás de proxy, a URL
   * da requisição traz o endereço interno do contêiner, e a pessoa era mandada
   * para um endereço que não existe na máquina dela.
   */
  const paraRota = (caminho: string) => NextResponse.redirect(urlAbsoluta(caminho));

  /*
   * O provedor avisa a recusa pela própria URL — a pessoa tocou em "Cancelar"
   * na tela da Apple, ou negou o acesso. Não é erro nosso e não merece susto:
   * volta para o login em silêncio, de onde ela escolhe outro caminho.
   */
  if (searchParams.get("error")) {
    return paraRota("/login");
  }

  if (!codigo) {
    return paraRota("/login?erro=link-invalido");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error || !data.user) {
    return paraRota("/login?erro=link-expirado");
  }

  const destino = await destinoAposLogin(
    supabase,
    data.user.id,
    // Dentro do app iOS o destino nunca pode ser o checkout próprio.
    ehAppIOS(request.headers.get("user-agent")),
  );
  return paraRota(destino);
}
