import { useState } from "react";
import { Link } from "react-router";
import { Parallax } from "../components/Parallax";
import { Revelar } from "../components/Revelar";

/**
 * Seção do questionário — porte 1:1 da tela `#raiox` de eventos.desenrol.ai
 * (bundle assets/index-BQAh_sVM.js). Aqui é SEÇÃO da página, sempre visível
 * ao rolar, como no original — não um modal atrás de botão.
 *
 * Estrutura e valores copiados do original:
 *   coluna esq.  olho-de-seção mono uppercase + título grande + subtítulo
 *   cartão dir.  barra de progresso no topo, "PERGUNTA 01", pergunta,
 *                "Marque só uma", opções em role="radio"
 *   opção        flex min-h-[46px] w-full items-center gap-3 rounded-2xl
 *                border px-4 py-2.5 text-left transition-colors
 *                selecionada: border-{cor} bg-{cor}/[0.06]
 *                normal:      border-{ink}/12 hover:border-{ink}/30
 *   troca de passo  enter {opacity:0, y:28, scale:.96} →
 *                   center {opacity:1, y:0, scale:1} →
 *                   exit {opacity:0, y:∓44, scale:.97, rotate:∓2.5deg}
 *
 * O original termina pedindo o WhatsApp pra alguém do time mandar o
 * resultado. A Mimu não tem esse backend nem número comercial cadastrado no
 * projeto — não inventei um. O último passo mostra um resultado calculado a
 * partir das respostas e leva pro cadastro real (/contato).
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

type Dor = {
  id: string;
  label: string;
  resultadoTitulo: string;
  resultadoTexto: string;
};

/** Cada dor é uma das falhas reais já citadas nos depoimentos. */
const DORES: Dor[] = [
  {
    id: "lucro",
    label: "Não sei se tô tendo lucro no fim do mês",
    resultadoTitulo: "Seu Raio-X: clareza de caixa",
    resultadoTexto:
      "A Mimu fecha o seu dia sozinha e te manda um resumo do que entrou e saiu — sem você abrir planilha nenhuma.",
  },
  {
    id: "fiado",
    label: "Esqueço quem me deve (fiado)",
    resultadoTitulo: "Seu Raio-X: fiado sob controle",
    resultadoTexto:
      "A Mimu lembra quem te deve antes de você esquecer, e avisa na hora certa — sem caderninho perdido.",
  },
  {
    id: "caderno",
    label: "Vivo copiando de caderno pra caderno",
    resultadoTitulo: "Seu Raio-X: sem caderno, sem planilha",
    resultadoTexto:
      "Você fala com a Mimu pelo WhatsApp que já usa, do jeito que já fala. Ela anota, organiza e não perde nada.",
  },
  {
    id: "apps",
    label: "Uso um app pra cada coisa",
    resultadoTitulo: "Seu Raio-X: tudo num lugar só",
    resultadoTexto:
      "Vendas, agenda, contas e clientes vivem no mesmo lugar. A Mimu substitui a pilha de apps que você já tem.",
  },
  {
    id: "agenda",
    label: "Perco compromisso da agenda",
    resultadoTitulo: "Seu Raio-X: agenda sem furo",
    resultadoTexto:
      "Cada cliente, cada horário — a Mimu guarda e lembra por você, direto na conversa do WhatsApp.",
  },
];

const METODOS = ["Caderno", "Planilha", "De cabeça, na memória mesmo", "Vários aplicativos"] as const;

/** Mesma lista de tipos de negócio do onboarding do app (lib/tipos-negocio.ts). */
const NEGOCIOS = ["Salão de beleza", "Barbearia", "Manicure ou autônoma", "Mercadinho", "Lanchonete", "Outro"] as const;

const TOTAL_PASSOS = 4;

