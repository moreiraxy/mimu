"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Fingerprint,
  ArrowLeft,
  Headphones,
  KeyRound,
  LogOut,
  Megaphone,
  Pencil,
  Settings2,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Grupo, Linha, TituloGrupo } from "@/components/perfil/Linhas";
import { MarcaTraco } from "@/components/Logo";
import { ehPlanoGratuito } from "@/lib/planos";
import { linkWhatsApp } from "@/lib/contato";
import { CartoesDaConta } from "./CartoesDaConta";

/**
 * O perfil: a porta de entrada de tudo que é sobre a CONTA, e não sobre o
 * negócio do dia a dia.
 *
 * Antes isto era uma página só com nove seções abertas empilhadas — dados,
 * categorias, meta, módulos, preferências, WhatsApp, plano, conta e excluir
 * conta, todas ao mesmo tempo. Achar "alterar senha" ali era rolar por tudo
 * o que não se procurava, e cada rolagem passava por um botão de excluir a
 * conta.
 *
 * Agora é uma lista: cada função tem a sua tela, e esta aqui só diz quais
 * existem. É o formato de ajustes que todo app de celular usa, e a razão é
 * sempre a mesma — a pessoa chega aqui procurando UMA coisa.
 */
export default function PerfilPage() {
  const { user, empresa, plano, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading || !empresa) {
    return (
      <div className="flex flex-col gap-4 lg:mx-auto lg:max-w-2xl">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  const gratuito = ehPlanoGratuito(plano);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      {/* O botão de voltar em vidro no alto à esquerda, como na referência.
          O perfil é alcançável pela barra de baixo E pelo retrato da home —
          quem chega pelo retrato precisa do caminho de volta. */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Voltar"
        className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
      >
        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      <header className="flex flex-col items-center gap-3 pb-6 pt-4">
        <Link
          href="/minha-empresa/negocio"
          aria-label="Editar o perfil do negócio"
          className="relative"
        >
          {empresa.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={empresa.logo_url}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Avatar nome={empresa.nome} size="xl" />
          )}
          {/* O lápis não é decoração: sem ele, a foto redonda parece só um
              enfeite e ninguém descobre que dá pra trocar. */}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-fundo bg-superficie text-neutro-muted-strong">
            <Pencil className="h-[14px] w-[14px]" strokeWidth={2.25} />
          </span>
        </Link>

        <div className="text-center">
          <h1 className="text-xl font-semibold text-escuro">{empresa.nome}</h1>
          <p className="mt-0.5 text-[13px] text-neutro-muted">{user?.email}</p>
        </div>
      </header>

      {/*
        O convite para o Pro fica aqui, e é um convite.
        A referência não bloqueia nada nem pergunta de novo a cada tela: o
        anúncio existe uma vez, num lugar onde quem quiser olhar olha. Some de
        vez quando a conta já é paga — continuar oferecendo o que a pessoa já
        comprou é o jeito mais rápido de fazer um app parecer que não sabe
        quem ela é.
      */}
      {gratuito && (
        <Link
          href="/minha-empresa/assinatura"
          /*
            Escuro nos DOIS temas, com cor escrita à mão.
            `bg-escuro` parecia certo e fazia o contrário: `--escuro` é o token
            do TEXTO principal, então ele vira branco no tema escuro — e o
            convite para assinar aparecia como um bloco branco de tela cheia no
            meio de um app preto. Um anúncio é um objeto, não um tema: ele é
            preto com a marca em néon aqui e no tema claro, onde inclusive
            ganha mais destaque.
            O anel de néon é o que o separa do fundo #0A0A0A no escuro, onde
            preto sobre preto desapareceria.
          */
          className="relative flex items-center gap-4 overflow-hidden rounded-card bg-[#111111] p-5 ring-1 ring-primary/30"
        >
          <div className="relative z-10 flex-1">
            <p className="text-xl font-extrabold leading-none tracking-tight text-primary">
              SEJA PRO
            </p>
            <p className="mt-1.5 max-w-[210px] text-[13px] leading-snug text-white/70">
              Para conversar mais com a Mimu e liberar agenda, clientes e
              estoque.
            </p>
          </div>
          <MarcaTraco
            size={72}
            className="relative z-10 flex-shrink-0 text-primary opacity-90"
          />
          {/* O brilho atrás da marca. Decorativo, e por isso fora do fluxo:
              não muda a altura do cartão nem entra na ordem de leitura. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl"
          />
        </Link>
      )}

      {/* Os dois cartões da referência: um diz o que a conta É, o outro diz
          quanto ela ainda tem. Lado a lado porque é a mesma pergunta vista de
          dois ângulos — e é assim que o teto do plano deixa de ser surpresa. */}
      <CartoesDaConta plano={plano} />

      <div className="mt-4">
        <Grupo>
          <Linha icone={Star} label="Avalie a Mimu" href="/minha-empresa/avaliar" />
        </Grupo>
      </div>

      <TituloGrupo>Geral</TituloGrupo>
      <Grupo>
        <Linha icone={UserRound} label="Perfil" href="/minha-empresa/negocio" />
        <Linha
          icone={Settings2}
          label="Preferências"
          href="/minha-empresa/preferencias"
        />
        <Linha
          icone={CreditCard}
          label="Assinatura"
          href="/minha-empresa/assinatura"
        />
        <Linha
          icone={Sparkles}
          label="Mimu no WhatsApp"
          href="/minha-empresa/whatsapp"
        />
      </Grupo>

      <TituloGrupo>Segurança</TituloGrupo>
      <Grupo>
        <Linha icone={KeyRound} label="Alterar senha" href="/minha-empresa/senha" />
        <Linha
          icone={Fingerprint}
          label="Biometria"
          href="/minha-empresa/biometria"
        />
        {/*
          Reportar um problema vai DIRETO para o WhatsApp, sem formulário no
          meio. Quem toca aqui está com algo quebrado na mão; um formulário
          que some depois de enviado não devolve nem a confirmação de que
          alguém leu. No WhatsApp fica a conversa, dos dois lados.
        */}
        <Linha
          icone={Megaphone}
          label="Reportar um problema"
          externo={linkWhatsApp(
            "Oi! Encontrei um problema no app da Mimu:\n\n(conta aqui o que aconteceu)",
          )}
        />
      </Grupo>

      <TituloGrupo>Suporte</TituloGrupo>
      <Grupo>
        <Linha
          icone={Headphones}
          label="Falar com suporte"
          externo={linkWhatsApp("Oi! Preciso de ajuda com a Mimu.")}
        />
      </Grupo>

      <div className="mt-8">
        <Grupo>
          <Linha
            icone={LogOut}
            label="Sair"
            perigo
            aoTocar={async () => {
              await signOut();
              router.push("/login");
              router.refresh();
            }}
          />
        </Grupo>
      </div>

      {/*
        A versão fica visível de propósito. É o primeiro dado que o suporte
        pede, e sem ela a conversa começa com "qual versão você está usando?"
        — pergunta que ninguém sabe responder.
      */}
      <p className="py-8 text-center text-xs text-neutro-muted">
        v{process.env.NEXT_PUBLIC_VERSAO}
      </p>
    </div>
  );
}
