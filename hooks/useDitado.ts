"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gravar a voz e devolver o texto.
 *
 * SUBSTITUI A WEB SPEECH API, e o motivo é um defeito de verdade: o botão de
 * microfone usava `webkitSpeechRecognition`. No Chrome de computador ela
 * funciona. No iPhone — que é onde este app mora — ela ou não existe, ou
 * existe e nunca chama de volta. O código antigo ligava o estado "gravando" e
 * esperava um `onend` que não vinha; o botão ficava vermelho para sempre, sem
 * capturar nada, e não havia como sair daquilo a não ser recarregando. Era o
 * travamento.
 *
 * Aqui quem grava é o `MediaRecorder`, que existe em todo navegador que este
 * app alcança, e quem transcreve é o Whisper do servidor — o mesmo que já
 * atende os áudios do WhatsApp, com o mesmo vocabulário de negócio.
 *
 * TRÊS COISAS QUE O CÓDIGO ANTERIOR NÃO FAZIA, e que são o que impede travar
 * de novo:
 *
 *   1. Solta o microfone. Sem `track.stop()`, a bolinha vermelha do sistema
 *      fica acesa depois de terminar e o aparelho segue achando que o app está
 *      ouvindo.
 *   2. Para sozinho. Um teto de duração garante que o estado sempre termina,
 *      mesmo que algo no meio do caminho falhe.
 *   3. Tem um fim em qualquer saída. Erro de permissão, erro de rede, áudio
 *      vazio: todos voltam para "parado", com uma frase que diz o que houve.
 */

export type EstadoDoDitado = "parado" | "gravando" | "transcrevendo";

/**
 * Teto de gravação.
 *
 * 90 segundos é muito mais do que um recado de negócio falado ("vendi três
 * bolos, quarenta e cinco cada") e ainda assim curto o bastante para o arquivo
 * caber com folga no limite do servidor. Existe principalmente como rede de
 * segurança: uma gravação que nunca para é o travamento voltando por outra
 * porta.
 */
const MAX_SEGUNDOS = 90;

/** O que o navegador da vez sabe gravar, em ordem de preferência. */
const FORMATOS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function formatoSuportado(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported(f));
}

