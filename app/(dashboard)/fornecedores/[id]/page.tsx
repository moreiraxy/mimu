"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDateShort } from "@/lib/formatters";
import type { Compra, Fornecedor } from "@/types";

export default function DetalheFornecedorPage() {
  const { id } = useParams<{ id: string }>();
  const [supabase] = useState(() => createClient());

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const [fornecedorResult, comprasResult] = await Promise.all([
      supabase.from("fornecedores").select("*").eq("id", id).single(),
      supabase
        .from("compras")
        .select("*")
        .eq("fornecedor_id", id)
        .order("data", { ascending: false }),
    ]);

    if (fornecedorResult.error || !fornecedorResult.data) {
      setErro("Fornecedor não encontrado.");
      setLoading(false);
      return;
    }

    setFornecedor(fornecedorResult.data);
    setCompras(comprasResult.data ?? []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Fornecedor" />
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="mt-4 h-40 w-full rounded-card" />
      </div>
    );
  }

  if (erro || !fornecedor) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Fornecedor" />
        <p className="mt-6 text-center text-sm text-neutro-muted">{erro}</p>
      </div>
    );
  }

  const totalComprado = compras.reduce((s, c) => s + Number(c.valor_total), 0);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <PageHeader title="Fornecedor" />

      <div className="rounded-card border border-neutro-border bg-superficie p-4">
        <p className="text-lg font-semibold text-escuro">{fornecedor.nome}</p>
        <div className="mt-2 flex flex-col gap-1">
          {fornecedor.telefone && (
            <p className="flex items-center gap-1.5 text-sm text-neutro-muted">
              <Phone className="h-3.5 w-3.5" strokeWidth={2.25} />
              {fornecedor.telefone}
            </p>
          )}
          {fornecedor.email && (
            <p className="flex items-center gap-1.5 text-sm text-neutro-muted">
              <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
              {fornecedor.email}
            </p>
          )}
        </div>
      </div>

      <Link
        href={`/compras?fornecedorId=${fornecedor.id}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-button bg-coral py-3 text-sm font-bold text-white"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={2.25} />
        Nova compra
      </Link>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-neutro-muted">
            Histórico de compras
          </p>
          {compras.length > 0 && (
            <p className="text-xs font-semibold text-neutro-muted">
              Total: {formatCurrency(totalComprado)}
            </p>
          )}
        </div>

        {compras.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutro-muted">
            Nenhuma compra registrada com esse fornecedor ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {compras.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-card border border-neutro-border bg-superficie p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-escuro">
                    {formatDateShort(c.data)}
                  </p>
                  {c.observacoes && (
                    <p className="truncate text-xs text-neutro-muted">
                      {c.observacoes}
                    </p>
                  )}
                </div>
                <p className="flex-shrink-0 text-sm font-semibold text-escuro">
                  {formatCurrency(Number(c.valor_total))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
