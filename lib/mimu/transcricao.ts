import { getGroq } from "@/lib/groq";

/**
 * Transformar áudio em texto.
 *
 * Existe porque o público da Mimu fala mais do que digita. Dona de salão com a
 * mão na tinta, mecânico com a mão suja, quem está no balcão atendendo: gravar
 * um áudio de cinco segundos é possível, digitar não é. Ignorar áudio era
 * ignorar o jeito como essas pessoas realmente usam o WhatsApp.
 *
 * Fica aqui, e não no adaptador do WhatsApp, porque não tem nada de WhatsApp
 * nisso: recebe bytes de áudio e devolve texto. Qualquer canal futuro com voz
 * usa a mesma função.
 */

/**
 * O modelo de transcrição.
 *
 * O `turbo` custa menos e responde mais rápido que o `whisper-large-v3` cheio,
 * com perda pequena de precisão. Para frase curta de negócio ("vendi três
 * bolos, quarenta e cinco cada") a diferença não aparece, e a espera importa
 * mais: a pessoa está esperando resposta no WhatsApp.
 */
const MODELO_TRANSCRICAO = "whisper-large-v3-turbo";

/**
 * Teto de tamanho do áudio.
 *
 * A transcrição é cobrada por duração. Sem teto, um áudio de meia hora — que
 * acontece, gente manda áudio longo — viraria uma conta desproporcional para
 * uma única mensagem. 8 MB cobre com folga qualquer recado de negócio; num
 * áudio de voz do WhatsApp isso é da ordem de vários minutos.
 */
const MAX_BYTES = 8 * 1024 * 1024;

export type ResultadoTranscricao =
  | { ok: true; texto: string }
  | { ok: false; motivo: "grande_demais" | "vazio" | "falhou" };

/**
 * O formato do áudio, para a API saber decodificar.
 *
 * O NOME DO ARQUIVO É QUEM DECIDE, e não o `type` — a API olha a extensão. O
 * WhatsApp entrega OGG/Opus e era o único caso, então a extensão vinha fixa no
 * código. O microfone do navegador entrega outra coisa: `webm` no Chrome e no
 * Android, `mp4` no Safari e no iPhone. Mandar um `.ogg` que na verdade é
 * `webm` faz a transcrição voltar vazia — sem erro, só sem texto.
 */
const EXTENSAO: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
};

/** O tipo declarado pode vir com parâmetros: `audio/webm;codecs=opus`. */
function nomeDoArquivo(tipo: string): { nome: string; tipo: string } {
  const base = tipo.split(";")[0]!.trim().toLowerCase();
  const ext = EXTENSAO[base] ?? "ogg";
  return { nome: `audio.${ext}`, tipo: base || "audio/ogg" };
}

export async function transcrever(
  audio: Buffer,
  /** Padrão OGG: é o que o WhatsApp manda, e era o único caso quando isto nasceu. */
  tipoDeclarado = "audio/ogg",
): Promise<ResultadoTranscricao> {
  if (audio.byteLength > MAX_BYTES) {
    return { ok: false, motivo: "grande_demais" };
  }

  const { nome, tipo } = nomeDoArquivo(tipoDeclarado);

  try {
    const resposta = await getGroq().audio.transcriptions.create({
      file: new File([new Uint8Array(audio)], nome, { type: tipo }),
      model: MODELO_TRANSCRICAO,
      // Dizer o idioma melhora a precisão e evita o Whisper "traduzir" para
      // inglês sozinho, que ele faz quando fica em dúvida.
      language: "pt",
      /*
       * O prompt orienta o vocabulário.
       *
       * Sem isso, "pix" vira "picks" e "fiado" vira "fiando". São justamente
       * as palavras que mais aparecem, e errá-las estraga a frase inteira.
       */
      prompt:
        "Áudio de um microempreendedor brasileiro falando do negócio dele: " +
        "vendas, clientes, agendamentos, fiado, pix, estoque, fornecedor.",
    });

    const texto = resposta.text?.trim() ?? "";
    if (!texto) return { ok: false, motivo: "vazio" };

    return { ok: true, texto };
  } catch (erro) {
    console.error("Não consegui transcrever o áudio.", erro);
    return { ok: false, motivo: "falhou" };
  }
}