export function useDitado({
  aoTranscrever,
  aoFalhar,
}: {
  aoTranscrever: (texto: string) => void;
  aoFalhar: (mensagem: string) => void;
}) {
  const [estado, setEstado] = useState<EstadoDoDitado>("parado");
  const [segundos, setSegundos] = useState(0);

  const gravadorRef = useRef<MediaRecorder | null>(null);
  const trilhasRef = useRef<MediaStreamTrack[]>([]);
  const pedacosRef = useRef<Blob[]>([]);
  const relogioRef = useRef<number | null>(null);
  const tetoRef = useRef<number | null>(null);
  // Um ditado abandonado (a pessoa saiu da tela) não deve chamar de volta.
  const vivoRef = useRef(true);

  const soltarMicrofone = useCallback(() => {
    for (const trilha of trilhasRef.current) trilha.stop();
    trilhasRef.current = [];
    if (relogioRef.current) window.clearInterval(relogioRef.current);
    if (tetoRef.current) window.clearTimeout(tetoRef.current);
    relogioRef.current = null;
    tetoRef.current = null;
  }, []);

  // Sair da tela no meio de uma gravação não pode deixar o microfone aberto.
  useEffect(() => {
    vivoRef.current = true;
    return () => {
      vivoRef.current = false;
      try {
        gravadorRef.current?.stop();
      } catch {
        // já parado: não é erro
      }
      soltarMicrofone();
    };
  }, [soltarMicrofone]);

  const enviarParaTranscrever = useCallback(
    async (audio: Blob) => {
      if (!vivoRef.current) return;
      setEstado("transcrevendo");

      try {
        const corpo = new FormData();
        // O nome importa menos que o `type`, que o servidor usa para escolher
        // a extensão que a API de transcrição entende.
        corpo.append("audio", audio, "ditado");

        const resposta = await fetch("/api/mimu/transcricao", {
          method: "POST",
          body: corpo,
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!vivoRef.current) return;

        if (!resposta.ok) {
          aoFalhar(dados?.error ?? "Não consegui entender o áudio.");
          return;
        }
        if (!dados?.texto) {
          aoFalhar("Não consegui ouvir nada nesse áudio. Tenta de novo?");
          return;
        }
        aoTranscrever(dados.texto as string);
      } catch {
        if (vivoRef.current) {
          aoFalhar("Sem conexão para transcrever agora. Tenta de novo?");
        }
      } finally {
        if (vivoRef.current) setEstado("parado");
      }
    },
    [aoTranscrever, aoFalhar],
  );

  const parar = useCallback(() => {
    try {
      gravadorRef.current?.stop();
    } catch {
      // Se já parou, o `onstop` abaixo já cuidou de tudo.
      setEstado("parado");
      soltarMicrofone();
    }
  }, [soltarMicrofone]);

  const comecar = useCallback(async () => {
    const formato = formatoSuportado();
    if (!navigator.mediaDevices?.getUserMedia || !formato) {
      aoFalhar("Este aparelho não deixa gravar áudio pelo navegador.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (erro) {
      /*
       * CADA FALHA TEM UMA SAÍDA DIFERENTE, e por isso cada uma tem a sua
       * frase.
       *
       * Uma mensagem só, dizendo "libera a permissão", manda para os ajustes
       * quem não tem microfone nenhum e quem está com o microfone ocupado por
       * outro app — os dois procuram uma chave que já está ligada e concluem
       * que o app está quebrado. O navegador diz qual é o caso no `name` do
       * erro; é só repassar.
       */
      const nome = (erro as { name?: string })?.name;
      aoFalhar(
        nome === "NotAllowedError" || nome === "SecurityError"
          ? "Preciso da permissão do microfone. Libera nos ajustes do navegador?"
          : nome === "NotFoundError" || nome === "OverconstrainedError"
            ? "Não encontrei um microfone neste aparelho."
            : nome === "NotReadableError"
              ? "O microfone está ocupado por outro app. Fecha ele e tenta de novo?"
              : "Não consegui abrir o microfone agora. Tenta de novo?",
      );
      return;
    }

    if (!vivoRef.current) {
      for (const t of stream.getTracks()) t.stop();
      return;
    }

    trilhasRef.current = stream.getTracks();
    pedacosRef.current = [];

    const gravador = new MediaRecorder(stream, { mimeType: formato });
    gravadorRef.current = gravador;

    gravador.ondataavailable = (evento) => {
      if (evento.data.size > 0) pedacosRef.current.push(evento.data);
    };

    gravador.onstop = () => {
      soltarMicrofone();
      const audio = new Blob(pedacosRef.current, { type: formato });
      pedacosRef.current = [];
      if (audio.size === 0) {
        setEstado("parado");
        aoFalhar("Não consegui ouvir nada. Tenta segurar um pouco mais?");
        return;
      }
      void enviarParaTranscrever(audio);
    };

    /*
     * `onerror` NÃO É OPCIONAL aqui.
     *
     * É a diferença entre o estado terminar e ficar preso: sem ele, uma falha
     * do gravador no meio da captura deixa "gravando" ligado para sempre — que
     * é exatamente o defeito que estamos corrigindo, só que por outra causa.
     */
    gravador.onerror = () => {
      soltarMicrofone();
      setEstado("parado");
      aoFalhar("A gravação falhou no meio. Tenta de novo?");
    };

    gravador.start();
    setEstado("gravando");
    setSegundos(0);

    relogioRef.current = window.setInterval(
      () => setSegundos((s) => s + 1),
      1000,
    );
    tetoRef.current = window.setTimeout(() => {
      try {
        gravador.stop();
      } catch {
        // ignora: o `onstop` decide o resto
      }
    }, MAX_SEGUNDOS * 1000);
  }, [aoFalhar, enviarParaTranscrever, soltarMicrofone]);

  const alternar = useCallback(() => {
    if (estado === "gravando") parar();
    else if (estado === "parado") void comecar();
    // "transcrevendo" ignora o toque: não há o que alternar enquanto espera.
  }, [estado, parar, comecar]);

  return { estado, segundos, alternar };
}
