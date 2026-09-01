"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "./SectionCard";
import type { Empresa } from "@/types";

/**
 * Excluir a conta, de dentro do produto.
 *
 * Mora numa seção própria, no fim da página, e não escondida dentro do cartão
 * "Conta". A diretriz 5.1.1(v) da Apple não pede só que a exclusão exista:
 * pede que ela seja fácil de encontrar, e um caminho de três toques dentro de
 * outro cartão é exatamente o que volta reprovado da revisão.
 *
 * O que a tela diz em voz alta é o que some junto. A pessoa que apaga a conta
 * aqui está apagando o histórico de faturamento do negócio dela — e ninguém
 * lê "esta ação é irreversível" com o peso que essa frase realmente tem.
 */
export function ExcluirContaSection({ empresa }: { empresa: Empresa }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // A comparação acontece de novo no servidor. Aqui ela existe só para o botão
  // ficar apagado enquanto o nome não bate: evita a viagem até o servidor para
  // ouvir um "não" que dava para saber antes.
  const podeExcluir = confirmacao.trim() === empresa.nome.trim();

  async function handleExcluir() {
    setErro(null);
    setExcluindo(true);

    const resposta = await fetch("/api/conta", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmacao }),
    }).catch(() => null);

    if (!resposta?.ok) {
      const dados = await resposta?.json().catch(() => null);
      setErro(dados?.error ?? "Não consegui excluir a conta agora. Tenta de novo.");
      setExcluindo(false);
      return;
    }

    /*
     * Sai da sessão antes de navegar.
     *
     * O usuário do auth já não existe, mas o cookie de sessão continua no
     * navegador. Sem o signOut, a próxima navegação leva um cookie que aponta
     * para ninguém, e a pessoa vê um erro em vez da tela de despedida.
     *
     * O catch existe porque a conta já foi apagada quando chegamos aqui: não
     * há mais nada a desfazer, e deixar a pessoa presa numa tela parada por
     * causa da limpeza do cookie seria o pior dos dois desfechos. O
     * middleware manda para o login na próxima navegação de qualquer forma.
     */
    await signOut().catch(() => {});
    router.push("/conta-excluida");
    router.refresh();
  }

  return (
    <SectionCard
      icone={Trash2}
      titulo="Excluir conta"
      descricao="Apaga tudo, para sempre. Não tem como voltar atrás."
    >
      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex w-full items-center justify-center gap-2 rounded-button border border-erro py-3 text-sm font-semibold text-erro-texto transition-colors hover:bg-erro-light"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.25} />
          Quero excluir minha conta
        </button>
      ) : (
        <div className="flex flex-col gap-3.5 rounded-button border border-erro bg-erro-light p-3.5">
          <div>
            <p className="text-sm font-semibold text-erro-texto">
              Isso apaga o {empresa.nome} inteiro
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-erro-texto">
              Somem todas as vendas, o histórico de faturamento, os clientes, os
              agendamentos, os produtos e as conversas com a Mimu. Nada disso
              fica guardado em lugar nenhum, e nem nós conseguimos trazer de
              volta depois.
            </p>
          </div>

          <Input
            label={`Digite ${empresa.nome} para confirmar`}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoFocus
          />

          {erro && (
            <p className="rounded-button bg-erro-light px-3 py-2 text-xs text-erro-texto">
              {erro}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={excluindo}
              onClick={() => {
                setAberto(false);
                setConfirmacao("");
                setErro(null);
              }}
            >
              Cancelar
            </Button>
            <button
              type="button"
              disabled={!podeExcluir || excluindo}
              onClick={handleExcluir}
              className="flex-1 rounded-button bg-erro py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {excluindo ? "Excluindo..." : "Excluir para sempre"}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
