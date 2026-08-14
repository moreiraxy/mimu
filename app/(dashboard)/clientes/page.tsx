"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { Skeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
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

  if (loading) {
    return <ClientesSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-neutro-muted">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-sm font-semibold text-primary-forte"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
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
    );
  }

  return (
    <FadeIn className="flex flex-col gap-4 lg:mx-auto lg:max-w-3xl">
      <div className="flex items-center gap-2 rounded-button border border-neutro-border bg-superficie px-3.5 py-2.5">
        <SearchIcon size={16} className="text-neutro-muted" />
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-transparent text-base text-escuro outline-none placeholder:text-neutro-muted md:text-sm"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto scroll-fade-x px-4 pb-1">
        {FILTROS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setFiltro(opcao)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filtro === opcao
                ? "border-primary-forte bg-primary text-primary-text"
                : "border-neutro-border bg-superficie text-escuro",
            )}
          >
            {opcao}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutro-muted">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((cliente) => (
            <ClienteListItem key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}
    </FadeIn>
  );
}

function ClientesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-11 w-full rounded-button" />
      <Skeleton className="h-8 w-full rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
    </div>
  );
}
