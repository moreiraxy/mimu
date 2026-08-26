import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, LogIn, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { linkWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Pagamento confirmado",
  // Não faz sentido no buscador: só existe como destino de quem acabou de
  // pagar, e indexar isso poria a página no Google sem contexto nenhum.
  robots: { index: false, follow: false },
};

/**
 * Onde a Cakto larga quem acabou de pagar.
 *
 * Quem compra por um link compartilhado nunca passou pelo mimu.app: não tem
 * conta, não tem senha. Sem esta tela a pessoa cai na página padrão da Cakto
 * dizendo "compra aprovada" e fica sem saber como entrar no que comprou.
 *
 * A página não depende de NENHUM parâmetro na URL e não consulta o banco. Não
 * sabemos o que a Cakto anexa no redirect, e a liberação pode não ter
 * acontecido ainda — dizer "não achei sua compra" para quem acabou de pagar
 * seria pior que não dizer nada.
 *
 * O TEXTO AQUI PROMETE SÓ O QUE ACONTECE DE VERDADE.
 *
 * A versão anterior dizia "enviamos um e-mail" e "seu acesso já está
 * liberado". Nenhuma das duas era verdade: o webhook da Cakto ainda não
 * existe, então hoje a liberação é feita à mão pelo painel, e o e-mail sai
 * nesse momento — não no instante em que a pessoa vê esta tela. Prometer
 * automático numa tela de pós-pagamento é o pior lugar possível para
 * prometer errado: a pessoa já pagou e fica esperando.
 *
 * Por isso o tempo verbal é futuro ("vai receber"), não há promessa de prazo,
 * e o WhatsApp deixou de ser um link discreto no rodapé para virar a saída
 * principal — é o caminho que funciona na hora, em qualquer cenário.
 */
export default function ObrigadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-verde-light text-verde-dark">
        <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Pagamento confirmado.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        Agora é com a gente. Você vai receber um e-mail com o caminho para
        entrar.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 text-left">
        <div className="rounded-card border border-neutro-border bg-superficie p-5">
          <span className="flex items-center gap-2 text-sm font-bold text-escuro">
            <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
            É sua primeira vez na Mimu
          </span>
          <p className="mt-2 text-sm leading-relaxed text-neutro-muted">
            Assim que confirmarmos sua compra, chega um e-mail no endereço que
            você usou no pagamento, com o link para criar sua senha. Se não
            achar, confira o spam e a lixeira.
          </p>
        </div>

        <div className="rounded-card border border-neutro-border bg-superficie p-5">
          <span className="flex items-center gap-2 text-sm font-bold text-escuro">
            <LogIn className="h-4 w-4 shrink-0" strokeWidth={2} />
            Você já usava a Mimu
          </span>
          <p className="mt-2 text-sm leading-relaxed text-neutro-muted">
            Seu acesso volta na mesma conta, com a senha de sempre. Seus dados
            continuam onde estavam.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm font-bold text-primary-forte underline underline-offset-4"
          >
            Entrar na minha conta
          </Link>
        </div>
      </div>

      {/*
        Saída principal, e não um link de rodapé: enquanto a liberação depende
        de alguém olhar o painel, o WhatsApp é o único caminho que resolve na
        hora. Quem acabou de pagar e não consegue entrar não pode ter que
        procurar como falar com a gente.
      */}
      <a
        href={linkWhatsApp(
          "Oi! Acabei de comprar a Mimu e queria ajuda para entrar na minha conta.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-button bg-primary py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        Demorou? Chama a gente no WhatsApp
      </a>
    </div>
  );
}
