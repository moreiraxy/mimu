import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comIdentidade } from "@/lib/supabase/identidade";
import { criarCodigoDeVinculo } from "@/lib/whatsapp/vinculo";
import { mascararRemetente } from "@/lib/canais/tipos";

/**
 * Conectar e desconectar o WhatsApp da própria conta.
 *
 * O código nasce AQUI, com sessão autenticada, e é isso que sustenta a
 * segurança do canal inteiro: o vínculo sempre começa de dentro do app, por
 * alguém que provou ser dona da conta. Do outro lado, a mensagem chegando com
 * esse código prova que a pessoa controla aquele número — as duas metades
 * juntas verificam o telefone sem precisar mandar nada para ninguém.
 *
 * A empresa NÃO vem no corpo da requisição, pelo mesmo motivo da rota de
 * módulos: bastaria mandar o id de outra pessoa para conectar o próprio
 * WhatsApp à conta dela.
 */

/** O estado atual do vínculo, para a tela saber o que desenhar. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data } = await supabase
    .from("whatsapp_links")
    .select("telefone, verificado_em")
    .not("verificado_em", "is", null)
    .is("revogado_em", null)
    .maybeSingle();

  return NextResponse.json({
    conectado: Boolean(data),
    // Mascarado mesmo indo para a dona do número: o valor serve para ela
    // reconhecer qual aparelho está conectado, e não há razão para o número
    // inteiro trafegar de volta e acabar num log de erro do navegador.
    telefone: data?.telefone ? mascararRemetente(data.telefone) : null,
    conectadoEm: data?.verificado_em ?? null,
  });
}

/** Gera um código novo. Os pendentes anteriores são revogados dentro. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!empresa) {
    return NextResponse.json({ error: "Conta sem empresa." }, { status: 400 });
  }

  const codigo = await criarCodigoDeVinculo(
    comIdentidade(supabase),
    empresa.id,
    user.id,
  );

  if (!codigo) {
    return NextResponse.json(
      { error: "Não consegui gerar o código agora." },
      { status: 500 },
    );
  }

  return NextResponse.json(codigo);
}

/**
 * Desconecta o número.
 *
 * Revogação é lógica: a linha continua existindo com `revogado_em` preenchido.
 * O histórico de qual número teve acesso ao negócio, e até quando, não é
 * apagável — nem por quem usa o app.
 */
export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { error } = await supabase
    .from("whatsapp_links")
    .update({ revogado_em: new Date().toISOString() })
    .not("verificado_em", "is", null)
    .is("revogado_em", null);

  if (error) {
    return NextResponse.json(
      { error: "Não consegui desconectar agora." },
      { status: 500 },
    );
  }

  return NextResponse.json({ desconectado: true });
}
