import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin } from "@/lib/admin";
import type { ModuloAtivo } from "@/types";

/**
 * Liga/desliga módulos de uma conta.
 *
 * Igual à rota de listagem, a checagem de admin é refeita aqui: layout não
 * protege chamada direta à API. E esta é uma rota de ESCRITA na conta de
 * outra pessoa, então além de autorizar ela valida a entrada e registra o
 * que foi feito.
 */

/**
 * Lista branca. `empresas.modulos_ativos` é `text[]` — o banco aceita
 * qualquer string. Sem esta checagem, um valor errado (ou um payload
 * montado à mão) entraria no array e o app passaria a ler um módulo que não
 * existe. Vem de types/index.ts (ModuloAtivo).
 */
const MODULOS_VALIDOS: ModuloAtivo[] = [
  "financeiro",
  "agenda",
  "clientes",
  "estoque",
  "ia",
];

export async function PATCH(
  request: Request,
  { params }: { params: { empresaId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const recebidos = body?.modulos;

  if (!Array.isArray(recebidos)) {
    return NextResponse.json(
      { error: "Envie a lista de módulos." },
      { status: 400 },
    );
  }

  const invalidos = recebidos.filter(
    (m) => typeof m !== "string" || !MODULOS_VALIDOS.includes(m as ModuloAtivo),
  );
  if (invalidos.length > 0) {
    return NextResponse.json(
      { error: `Módulo desconhecido: ${invalidos.join(", ")}` },
      { status: 400 },
    );
  }

  // Sem duplicatas — o array é um conjunto na prática.
  const modulos = Array.from(new Set(recebidos)) as ModuloAtivo[];

  const service = createServiceClient();

  // Lê o estado atual ANTES de escrever: é ele que vai pro log como
  // `valor_antes`, e é o que permite reconstruir/desfazer depois.
  const { data: antes, error: erroLeitura } = await service
    .from("empresas")
    .select("id, nome, modulos_ativos")
    .eq("id", params.empresaId)
    .maybeSingle();

  if (erroLeitura || !antes) {
    return NextResponse.json(
      { error: "Conta não encontrada." },
      { status: 404 },
    );
  }

  const { error: erroEscrita } = await service
    .from("empresas")
    .update({ modulos_ativos: modulos })
    .eq("id", params.empresaId);

  if (erroEscrita) {
    console.error("Erro ao atualizar módulos no painel admin:", erroEscrita);
    return NextResponse.json(
      { error: "Não consegui salvar os módulos." },
      { status: 500 },
    );
  }

  // Auditoria depois da escrita dar certo — registrar uma mudança que não
  // aconteceu seria pior que não registrar. Uma falha aqui não desfaz a
  // alteração nem derruba a resposta; só fica o aviso no log do servidor.
  const { error: erroAuditoria } = await service.from("admin_auditoria").insert({
    admin_user_id: user!.id,
    admin_email: user!.email ?? null,
    empresa_id: antes.id,
    empresa_nome: antes.nome,
    acao: "modulos_alterados",
    valor_antes: antes.modulos_ativos,
    valor_depois: modulos,
  });

  if (erroAuditoria) {
    console.error("Módulos salvos, mas a auditoria falhou:", erroAuditoria);
  }

  return NextResponse.json({ modulos });
}