export function RaioX() {
  const [passo, setPasso] = useState(0);
  const [dorId, setDorId] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<string | null>(null);
  const [negocio, setNegocio] = useState<string | null>(null);
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const [animando, setAnimando] = useState(false);

  const dorEscolhida = DORES.find((d) => d.id === dorId) ?? null;

  function irPara(novoPasso: number, dir: 1 | -1) {
    setDirecao(dir);
    setAnimando(true);
    setTimeout(() => {
      setPasso(novoPasso);
      setAnimando(false);
    }, 180);
  }

  const podeAvancar = passo === 0 ? !!dorId : passo === 1 ? !!metodo : passo === 2 ? !!negocio : true;

  return (
    <section id="raiox" className="relative w-full overflow-hidden bg-bg px-6 py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(204,255,0,0.08) 0%, rgba(204,255,0,0) 70%)" }}
      />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-12 md:flex-row md:items-center md:gap-20">
        <Parallax forca={34} padrao={1} className="w-full md:w-[380px] md:shrink-0">
          <Revelar className="flex w-full flex-col items-start gap-4">
          <p className="font-mono text-xs font-bold tracking-[0.15em] text-coral uppercase">Raio-X grátis</p>
          <h2 className="font-display text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink md:text-[48px]">
            Bora organizar seu negócio?
          </h2>
          <p className="max-w-[340px] text-base leading-[1.4] text-muted-strong md:text-lg">
            Grátis, sem compromisso, e você sai com um caminho na mão.
          </p>
          </Revelar>
        </Parallax>

        <Parallax forca={18} padrao={1} className="w-full max-w-[560px] md:flex-1">
          <Revelar atraso={180} deslocamento={24}>
          <div className="relative overflow-hidden rounded-3xl border border-borda bg-superficie p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:p-10">
            <div className="mb-8 flex gap-1.5">
              {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
                <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-borda">
                  <div
                    className="h-full rounded-full bg-coral transition-all duration-500"
                    style={{ width: i <= passo ? "100%" : "0%", opacity: i <= passo ? 1 : 0 }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                opacity: animando ? 0 : 1,
                transform: animando
                  ? `translateY(${direcao > 0 ? -44 : 44}px) scale(0.97) rotate(${direcao > 0 ? -2.5 : 2.5}deg)`
                  : "translateY(0) scale(1) rotate(0deg)",
                transition: `opacity 180ms ${EASE}, transform 180ms ${EASE}`,
              }}
            >
              {passo === 0 && (
                <Passo numero={1} pergunta="O que mais pesa no seu negócio hoje?">
                  {DORES.map((d) => (
                    <Opcao key={d.id} selecionada={dorId === d.id} onClick={() => setDorId(d.id)}>
                      {d.label}
                    </Opcao>
                  ))}
                </Passo>
              )}

              {passo === 1 && (
                <Passo numero={2} pergunta="Como você controla isso hoje?">
                  {METODOS.map((m) => (
                    <Opcao key={m} selecionada={metodo === m} onClick={() => setMetodo(m)}>
                      {m}
                    </Opcao>
                  ))}
                </Passo>
              )}

              {passo === 2 && (
                <Passo numero={3} pergunta="Qual é o seu tipo de negócio?">
                  {NEGOCIOS.map((n) => (
                    <Opcao key={n} selecionada={negocio === n} onClick={() => setNegocio(n)}>
                      {n}
                    </Opcao>
                  ))}
                </Passo>
              )}

              {passo === 3 && dorEscolhida && (
                <div className="flex flex-col items-start gap-3">
                  <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
                    Seu resultado
                  </p>
                  <h3 className="font-display text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em] text-ink">
                    {dorEscolhida.resultadoTitulo}
                  </h3>
                  <p className="text-base leading-[1.4] text-muted-strong">{dorEscolhida.resultadoTexto}</p>
                  <Link
                    to="/cadastro"
                    className="mt-4 inline-flex h-[49px] items-center gap-2 rounded-[100px] bg-coral px-6 font-display text-base font-bold text-primary-text transition-colors hover:bg-coral-hover"
                  >
                    Começar grátis
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDorId(null);
                      setMetodo(null);
                      setNegocio(null);
                      irPara(0, -1);
                    }}
                    className="mt-1 text-sm font-bold text-muted transition-colors hover:text-ink"
                  >
                    Refazer o Raio-X
                  </button>
                </div>
              )}
            </div>

            {passo < 3 && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => passo > 0 && irPara(passo - 1, -1)}
                  className={`text-sm font-bold text-muted transition-colors hover:text-ink ${passo === 0 ? "invisible" : ""}`}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!podeAvancar}
                  onClick={() => irPara(passo + 1, 1)}
                  className="inline-flex h-11 items-center rounded-[100px] bg-coral px-6 text-sm font-bold text-primary-text transition-opacity disabled:opacity-30"
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
          </Revelar>
        </Parallax>
      </div>
    </section>
  );
}

function Passo({ numero, pergunta, children }: { numero: number; pergunta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
        Pergunta {String(numero).padStart(2, "0")}
      </p>
      <h3 className="font-display text-2xl leading-[1.2] font-extrabold tracking-[-0.02em] text-ink">{pergunta}</h3>
      <p className="mt-6 mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-muted uppercase">
        Marque só uma
      </p>
      <div role="radiogroup" aria-label={pergunta} className="flex w-full flex-col gap-2.5">
        {children}
      </div>
    </div>
  );
}

function Opcao({
  selecionada,
  onClick,
  children,
}: {
  selecionada: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionada}
      onClick={onClick}
      className={`flex min-h-[46px] w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left text-[15px] font-medium transition-colors ${
        selecionada ? "border-coral bg-coral/[0.06] text-ink" : "border-white/12 text-ink hover:border-white/30"
      }`}
    >
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selecionada ? "border-coral" : "border-white/20"
        }`}
      >
        {selecionada && <span className="size-2 rounded-full bg-coral" />}
      </span>
      {children}
    </button>
  );
}
