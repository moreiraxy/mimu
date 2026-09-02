/**
 * Entrar com Apple e com Google.
 *
 * O CÓDIGO ESTÁ PRONTO E OS BOTÕES ESTÃO DESLIGADOS, e isso é de propósito —
 * mesmo padrão de `lib/loja.ts`. Um botão "Continuar com Google" que aparece
 * antes de as credenciais existirem leva a pessoa para uma página de erro do
 * Google e a deixa achando que a conta dela quebrou. Não oferecer o caminho é
 * melhor do que oferecer um caminho que não vai dar em nada.
 *
 * Ligar é trocar `false` por `true` aqui, DEPOIS de fazer o de fora. Nenhuma
 * outra linha do app precisa mudar: a tela de login pergunta a este arquivo o
 * que mostrar.
 *
 * ---------------------------------------------------------------------------
 * O QUE FALTA FAZER FORA DO CÓDIGO — para quem for ligar
 * ---------------------------------------------------------------------------
 *
 * GOOGLE (dá para fazer hoje, sem custo)
 *
 *   1. console.cloud.google.com → criar projeto → "APIs e serviços" →
 *      "Credenciais" → criar "ID do cliente OAuth" do tipo "Aplicativo da Web".
 *   2. Em "URIs de redirecionamento autorizados", colar o endereço que o
 *      Supabase mostra em Authentication → Providers → Google. É algo como
 *      https://<projeto>.supabase.co/auth/v1/callback
 *   3. Copiar Client ID e Client Secret para esse mesmo painel do Supabase e
 *      ativar o provedor lá.
 *   4. Trocar `google` para `true` abaixo.
 *
 * APPLE (exige o Apple Developer Program, US$ 99/ano)
 *
 *   1. developer.apple.com → Certificates, Identifiers & Profiles.
 *   2. Criar um **Services ID** (é ele que representa o site, e não o App ID),
 *      habilitar "Sign in with Apple" e registrar o mesmo endereço de retorno
 *      do Supabase.
 *   3. Criar uma **Key** com "Sign in with Apple" ligado e guardar o arquivo
 *      .p8 — ele só pode ser baixado UMA vez.
 *   4. No Supabase, preencher Services ID, Team ID, Key ID e o conteúdo do .p8.
 *   5. Trocar `apple` para `true` abaixo.
 *
 * ---------------------------------------------------------------------------
 * DUAS COISAS QUE VÃO MORDER, e é melhor saber antes
 * ---------------------------------------------------------------------------
 *
 * CONTA DUPLICADA. Hoje as contas são e-mail e senha, e os dados do negócio
 * ficam presos ao `user_id` (a empresa, as transações, os clientes). Se alguém
 * que já usa a Mimu com fulana@gmail.com tocar em "Continuar com Google" e o
 * Supabase criar um usuário NOVO em vez de reconhecer o mesmo e-mail, ela entra
 * num app vazio — o histórico não some, fica pendurado na conta antiga, mas do
 * lado de fora é indistinguível de perder tudo.
 *
 * Antes de ligar para gente de verdade: criar uma conta de teste por e-mail,
 * entrar com o Google no MESMO endereço, e conferir se caiu na mesma empresa.
 * Se não cair, o ajuste é a vinculação de identidades do Supabase
 * (Authentication → Settings), e não este arquivo.
 *
 * DENTRO DO APP DA LOJA o Google recusa login por navegador embutido — é
 * política deles, devolve `disallowed_useragent`. O fluxo daqui é o da WEB e
 * funciona no site; no app empacotado com Capacitor é preciso login nativo
 * (plugin próprio ou ASWebAuthenticationSession). São dois trabalhos, não um.
 *
 * E a regra 4.8 da App Store: app que oferece login social de terceiros E é
 * distribuído na loja da Apple PRECISA oferecer o Sign in with Apple junto.
 * Ligar só o Google e publicar não passa na revisão.
 */

export type ProvedorSocial = "apple" | "google";

/**
 * Quais provedores já têm credencial configurada no Supabase.
 *
 * Enquanto forem `false`, os botões não são desenhados — a tela de login fica
 * exatamente como está hoje, com e-mail e senha.
 */
export const PROVEDOR_LIGADO: Record<ProvedorSocial, boolean> = {
  apple: false,
  google: false,
};

/** A ordem em que aparecem. Apple primeiro, como manda a convenção do iOS. */
export const ORDEM_DOS_PROVEDORES: ProvedorSocial[] = ["apple", "google"];

export const ROTULO_DO_PROVEDOR: Record<ProvedorSocial, string> = {
  apple: "Continuar com Apple",
  google: "Continuar com Google",
};

/** Os provedores que devem aparecer agora. Vazio hoje, e é o correto. */
export function provedoresDisponiveis(): ProvedorSocial[] {
  return ORDEM_DOS_PROVEDORES.filter((p) => PROVEDOR_LIGADO[p]);
}

export function temLoginSocial(): boolean {
  return provedoresDisponiveis().length > 0;
}
