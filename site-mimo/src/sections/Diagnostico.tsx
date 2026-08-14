import { useState } from "react";
import { Link } from "react-router";
import { Revelar } from "../components/Revelar";

/**
 * Seção do questionário. "Raio-X" era o nome do template de origem e não
 * dizia nada para quem lê: aqui é um diagnóstico do negócio.
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
 * O último passo mostra o resultado calculado a partir das respostas e oferece
 * dois caminhos: criar a conta na hora, ou continuar no WhatsApp levando o
 * diagnóstico já escrito na mensagem, para quem prefere falar com gente antes
 * de se cadastrar.
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
    resultadoTitulo: "Seu diagnóstico: clareza de caixa",
    resultadoTexto:
      "A Mimu fecha o seu dia sozinha e te manda um resumo do que entrou e saiu, sem você abrir planilha nenhuma.",
  },
  {
    id: "fiado",
    label: "Esqueço quem me deve (fiado)",
    resultadoTitulo: "Seu diagnóstico: fiado sob controle",
    resultadoTexto:
      "A Mimu lembra quem te deve antes de você esquecer, e avisa na hora certa. Sem caderninho perdido.",
  },
  {
    id: "caderno",
    label: "Vivo copiando de caderno pra caderno",
    resultadoTitulo: "Seu diagnóstico: sem caderno, sem planilha",
    resultadoTexto:
      "Você fala com a Mimu pelo WhatsApp que já usa, do jeito que já fala. Ela anota, organiza e não perde nada.",
  },
  {
    id: "apps",
    label: "Uso um app pra cada coisa",
    resultadoTitulo: "Seu diagnóstico: tudo num lugar só",
    resultadoTexto:
      "Vendas, agenda, contas e clientes vivem no mesmo lugar. A Mimu substitui a pilha de apps que você já tem.",
  },
  {
    id: "agenda",
    label: "Perco compromisso da agenda",
    resultadoTitulo: "Seu diagnóstico: agenda sem furo",
    resultadoTexto:
      "Cada cliente, cada horário: a Mimu guarda e lembra por você, direto na conversa do WhatsApp.",
  },
];

const METODOS = ["Caderno", "Planilha", "De cabeça, na memória mesmo", "Vários aplicativos"] as const;

/** Mesma lista de tipos de negócio do onboarding do app (lib/tipos-negocio.ts). */
const NEGOCIOS = ["Salão de beleza", "Barbearia", "Manicure ou autônoma", "Mercadinho", "Lanchonete", "Outro"] as const;

const TOTAL_PASSOS = 4;

const WHATSAPP_MIMU = "5511920924833";

/**
 * Monta o link do WhatsApp já com o diagnóstico escrito.
 *
 * O texto vai pronto de propósito: quem chega aqui acabou de responder três
 * perguntas, e pedir para digitar tudo de novo é o jeito mais fácil de perder
 * a pessoa. Do outro lado, a conversa já começa sabendo o que ela faz, o que
 * dói e como ela se organiza hoje.
 */
function linkWhatsApp(dor: Dor, metodo: string | null, negocio: string | null) {
  const linhas = [
    `Oi! Acabei de fazer o diagnóstico no site da Mimu.`,
    ``,
    `Resultado: ${dor.resultadoTitulo.replace("Seu diagnóstico: ", "")}`,
    negocio ? `Meu negócio: ${negocio}` : null,
    `Minha maior dificuldade: ${dor.label}`,
    metodo ? `Hoje eu me organizo assim: ${metodo}` : null,
    ``,
    `Queria entender como a Mimu me ajuda nisso.`,
  ].filter((linha) => linha !== null);

  return `https://wa.me/${WHATSAPP_MIMU}?text=${encodeURIComponent(linhas.join("\n"))}`;
}

export function Diagnostico() {
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
    <section id="diagnostico" className="relative w-full overflow-hidden bg-bg px-6 py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(204,255,0,0.08) 0%, rgba(204,255,0,0) 70%)" }}
      />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-12 md:flex-row md:items-center md:gap-20">
        <div className="w-full md:w-[380px] md:shrink-0">
          <Revelar className="flex w-full flex-col items-start gap-4">
          <p className="font-mono text-xs font-bold tracking-[0.15em] text-coral uppercase">Diagnóstico grátis</p>
          <h2 className="font-display text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink md:text-[48px]">
            Bora organizar seu negócio?
          </h2>
          <p className="max-w-[340px] text-base leading-[1.4] text-muted-strong md:text-lg">
            Grátis, sem compromisso, e você sai com um caminho na mão.
          </p>
          </Revelar>
        </div>

        <div className="w-full max-w-[560px] md:flex-1">
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
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      to="/cadastro"
                      className="inline-flex h-[49px] items-center justify-center gap-2 rounded-[100px] bg-coral px-6 font-display text-base font-bold text-primary-text transition-colors hover:bg-coral-hover"
                    >
                      Começar grátis
                    </Link>
                    <a
                      href={linkWhatsApp(dorEscolhida, metodo, negocio)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-[49px] items-center justify-center gap-2 rounded-[100px] border border-ink/25 px-6 font-display text-base font-bold text-ink transition-colors hover:border-ink/50"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[18px]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.4"/>
                      </svg>
                      Falar no WhatsApp
                    </a>
                  </div>
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
                    Refazer o diagnóstico
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
        </div>
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
