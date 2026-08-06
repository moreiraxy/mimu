import { BookOpen, Brain, FileText } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";

const ITENS = [
  { icone: BookOpen, label: "Caderno de anotações" },
  { icone: Brain, label: "Memória" },
  { icone: FileText, label: "Papel e caneta" },
] as const;

export function ProblemaSection() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="text-center text-[1.375rem] font-bold leading-tight text-escuro sm:text-3xl">
          A maioria dos pequenos negócios ainda funciona assim...
        </h2>
      </SpringIn>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
        {ITENS.map((item, indice) => (
          <SpringIn key={item.label} delay={indice * 0.1}>
            <div className="flex h-full flex-row items-center gap-4 rounded-card border border-neutro-border bg-superficie p-5 text-left sm:flex-col sm:gap-3 sm:p-7 sm:text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-erro-light text-erro">
                <item.icone className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold text-escuro">{item.label}</p>
            </div>
          </SpringIn>
        ))}
      </div>
    </section>
  );
}
