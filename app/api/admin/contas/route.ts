import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin, type ContaAdmin } from "@/lib/admin";

/**
 * Lista as contas para o painel admin.
 *
 * A checagem de admin é REFEITA aqui, e não herdada: `app/admin/layout.tsx`
 * protege a navegação, mas uma chamada direta a esta URL nunca passa por
 * layout nenhum. Toda rota /api/admin/* precisa se defender sozinha.
 *
 * Lê exclusivamente da view `admin_contas` — nunca das tabelas cruas. É essa
 * escolha que garante que dados dos clientes da usuária (agendamentos,
 * transações, conversas) não têm como sair por aqui: eles não existem na
 * view. Ver a migration do painel admin.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    // 404 e não 403: 403 confirmaria que a rota existe.
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  // A view é revogada de anon/authenticated, então só a service role lê.
  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_contas")
    .select("*")
    .order("entrou_em", { ascending: false });

  if (error) {
    console.error("Erro ao listar contas no painel admin:", error);
    return NextResponse.json(
      { error: "Não consegui carregar as contas." },
      { status: 500 },
    );
  }

  const contas: ContaAdmin[] = data ?? [];

  // Resumo calculado no servidor pra a tela não repetir essa conta e pra o
  // "novos hoje" bater com o fuso do servidor, não o do navegador.
  const inicioDeHoje = new Date();
  inicioDeHoje.setHours(0, 0, 0, 0);

  const resumo = {
    total: contas.length,
    pagantes: contas.filter((c) => c.status_assinatura === "ativa").length,
    emTrial: contas.filter((c) => c.status_assinatura === "trial").length,
    vencidas: contas.filter((c) =>
      ["vencida", "cancelada"].includes(c.status_assinatura),
    ).length,
    novosHoje: contas.filter((c) => new Date(c.entrou_em) >= inicioDeHoje)
      .length,
    /*
     * Receita mensal recorrente, com a anual diluída em doze.
     *
     * `valor_mensal` guarda o valor COBRADO, que numa assinatura anual é o do
     * ano inteiro. Somar direto fazia uma venda de R$ 399 por ano aparecer
     * como R$ 399 por mês, e o painel mostrava dez vezes mais receita do que
     * existe. Somar mês com ano só faz sentido depois de trazer os dois para a
     * mesma unidade.
     */
    receitaMensal: contas
      .filter((c) => c.status_assinatura === "ativa")
      .reduce((soma, c) => {
        const valor = Number(c.valor_mensal ?? 0);
        return soma + (c.periodicidade === "anual" ? valor / 12 : valor);
      }, 0),
  };

  return NextResponse.json({ contas, resumo });
}
