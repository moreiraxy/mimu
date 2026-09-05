"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { useMemo, useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchIcon } from "@/components/icons/NavIcons";
import { cn } from "@/lib/utils";
import { ClienteListItem } from "./ClienteListItem";

const FILTROS = ["Todos", "Clientes Fiéis", "Com fiado"] as const;
type Filtro = (typeof FILTROS)[number];

export default function ClientesPage() {
  const { clientes, loading, error, refetch } = useClientes();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const filtrados = useMemo(() => {
    let resultado = clientes;

    if (filtro === "Clientes Fiéis") {
      resultado = resultado.filter((c) => c.cliente_fiel);
    } else if (filtro === "Com fiado") {
      resultado = resultado.filter((c) => Number(c.saldo_fiado) > 0);
    }

    const termo = busca.trim().toLowerCase();
    if (termo) {
      const termoDigitos = termo.replace(/\D/g, "");
      resultado = resultado.filter((c) => {
        const nomeCombina = c.nome.toLowerCase().includes(termo);
        const telefoneCombina =
          termoDigitos.length > 0 &&
          (c.telefone?.replace(/\D/g, "") ?? "").includes(termoDigitos);
        return nomeCombina || telefoneCombina;
      });
    }

    return resultado;
  }, [clientes, filtro, busca]);

  /*
   * O esqueleto cobre A LISTA, e não a tela.
   *
   * Era um `return <ClientesSkeleton />` aqui, que virava cinza também o
   * título, o campo de busca e os chips de filtro — nenhum dos três vem do
   * banco. Pior: o campo e os chips ficavam INERTES enquanto isso, então quem
   * abria a tela para procurar um nome tinha de esperar a lista inteira
   * chegar antes de poder digitar.
   *
   * Ver o mesmo raciocínio em dashboard/page.tsx.
   */

  /*
   * O cabeçalho envolve TODOS os estados, e não só o da lista cheia.
   *
   * Erro e lista vazia eram `return` antecipados sem título nenhum: a tela
   * abria com uma frase solta no meio do nada e a pessoa não tinha como saber
   * onde estava. É justamente no estado vazio que saber onde se está mais
   * importa, porque não há conteúdo para deduzir.
   */
  if (error) {
    return (
      <div>
        <PageHeader title="Clientes" voltar={false} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-semibold text-primary-forte"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div>
        <PageHeader title="Clientes" voltar={false} />
        <div className="vidro-card flex flex-col items-center gap-2 rounded-[20px] px-5 py-10 text-center">
          <p className="text-sm text-neutro-muted">
            Sua lista de clientes está vazia.
          </p>
          <Link
            href="/clientes/novo"
            className="text-sm font-semibold text-primary-forte"
          >
            Adicione seu primeiro cliente →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:max-w-5xl">
      {/* SEM <FadeIn> AQUI: a transição de opacidade faz do elemento um
          "backdrop root" enquanto roda, e todo o vidro de dentro perde o
          desfoque por 150ms a cada navegação — a tela entra chapada e só
          então vira vidro. É o mesmo motivo comentado em dashboard/page.tsx. */}
      <PageHeader title="Clientes" voltar={false} />
      <div className="vidro-card flex items-center gap-2 rounded-button px-3.5 py-2.5">
        <SearchIcon size={16} className="text-neutro-muted" />
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-transparent text-base text-escuro outline-none placeholder:text-neutro-muted md:text-sm"
        />
      </div>

      <div className="scroll-fade-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setFiltro(opcao)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filtro === opcao
                ? "bg-primary/20 text-primary-forte"
                : "vidro-card text-escuro",
            )}
          >
            {opcao}
          </button>
        ))}
      </div>

      {loading ? (
        <ListaSkeleton />
      ) : filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutro-muted">
          Nenhum cliente encontrado.
        </p>
      ) : (
        // Duas colunas a partir de 1280: em coluna única de 768px cada linha
        // tinha um vão entre o nome e o valor, e cabia metade dos itens na
        // tela. Abaixo de 1280 a coluna ficaria estreita demais para o nome do
        // cliente e o valor conviverem.
        <div className="flex flex-col gap-2 xl:grid xl:grid-cols-2 xl:gap-3">
          {filtrados.map((cliente) => (
            <ClienteListItem key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Só as linhas da lista. O cabeçalho, a busca e os filtros desenham de
 * verdade — eles não esperam consulta nenhuma.
 */
function ListaSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-16 w-full rounded-card" />
      <Skeleton className="h-16 w-full rounded-card" />
      <Skeleton className="h-16 w-full rounded-card" />
    </div>
  );
}
