import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comIdentidade } from "@/lib/supabase/identidade";
import { transcrever } from "@/lib/mimu/transcricao";
import {
  excedeuLimiteDoChat,
  registrarUsoDoChat,
} from "@/lib/mimu/guardas";
import {
  verificarAcesso,
  RESPOSTA_SEM_ACESSO_NO_APP,
} from "@/lib/mimu/acesso";

/**
 * O áudio gravado no app virando texto.
 *
 * POR QUE ISTO EXISTE, em vez de o navegador transcrever sozinho: o botão de
 * microfone usava a Web Speech API (`webkitSpeechRecognition`). No Chrome de
 * computador ela funciona; no iPhone — que é onde este app mora — ela ou não
 * existe, ou existe e nunca chama de volta. O código antigo ligava o estado
 * "gravando" e esperava um `onend` que não vinha: o botão ficava vermelho para
 * sempre, sem capturar nada. Era o travamento.
 *
 * Aqui a gravação é do MediaRecorder, que funciona em todo lugar, e quem
 * transcreve é o mesmo Whisper que já atende os áudios do WhatsApp — inclusive
 * com o mesmo vocabulário de negócio, que é o que impede "pix" de virar
 * "picks".
 *
 * NÃO CONSOME a cota diária da Mimu. Ditar é escrever, não é perguntar: quem
 * dita e apaga sem enviar não gastou mensagem nenhuma, e quem envia gasta na
 * rota do chat, uma vez só. O que a rota faz é EXIGIR que a cota exista — sem
 * mensagem para mandar, não há o que transcrever.
 */

/**
 * Teto de tamanho, conferido antes de qualquer coisa.
 *
 * A transcrição é cobrada por duração. 8 MB é o mesmo teto do WhatsApp e cobre
 * com folga qualquer recado falado; o gravador do app ainda para sozinho antes
 * disso.
 */
const MAX_BYTES = 8 * 1024 * 1024;

const MOTIVO_HTTP: Record<string, string> = {
  grande_demais: "Esse áudio ficou comprido demais. Grava um mais curtinho?",
  vazio: "Não consegui ouvir nada nesse áudio. Tenta de novo?",
  falhou: "Não consegui entender o áudio agora. Tenta de novo?",
};

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  /*
   * O mesmo teto de rajada do chat, e registrado de verdade.
   *
   * Só conferir sem registrar deixaria a rota aberta para ser martelada sem
   * nunca bater no limite — e cada batida é uma chamada paga. Ditar conta como
   * uso do chat porque ditar É como se escreve uma mensagem aqui.
   */
  if (await excedeuLimiteDoChat(user.id)) {
    return NextResponse.json(
      { error: "Você gravou muitos áudios seguidos. Espera um pouquinho." },
      { status: 429 },
    );
  }
  await registrarUsoDoChat(user.id);

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!empresa) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  const acesso = await verificarAcesso(comIdentidade(supabase), empresa.id);
  if (!acesso.liberado) {
    return NextResponse.json(
      { error: RESPOSTA_SEM_ACESSO_NO_APP[acesso.motivo] },
      { status: acesso.motivo === "cota_esgotada" ? 429 : 403 },
    );
  }

  let audio: File | null = null;
  try {
    const form = await request.formData();
    const enviado = form.get("audio");
    if (enviado instanceof File) audio = enviado;
  } catch {
    // corpo malformado cai no 400 abaixo
  }

  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: "Áudio ausente." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json(
      { error: MOTIVO_HTTP.grande_demais },
      { status: 413 },
    );
  }

  const resultado = await transcrever(
    Buffer.from(await audio.arrayBuffer()),
    audio.type,
  );

  if (!resultado.ok) {
    return NextResponse.json(
      { error: MOTIVO_HTTP[resultado.motivo] ?? MOTIVO_HTTP.falhou },
      { status: resultado.motivo === "grande_demais" ? 413 : 502 },
    );
  }

  return NextResponse.json({ texto: resultado.texto });
}
