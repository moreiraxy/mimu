"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Input } from "@/components/ui/Input";

export interface ClienteOpcao {
  id: string;
  nome: string;
  cliente_fiel?: boolean;
}

export function ClienteSearchInput({
  value,
  onChange,
  label = "Cliente (opcional)",
}: {
  value: ClienteOpcao | null;
  onChange: (cliente: ClienteOpcao | null) => void;
  label?: string;
}) {
  const { empresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [query, setQuery] = useState(value?.nome ?? "");
  const [resultados, setResultados] = useState<ClienteOpcao[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!empresa || query.trim().length < 2 || query === value?.nome) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, cliente_fiel")
        .eq("empresa_id", empresa.id)
        .ilike("nome", `%${query.trim()}%`)
        .limit(6);
      setResultados(data ?? []);
      setBuscando(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, empresa, supabase, value?.nome]);

  function selecionar(cliente: ClienteOpcao) {
    onChange(cliente);
    setQuery(cliente.nome);
    setResultados([]);
  }

  function limpar() {
    onChange(null);
    setQuery("");
    setResultados([]);
  }

  return (
    <div className="relative">
      <Input
        label={label}
        placeholder="Buscar cliente..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (value) onChange(null);
        }}
      />
      {value && (
        <button
          type="button"
          onClick={limpar}
          className="absolute right-3 top-[30px] text-xs font-semibold text-neutro-muted"
        >
          Limpar
        </button>
      )}
      {!value && query.trim().length >= 2 && (resultados.length > 0 || buscando) && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-button border border-neutro-border bg-superficie shadow-md">
          {buscando ? (
            <p className="px-3.5 py-2.5 text-sm text-neutro-muted">
              Buscando...
            </p>
          ) : (
            resultados.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => selecionar(cliente)}
                className="block w-full px-3.5 py-2.5 text-left text-sm text-escuro hover:bg-fundo"
              >
                {cliente.nome}
                {cliente.cliente_fiel && (
                  <Star
                    className="ml-1.5 inline h-3 w-3 text-ambar-text"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
