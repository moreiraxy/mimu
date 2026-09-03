import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planoEfetivo } from "@/lib/assinatura";
import { cotaDaMimu } from "@/lib/mimu/cota";

/**
 * Quantas mensagens da Mimu sobraram hoje.
 *
 * Existe porque a tela precisa contar isso ANTES de a pessoa esbarrar no
 * limite. Descobrir a cota só no momento em que ela acaba é a versão do
 * produto em que o teto parece castigo; vendo o número desde o começo, ele
 * vira o que é — o tamanho do plano.
 *
 * O plano vem do banco, nunca do navegador. Aceitar um plano enviado pelo
 * cliente aqui seria só cosmético (quem decide de verdade é o gate em
 * lib/mimu/acesso.ts), mas mostraria "40 mensagens" para uma conta gratuita
 * — e a pessoa cobraria, com razão, uma promessa que a tela fez.
 */
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, assinaturas(status, plano, trial_fim, proxima_cobranca)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!empresa) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  const assinatura = Array.isArray(empresa.assinaturas)
    ? (empresa.assinaturas[0] ?? null)
    : (empresa.assinaturas ?? null);

  const cota = await cotaDaMimu(planoEfetivo(assinatura), empresa.id);

  return NextResponse.json(cota);
}
