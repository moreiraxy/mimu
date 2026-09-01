/**
 * O cadeado biométrico da Mimu — Face ID no iPhone, digital no Android.
 *
 * O QUE ISTO É, com precisão, porque a diferença muda o que se pode prometer
 * na tela:
 *
 * Isto é um CADEADO DO APP, e não um segundo fator de autenticação. Quem diz
 * se a pessoa está logada continua sendo a sessão do Supabase, no servidor. O
 * que a biometria faz é exigir a cara ou o dedo antes de MOSTRAR a Mimu já
 * aberta neste aparelho — que é exatamente o que os apps de banco fazem por
 * cima de uma sessão que eles já têm.
 *
 * Por que essa distinção importa: alguém com o celular desbloqueado na mão e
 * conhecimento técnico contorna um cadeado de interface. Contra isso serve o
 * bloqueio de tela do próprio aparelho, não este. Contra o caso real — o
 * celular na bancada da loja, alguém abre o app e vê o faturamento — este
 * resolve inteiro. A tela promete só isso.
 *
 * A implementação usa WebAuthn com autenticador de plataforma, e não um
 * plugin nativo, por um motivo prático: assim funciona igual no navegador, no
 * app instalado da tela de início e dentro da WebView do app da loja. Um
 * plugin nativo funcionaria só no último, e a Mimu vive nos três.
 */

const CHAVE = "mimu:biometria";

interface Registro {
  /** O id da credencial criada no aparelho, em base64url. */
  credencial: string;
  /** De quem é. Sem isto, trocar de conta no mesmo aparelho herdaria o cadeado da anterior. */
  usuario: string;
}

function base64url(bytes: ArrayBuffer): string {
  const binario = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * O tipo de retorno é `ArrayBuffer`, e não `Uint8Array`, de propósito.
 *
 * `Uint8Array` pode estar apoiado num `SharedArrayBuffer`, que o WebAuthn não
 * aceita — e o TypeScript reclama disso, com razão. Devolver o buffer resolve
 * na origem em vez de calar o aviso com um `as`.
 */
function deBase64url(texto: string): ArrayBuffer {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes.buffer;
}

/**
 * O aparelho tem leitor de digital ou reconhecimento facial disponível?
 *
 * Pergunta ao navegador em vez de adivinhar pelo User-Agent. Um iPhone sem
 * Face ID configurado responde `false` aqui, e é a resposta certa — oferecer
 * o cadeado para quem não pode ligá-lo produz um botão que só sabe falhar.
 */
export async function biometriaDisponivel(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** O cadeado está ligado para esta pessoa neste aparelho? */
export function biometriaLigada(usuarioId: string | null | undefined): boolean {
  if (typeof window === "undefined" || !usuarioId) return false;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return false;
    const registro = JSON.parse(bruto) as Registro;
    return registro.usuario === usuarioId && Boolean(registro.credencial);
  } catch {
    return false;
  }
}

/**
 * Liga o cadeado: cria a credencial no aparelho e guarda o id dela.
 *
 * O desafio é aleatório e local. Num segundo fator de verdade ele viria do
 * servidor e voltaria para lá ser conferido — aqui não vem, e é por isso que
 * o comentário lá em cima insiste que isto é cadeado, e não autenticação.
 */
export async function ligarBiometria(
  usuarioId: string,
  nomeVisivel: string,
): Promise<boolean> {
  if (!(await biometriaDisponivel())) return false;

  const desafio = crypto.getRandomValues(new Uint8Array(32));
  const idUsuario = new TextEncoder().encode(usuarioId);

  try {
    const credencial = (await navigator.credentials.create({
      publicKey: {
        challenge: desafio,
        rp: { name: "Mimu" },
        user: {
          id: idUsuario,
          name: nomeVisivel,
          displayName: nomeVisivel,
        },
        // -7 é ECDSA com SHA-256 e -257 é RSA: os dois que todo autenticador
        // de plataforma implementa. Sem esta lista o navegador recusa.
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          // "platform" é o que exclui chave USB e celular pareado: o cadeado
          // tem que ser DESTE aparelho, senão ele não tranca nada.
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!credencial) return false;

    const registro: Registro = {
      credencial: base64url(credencial.rawId),
      usuario: usuarioId,
    };
    window.localStorage.setItem(CHAVE, JSON.stringify(registro));
    return true;
  } catch {
    // Cancelar no Face ID cai aqui, e cancelar não é erro: quem desistiu
    // recebe o botão de volta como estava.
    return false;
  }
}

/** Desliga o cadeado. A credencial no aparelho fica órfã e o sistema a limpa sozinho. */
export function desligarBiometria(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE);
}

/**
 * Pede a biometria e diz se passou.
 *
 * Devolve `true` também quando o cadeado não está ligado: quem não trancou a
 * porta não deve ficar do lado de fora dela.
 */
export async function confirmarBiometria(
  usuarioId: string | null | undefined,
): Promise<boolean> {
  if (!biometriaLigada(usuarioId)) return true;

  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const registro = JSON.parse(bruto ?? "{}") as Registro;
    const desafio = crypto.getRandomValues(new Uint8Array(32));

    const resposta = await navigator.credentials.get({
      publicKey: {
        challenge: desafio,
        allowCredentials: [
          { type: "public-key", id: deBase64url(registro.credencial) },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    });

    return Boolean(resposta);
  } catch {
    return false;
  }
}
