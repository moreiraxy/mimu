/*
 * As áreas que existem de verdade no app.
 *
 * Serve para uma coisa só: deixar o endereço inventado chegar na NOSSA tela de
 * 404 em vez de ser mandado para o login.
 *
 * O middleware protege por exclusão — o que não é público exige sessão — e o
 * "pega tudo" alcançava também o que não existe. Digitar `mimu.pro/qualqercoisa`
 * respondia 307 para /login: a pessoa via um formulário de senha em vez de
 * "essa página não existe", e o buscador via um redirecionamento no lugar de um
 * 404. A tela de 404 existia e era inalcançável.
 *
 * POR QUE SÓ O PRIMEIRO PEDAÇO DO ENDEREÇO. Comparar a rota inteira exigiria
 * repetir aqui cada segmento dinâmico (`/produtos/[id]`, `/historias/[slug]`) e
 * manter isso em dia — e o dia em que alguém esquecer, a página real vira 404.
 * O primeiro pedaço basta para o caso que importa, que é endereço digitado
 * errado, e erra para o lado seguro: `/produtos/lixo` continua seguindo o
 * caminho de sempre, e quem responde é a própria página.
 *
 * ISTO NÃO É CONTROLE DE ACESSO, e não pode ser lido como se fosse. Estar nesta
 * lista não libera nada: quem exige sessão continua exigindo, no middleware e
 * no layout. A lista só diz "esse endereço existe" — para o que não existe
 * poder ser 404 em vez de virar um desvio para o login.
 *
 * Um teste compara esta lista com os arquivos de verdade. Rota nova sem entrada
 * aqui quebra o teste, em vez de virar um 404 misterioso em produção.
 */
export const AREAS_DO_APP = [
  "admin",
  "afiliados",
  "agenda",
  "assinar",
  "auth",
  "bem-vindo",
  "cadastro",
  "clientes",
  "compras",
  "conta-excluida",
  "conta-suspensa",
  "dashboard",
  "estoque",
  "faturamento",
  "financeiro",
  "fornecedores",
  "historias",
  "legal",
  "llms.txt",
  "login",
  "manifest.webmanifest",
  "metas",
  "mimu",
  "minha-empresa",
  "obrigado",
  "onboarding",
  "produtos",
  "recuperar-senha",
  "redefinir-senha",
  "robots.txt",
  "sitemap.xml",
  "trial-vencido",
] as const;

/**
 * true quando o endereço aponta para alguma área que existe.
 *
 * A raiz (`/`) conta como existente — é a landing.
 */
export function enderecoExiste(pathname: string): boolean {
  if (pathname === "/") return true;

  // `/api/...` fica de fora de propósito: rota de API que não existe deve
  // responder o 404 do Next (sem HTML), e não a nossa página com botões.
  if (pathname.startsWith("/api/")) return true;

  const primeiro = pathname.split("/")[1] ?? "";
  return (AREAS_DO_APP as readonly string[]).includes(primeiro);
}
