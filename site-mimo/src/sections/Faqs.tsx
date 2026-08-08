import { useId, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";

/**
 * As perguntas são as que aparecem de verdade no suporte de um produto para
 * microempreendedor — preço, aprender a usar, internet, dados, cancelamento —
 * e as respostas seguem o tom que o manual define: a Mimu fala como uma amiga
 * que entende do negócio, nunca em linguagem técnica ou corporativa.
 */
const FAQS = [
  {
    q: "Preciso entender de tecnologia para usar?",
    a: "Não. Se você sabe mandar mensagem no celular, sabe usar a Mimu. É só falar com ela como fala com uma amiga: “vendi uma escova por 120”, “a Maria vem amanhã às 14h”. Ela entende, confirma e organiza. Não tem menu para decorar nem formulário para preencher.",
  },
  {
    q: "Quanto tempo leva para começar?",
    a: "Cerca de 2 minutos. Você diz o que faz — salão, mercadinho, lanchonete — e a Mimu já deixa tudo preparado do seu jeito. Dá para registrar a primeira venda no mesmo dia, sem cadastrar produto por produto antes.",
  },
  {
    q: "É de graça mesmo nos primeiros dias?",
    a: "São 7 dias grátis com tudo liberado, e não pedimos cartão de crédito para começar. Se você gostar, escolhe o plano que preferir depois. Se não gostar, é só parar de usar — não cobramos nada.",
  },
  {
    q: "E se a internet cair no meio do movimento?",
    a: "A Mimu continua funcionando. Você registra normalmente e, assim que o sinal voltar, tudo sincroniza sozinho. Nada se perde, e você não precisa lembrar de fazer nada.",
  },
  {
    q: "Dá para controlar fiado?",
    a: "Dá. A Mimu guarda quem te deve, quanto e desde quando, e te lembra antes de você esquecer. Quando a pessoa paga, é só avisar que ela dá baixa e atualiza seu caixa na hora.",
  },
  {
    q: "Ela serve para o meu tipo de negócio?",
    a: "A Mimu foi feita para o comércio de bairro: salão, barbearia, mercadinho, lanchonete, manicure, doceira, quem trabalha por conta. Se o seu dia é atender cliente e no fim ainda ter que anotar tudo, ela serve.",
  },
  {
    q: "Meus dados ficam seguros? Quem vê meu movimento?",
    a: "Só você. Seus números não são compartilhados nem vendidos, e ninguém da equipe fica olhando o seu movimento. Fazemos backup todos os dias e tratamos tudo conforme a LGPD, então se você trocar de celular, seus dados vão junto.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Pode, a qualquer momento e sem multa. Não tem fidelidade nem letra miúda. E se quiser levar seu histórico embora, você exporta tudo antes — os dados são seus.",
  },
];

export function Faqs() {
  // Single-open accordion, first item open — the state the original ships in.
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="duvidas" className="w-full bg-cream py-10 lg:py-15">
      <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
        <SectionHeading
          eyebrow="Dúvidas"
          heading={"Ficou com dúvida?\nA gente responde."}
        />

        <div className="flex w-full max-w-[800px] flex-col items-center gap-8 lg:w-[70%]">
          {FAQS.map((faq, i) => (
            <Item
              key={faq.q}
              {...faq}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Nothing in this list enters on scroll: in the original both the question and
 * the answer render at rest, and the section's only appear animation is the
 * heading. What the accordion does animate is the open/close itself, with the
 * component's own transition — `Ya = { bounce: .2, delay: 0, duration: .4,
 * type: "spring" }` next to `framer-7BY3r` in the page bundle. Solved to
 * stiffness 505.6 / damping 36.0 (mass 1, ratio 0.8) and sampled at 24 steps,
 * so the 1.5% overshoot is the spring's, not a guess.
 */
const MOTION =
  "duration-[400ms] ease-[linear(0,0.0574,0.1873,0.3435,0.4978,0.635,0.7484,0.8369,0.9025,0.9487,0.9795,0.9985,1.0091,1.0139,1.0152,1.0142,1.0123,1.0099,1.0076,1.0055,1.0038,1.0024,1.0015,1.0008,1.0003)]";

function Item({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    // No gap on the row: a closed item measures exactly 40px, and the 10px
    // that separates question from answer lives inside the collapsing panel.
    <div className="flex w-full flex-col items-start overflow-clip">
      <h3 className="w-full font-display text-base leading-[1.3] font-extrabold tracking-[-0.03em] text-ink md:text-[17px] lg:text-[22px] xl:text-[24px]">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center gap-10 text-left"
        >
          <span className="min-w-0 flex-1">{q}</span>
          <PlusIcon open={open} />
        </button>
      </h3>

      {/* 0fr -> 1fr collapses to the panel's natural height without a JS measure. */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid w-full transition-[grid-template-rows] ${MOTION}`}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="w-[90%] pt-2.5 font-display text-[15px] leading-[1.5] font-medium tracking-[-0.02em] text-muted-strong md:text-base lg:text-[17px] xl:text-lg">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 40px circle; the two 2px bars form a plus that rotates into a cross.
    Aberto, o círculo fica coral: é o item que está falando com você agora. */
function PlusIcon({ open }: { open: boolean }) {
  const bar = open ? "bg-white" : "bg-ink";

  return (
    <span
      aria-hidden="true"
      className={`relative size-10 shrink-0 overflow-hidden rounded-[100px] border transition-colors ${MOTION} ${
        open ? "border-coral bg-coral" : "border-borda bg-transparent"
      }`}
    >
      <span
        className={`absolute top-[calc(50%-7px)] left-[calc(50%-7px)] size-3.5 transition-transform ${MOTION}`}
        style={{ transform: open ? "rotate(45deg)" : "none" }}
      >
        <span
          className={`absolute inset-x-0 top-[calc(50%-1px)] h-0.5 rounded-full transition-colors ${MOTION} ${bar}`}
        />
        <span
          className={`absolute inset-y-0 left-[calc(50%-1px)] w-0.5 rounded-full transition-colors ${MOTION} ${bar}`}
        />
      </span>
    </span>
  );
}
