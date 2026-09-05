"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, MoreHorizontal } from "lucide-react";
import { dividirNavegacao } from "@/components/dashboard/navItems";
import { MenuLateral } from "@/components/dashboard/MenuLateral";
import { FolhaAcoes } from "@/components/dashboard/FolhaAcoes";
import {
  acoesLiberadas,
  ROTAS_SEM_ACOES,
} from "@/components/dashboard/acoesRapidas";
import { MarcaTraco } from "@/components/Logo";
import { PlusIcon } from "@/components/icons/NavIcons";
import { useAuth } from "@/hooks/useAuth";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { cn } from "@/lib/utils";

/**
 * Quantos destinos cabem na barra ao lado do "+" e do botão da marca.
 *
 * Três, e não os quatro de antes, porque o botão da Mimu agora ocupa uma ilha
 * própria à direita: o que sobra de largura é menor. Espremer os quatro ali
 * devolveria o alvo de toque de 40px que a barra anterior já tinha corrigido.
 */
const DESTINOS_NA_BARRA = 3;

/** A partir de onde a barra recolhe. Curto o bastante pra reagir ao primeiro gesto. */
const LIMIAR_ROLAGEM = 56;

export function BottomNav({
  admin = false,
  modulosIniciais,
}: {
  admin?: boolean;
  /**
   * Módulos vindos do servidor, que já tinha a empresa em mãos.
   *
   * Sem isto a barra nascia com a lista vazia e só se completava depois que o
   * AuthProvider terminava de buscar a empresa no navegador — era o "só
   * aparece na segunda visita".
   */
  modulosIniciais?: string[];
}) {
  const pathname = usePathname();
  const { modulos: modulosDoCliente } = useAuth();
  // A barra não existe no chat. Ver `naConversa`, logo abaixo do hook de rolagem.
  const { alertas } = useAlertasProativos();
  const [menuAberto, setMenuAberto] = useState(false);
  const [acoesAbertas, setAcoesAbertas] = useState(false);

  /*
   * O destino que a pessoa ACABOU de tocar, antes de o endereço mudar.
   *
   * Medido num celular médio, entre o toque e a troca de `pathname` passam de
   * 300 a 460ms — a thread principal está ocupada montando a tela nova. Nesse
   * intervalo a barra continuava mostrando a aba ANTERIOR acesa, ou seja: a
   * pessoa toca, e por meio segundo a tela responde "não, você está aqui
   * ainda". Não existe conclusão possível além de "não pegou", e ela toca de
   * novo.
   *
   * Acender na hora não deixa a navegação mais rápida; deixa ela HONESTA — o
   * app diz "ouvi" no instante do toque, que é a única coisa que ele sabe
   * naquele momento.
   */
  const [tocado, setTocado] = useState<string | null>(null);

  // Quando o endereço finalmente muda, quem manda volta a ser ele.
  useEffect(() => {
    setTocado(null);
  }, [pathname]);

  /**
   * A barra recolhida: o estado da segunda foto da referência.
   *
   * Aberta, ela mostra os destinos e a pílula "Pergunte à Mimu" flutua ACIMA
   * dela. Recolhida, os destinos somem, sobra o ícone da página atual à
   * esquerda e a pílula desce PARA DENTRO da barra, no meio. O botão da marca
   * fica onde está nos dois estados — é a única coisa da barra que nunca se
   * move, e é por isso que ele funciona como âncora.
   */
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    let anterior = window.scrollY;

    const aoRolar = () => {
      const atual = window.scrollY;
      // O limiar de 8px evita que o tranco de um toque faça a barra piscar
      // entre os dois estados.
      if (Math.abs(atual - anterior) <= 8) return;
      const desceu = atual > anterior;
      anterior = atual;
      // Perto do topo ela nunca fica recolhida: ali não há espaço a ganhar, e
      // a barra menor pareceria um defeito em vez de uma resposta ao gesto.
      setRecolhida(desceu && atual > LIMIAR_ROLAGEM);
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Trocar de página devolve a barra inteira: a tela nova começa no topo, e
  // uma barra recolhida ali não corresponde a gesto nenhum que a pessoa fez.
  useEffect(() => {
    setRecolhida(false);
  }, [pathname]);

  // O do cliente só entra quando existir: ele é a fonte para mudanças feitas
  // durante a sessão (ligar um módulo em Minha Empresa reflete na hora), mas
  // o do servidor é quem faz a primeira pintura já estar certa.
  const modulos =
    modulosDoCliente.length > 0 ? modulosDoCliente : (modulosIniciais ?? []);

  const { barra: barraCompleta, menu, temMais } = dividirNavegacao(modulos);

  /*
   * A Mimu sai da fileira de destinos.
   *
   * Ela não sumiu: virou o botão da marca, à direita, que é a decisão central
   * desta barra — na referência a IA não é "mais um ícone de robô no meio dos
   * outros", é a marca, sempre no mesmo canto. Deixar o item aqui TAMBÉM
   * daria duas portas para o mesmo chat lado a lado na mesma barra.
   */
  const destinos = barraCompleta
    .filter((item) => item.href !== "/mimu")
    .slice(0, DESTINOS_NA_BARRA);

  /*
   * O menu mostra só o que NÃO está na barra.
   *
   * Ele listava tudo — Home, Financeiro, Agenda, Mimu, Perfil — inclusive os
   * destinos que estavam ali do lado, na própria barra que abriu o menu. Era o
   * mapa completo do app, e a ideia tinha lógica: ninguém precisa lembrar se um
   * item está na barra ou escondido.
   *
   * Só que na prática produz o contrário. A pessoa abre "Mais" procurando o que
   * não estava visível, e encontra primeiro as mesmas quatro coisas que acabou
   * de ver. O menu vira uma segunda cópia da barra, e o que ele existe para
   * revelar fica no fim da lista.
   *
   * A Mimu sai por um motivo a mais: ela tem porta fixa e própria, o botão da
   * marca no canto da barra, presente em toda tela.
   */
  const escondidos = menu.filter(
    (item) => item.href !== "/mimu" && !destinos.includes(item),
  );
  const mostrarMais = temMais || escondidos.length > 0 || admin;

  const temAcoes =
    acoesLiberadas(modulos).length > 0 && !ROTAS_SEM_ACOES.includes(pathname);

  // Fica aceso quando a página atual mora dentro do menu: sem isso, ao abrir
  // /produtos a barra inteira apaga e some a noção de onde você está.
  const atualEstaNoMenu =
    !destinos.some((item) => item.href === pathname) &&
    (menu.some((item) => item.href === pathname) || pathname === "/admin");

  /*
   * O ícone que representa a página atual quando a barra está recolhida.
   *
   * Casa por prefixo, e não por igualdade: dentro de /financeiro/nova-entrada
   * a página ainda é o Financeiro, e mostrar a casinha ali diria à pessoa que
   * ela está num lugar onde não está. Sem nenhuma correspondência, a casinha é
   * o palpite honesto — é a raiz do app.
   */
  const paginaAtual =
    menu.find((item) => item.href === pathname) ??
    menu.find(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
    ) ??
    menu[0];

  /*
   * NO CHAT DA MIMU A BARRA NÃO EXISTE.
   *
   * Hoje isto é decisão de interface: conversar é a tela inteira, e com o
   * teclado aberto uma barra flutuando no meio da conversa é o que mais rouba
   * altura.
   *
   * Nasceu, porém, como conserto de um defeito — o chat pedia `z-50` de dentro
   * do contexto de empilhamento criado pelo `z-[1]` do layout, e a barra
   * passava por cima dele. Aquele contexto não existe mais (o fundo desceu
   * para `-z-10`), então esta linha virou o que ela deveria ter sido desde o
   * começo: uma escolha, e não um remendo.
   */
  if (pathname === "/mimu") return null;

  return (
    <>
      {/* A barra flutua: descolada das bordas, cantos totalmente redondos e
          sombra, em vez de colada no fim da tela. A margem de baixo soma o
          safe-area do iPhone, senão ela encosta no indicador de gestos. */}
      <div
        className="fixed inset-x-0 z-40 px-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto flex max-w-[430px] flex-col items-stretch gap-2.5">
          {/* A pílula ACIMA da barra — o estado da primeira foto. Ela não é
              removida do DOM ao recolher: some encolhendo a própria altura,
              e é isso que faz a barra parecer engolir a pílula em vez de a
              pílula piscar e reaparecer noutro lugar. */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none",
              recolhida
                ? "pointer-events-none h-0 translate-y-3 opacity-0"
                : "h-[52px] translate-y-0 opacity-100",
            )}
          >
            <PilulaMimu alertas={alertas.length} />
          </div>

          <div className="flex items-stretch gap-2.5">
            <nav
              aria-label="Navegação principal"
              className={cn(
                "vidro relative h-[64px] flex-1 overflow-hidden rounded-full",
                "shadow-[0_10px_36px_-10px_rgba(0,0,0,0.45)]",
              )}
            >
              {/* As duas caras da barra vivem empilhadas e trocam por
                  opacidade. Trocar por remoção faria o conteúdo pular de
                  largura no meio da transição. */}
              <div
                aria-hidden={recolhida}
                className={cn(
                  "absolute inset-0 flex items-stretch justify-around px-1",
                  "transition-opacity duration-200 ease-out motion-reduce:transition-none",
                  recolhida ? "pointer-events-none opacity-0" : "opacity-100",
                )}
              >
                {destinos.map(({ href, label, Icon }) => {
                  // `tocado` vence enquanto o endereço não alcança. Ver o
                  // comentário na declaração dele.
                  const ativo = tocado ? tocado === href : pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-label={label}
                      aria-current={ativo ? "page" : undefined}
                      onClick={() => setTocado(href)}
                      className="flex flex-1 items-center justify-center"
                    >
                      <span
                        className={cn(
                          "flex h-[42px] w-full max-w-[64px] items-center justify-center rounded-full",
                          "transition-colors duration-200 motion-reduce:transition-none",
                          ativo ? "bg-primary-light" : "bg-transparent",
                        )}
                      >
                        <Icon
                          size={23}
                          className={
                            ativo ? "text-primary-forte" : "text-neutro-icon"
                          }
                        />
                      </span>
                    </Link>
                  );
                })}

                {temAcoes && (
                  <button
                    type="button"
                    onClick={() => setAcoesAbertas(true)}
                    aria-label="Nova ação"
                    aria-haspopup="dialog"
                    className="flex flex-1 items-center justify-center"
                  >
                    <span className="flex h-[42px] w-full max-w-[64px] items-center justify-center rounded-full text-neutro-icon">
                      <PlusIcon size={24} />
                    </span>
                  </button>
                )}

                {mostrarMais && (
                  <button
                    type="button"
                    onClick={() => setMenuAberto(true)}
                    aria-label="Abrir menu"
                    aria-haspopup="dialog"
                    aria-expanded={menuAberto}
                    className="flex flex-1 items-center justify-center"
                  >
                    <span
                      className={cn(
                        "flex h-[42px] w-full max-w-[64px] items-center justify-center rounded-full",
                        atualEstaNoMenu ? "bg-primary/20" : "bg-transparent",
                      )}
                    >
                      <MoreHorizontal
                        size={23}
                        className={
                          atualEstaNoMenu
                            ? "text-primary-forte"
                            : "text-neutro-icon"
                        }
                      />
                    </span>
                  </button>
                )}
              </div>

              {/* Recolhida: ícone da página à esquerda, pílula da Mimu no
                  resto. */}
              <div
                aria-hidden={!recolhida}
                className={cn(
                  "absolute inset-0 flex items-center gap-1 py-[11px] pl-1 pr-2",
                  "transition-opacity duration-200 ease-out motion-reduce:transition-none",
                  recolhida ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <button
                  type="button"
                  onClick={() => setRecolhida(false)}
                  aria-label={`${paginaAtual?.label ?? "Página atual"} — abrir navegação`}
                  className="flex h-[42px] w-[58px] flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-forte"
                >
                  {paginaAtual ? <paginaAtual.Icon size={23} /> : null}
                </button>
                <PilulaMimu alertas={alertas.length} compacta />
              </div>
            </nav>

            <BotaoMimu alertas={alertas.length} />
          </div>
        </div>
      </div>

      <MenuLateral
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        itens={escondidos}
        admin={admin}
        alertas={alertas.length}
      />

      <FolhaAcoes
        aberta={acoesAbertas}
        aoFechar={() => setAcoesAbertas(false)}
        modulos={modulos}
      />
    </>
  );
}

/**
 * "Pergunte à Mimu": um campo de verdade, e não um link para um campo.
 *
 * Era um <Link> que abria o chat vazio. A diferença parece pequena e não é:
 * quem toca ali JÁ TEM a pergunta na cabeça, e a versão antiga pedia para ela
 * abrir uma tela, achar o campo, e só então escrever. Agora escreve na hora, e
 * a conversa abre com a mensagem já enviada — quem recebe e dispara é o efeito
 * de app/(dashboard)/mimu/page.tsx, pela URL.
 *
 * A mesma barra serve nos dois lugares (flutuando acima e encaixada dentro)
 * porque é a MESMA coisa noutro lugar. Dois componentes pareceriam iguais até
 * o dia em que alguém mudasse um só.
 */
function PilulaMimu({
  alertas,
  compacta = false,
}: {
  alertas: number;
  compacta?: boolean;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const pergunta = texto.trim();
    // Sem texto, o toque vale como "abrir a conversa" — que é o que a barra
    // fazia antes e continua sendo o esperado de quem só quer olhar o chat.
    router.push(pergunta ? `/mimu?q=${encodeURIComponent(pergunta)}` : "/mimu");
    setTexto("");
  }

  return (
    <form
      onSubmit={enviar}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-full",
        compacta
          ? "h-full min-w-0 px-3"
          : "vidro h-[52px] px-4 shadow-[0_10px_36px_-14px_rgba(0,0,0,0.45)]",
      )}
    >
      {/*
        A marca aqui dentro é uma PORTA, não um enfeite.

        Quando a barra virou campo de digitação, ela deixou de ser um link e a
        marca virou um ícone morto: quem tocasse nela só ganhava o cursor
        piscando no campo. Sendo a marca da Mimu, o toque tem que abrir a
        conversa — é o mesmo gesto do botão redondo lá do canto, e não faz
        sentido a mesma marca levar a lugares diferentes na mesma barra.
      */}
      <Link
        href="/mimu"
        aria-label="Abrir a conversa com a Mimu"
        className="flex flex-shrink-0 items-center text-primary-forte"
      >
        <MarcaTraco size={19} />
      </Link>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pergunte à Mimu"
        aria-label="Pergunte à Mimu"
        enterKeyHint="send"
        className="min-w-0 flex-1 bg-transparent text-base text-escuro outline-none placeholder:text-neutro-muted"
      />
      {texto.trim() ? (
        <button
          type="submit"
          aria-label="Enviar para a Mimu"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-text"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : (
        alertas > 0 && (
          <Link
            href="/mimu"
            aria-label={`${alertas} avisos da Mimu`}
            className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold leading-none text-white"
          >
            {alertas > 9 ? "9+" : alertas}
          </Link>
        )
      )}
    </form>
  );
}

/**
 * O botão da marca — a porta da Mimu, sempre no mesmo canto.
 *
 * Na referência, a IA não é retratada como IA: é a marca. É uma decisão de
 * produto antes de ser de layout, e é o motivo de este botão não ter rótulo,
 * não entrar na fileira de destinos e não se mexer quando a barra recolhe. A
 * pessoa aprende o canto uma vez.
 */
function BotaoMimu({ alertas }: { alertas: number }) {
  return (
    <Link
      href="/mimu"
      aria-label="Falar com a Mimu"
      className={cn(
        "vidro relative flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center rounded-[24px]",
        "text-primary-forte shadow-[0_10px_36px_-10px_rgba(0,0,0,0.45)]",
        "transition-transform duration-150 active:scale-95 motion-reduce:transition-none",
      )}
    >
      <MarcaTraco size={30} />
      {alertas > 0 && (
        <span className="absolute right-2 top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold leading-none text-white">
          {alertas > 9 ? "9+" : alertas}
        </span>
      )}
    </Link>
  );
}
