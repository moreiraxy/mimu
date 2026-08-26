import Link from "next/link";
import { Compass, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { linkWhatsApp } from "@/lib/contato";

/**
 * Página não encontrada.
 *
 * Não existia, então qualquer endereço errado caía na tela padrão do Next:
 * "404 — This page could not be found", em inglês, num site inteiro em
 * português, sem marca e sem nenhuma saída.
 *
 * Ficou alcançável a partir da landing quando cada rota dela passou a ter o
 * próprio arquivo: antes, /historias/qualquer-coisa caía no HTML da SPA e o
 * React mandava a pessoa de volta para a lista. Aquilo era um 200 disfarçado —
 * cômodo para quem navega, ruim para busca, porque o Google indexa endereço
 * inventado como se fosse página de verdade. Agora o endereço errado é 404 de
 * verdade, e esta tela é o que a pessoa vê.
 */
export default function NaoEncontrada() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary-forte ring-1 ring-neutro-border">
        <Compass className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Essa página não existe.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        O endereço pode ter mudado de lugar, ou o link veio quebrado. Nada de
        errado com a sua conta.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-button bg-primary px-4 py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
        >
          Ir para o início
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-button border border-neutro-border bg-superficie px-4 py-3.5 text-sm font-semibold text-escuro transition-colors hover:bg-fundo"
        >
          Entrar na minha conta
        </Link>
      </div>

      <a
        href={linkWhatsApp("Oi! Cliquei num link da Mimu e caiu numa página que não existe.")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-forte underline underline-offset-4"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        Falar com a gente
      </a>
    </div>
  );
}
