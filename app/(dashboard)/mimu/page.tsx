"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Mic,
  Send,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { LogoMark } from "@/components/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn, paraISOLocal } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { salvarCorrecaoMimu, type CorrecaoMimu } from "@/lib/mimu-correcao";
import type { Json } from "@/types/database";
import type { MimuCard, RegistroPendente, TipoRegistroMimu } from "@/lib/mimu-prompts";

// A Web Speech API não tem tipos oficiais no lib.dom padrão do TS — declaramos
// só o que a gente usa.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface MimuMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  card: MimuCard | null;
  registro: RegistroPendente | null;
  createdAt: string;
}

const TIPO_REGISTRO_LABEL: Record<TipoRegistroMimu, string> = {
  entrada: "Entrada",
  saida: "Saída",
  agendamento: "Agendamento",
};

function formatDataRegistro(data: string | null): string {
  const hojeISO = paraISOLocal(new Date());
  if (!data || data === hojeISO) return "hoje";

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  if (data === paraISOLocal(amanha)) return "amanhã";

  return formatDate(data);
}

const PAGE_SIZE = 50;

const SUGESTOES: Record<"manha" | "tarde" | "noite", string[]> = {
  manha: [
    "Como está meu caixa?",
    "Tenho agendamentos hoje?",
    "Quanto falta pra minha meta?",
    "Quem me deve?",
  ],
  tarde: [
    "Quanto vendi hoje?",
    "Resumo do dia",
    "Próximos agendamentos",
    "Maiores gastos do mês",
  ],
  noite: [
    "Resumo do dia",
    "Como foi a semana?",
    "Meta do mês",
    "Lucro de hoje",
  ],
};

function periodoDoDia(hora: number): "manha" | "tarde" | "noite" {
  if (hora >= 5 && hora < 12) return "manha";
  if (hora >= 12 && hora < 18) return "tarde";
  return "noite";
}

function formatHorario(iso: string): string {
  const data = new Date(iso);
  const horas = String(data.getHours()).padStart(2, "0");
  const minutos = String(data.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

function extrairCardDeMetadata(metadata: Json | null): MimuCard | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const card = (metadata as Record<string, Json | undefined>).card;
  if (!card || typeof card !== "object" || Array.isArray(card)) return null;
  const bruto = card as Record<string, Json | undefined>;
  if (typeof bruto.titulo !== "string" || typeof bruto.valor !== "number") {
    return null;
  }
  return {
    titulo: bruto.titulo,
    valor: bruto.valor,
    comparacaoLabel:
      typeof bruto.comparacaoLabel === "string"
        ? bruto.comparacaoLabel
        : undefined,
    valorComparacao:
      typeof bruto.valorComparacao === "number"
        ? bruto.valorComparacao
        : undefined,
    variacaoPercentual:
      typeof bruto.variacaoPercentual === "number"
        ? bruto.variacaoPercentual
        : undefined,
  };
}

function extrairRegistroDeMetadata(
  metadata: Json | null,
): RegistroPendente | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const registro = (metadata as Record<string, Json | undefined>).registro;
  if (
    !registro ||
    typeof registro !== "object" ||
    Array.isArray(registro)
  ) {
    return null;
  }
  const bruto = registro as Record<string, Json | undefined>;
  if (
    bruto.tipoRegistro !== "entrada" &&
    bruto.tipoRegistro !== "saida" &&
    bruto.tipoRegistro !== "agendamento"
  ) {
    return null;
  }

  return {
    tipoRegistro: bruto.tipoRegistro,
    valor: typeof bruto.valor === "number" ? bruto.valor : null,
    descricao: typeof bruto.descricao === "string" ? bruto.descricao : null,
    cliente: typeof bruto.cliente === "string" ? bruto.cliente : null,
    data: typeof bruto.data === "string" ? bruto.data : null,
    horario: typeof bruto.horario === "string" ? bruto.horario : null,
    confirmado: bruto.confirmado === true,
  };
}

export default function MimuChatPage() {
  const { empresa, loading: carregandoAuth } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [messages, setMessages] = useState<MimuMessage[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [temMaisAntigas, setTemMaisAntigas] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [gravando, setGravando] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [confirmandoRegistroId, setConfirmandoRegistroId] = useState<
    string | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const scrollRestoreRef = useRef<{ height: number; top: number } | null>(
    null,
  );

  async function buscarMensagens(
    empresaId: string,
    antesDe?: string,
  ): Promise<MimuMessage[]> {
    let query = supabase
      .from("conversas_mimu")
      .select("id, role, content, metadata, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (antesDe) {
      query = query.lt("created_at", antesDe);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data
      .slice()
      .reverse()
      .map((linha) => ({
        id: linha.id,
        role: linha.role,
        content: linha.content,
        card: extrairCardDeMetadata(linha.metadata),
        registro: extrairRegistroDeMetadata(linha.metadata),
        createdAt: linha.created_at,
      }));
  }

  // Histórico inicial: últimas 50 mensagens da conversa.
  useEffect(() => {
    if (!empresa) return;
    let cancelado = false;

    (async () => {
      const iniciais = await buscarMensagens(empresa.id);
      if (cancelado) return;
      setMessages(iniciais);
      setTemMaisAntigas(iniciais.length === PAGE_SIZE);
      setCarregandoHistorico(false);
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id]);

  // Rola pro fim em mensagens novas; restaura a posição quando a página
  // carrega mensagens mais antigas no topo (scrollRestoreRef).
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (scrollRestoreRef.current) {
      const { height, top } = scrollRestoreRef.current;
      container.scrollTop = container.scrollHeight - height + top;
      scrollRestoreRef.current = null;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  async function carregarMaisAntigas() {
    if (!empresa || messages.length === 0 || carregandoAntigas) return;
    setCarregandoAntigas(true);

    const maisAntigas = await buscarMensagens(
      empresa.id,
      messages[0]!.createdAt,
    );

    if (maisAntigas.length > 0) {
      const container = containerRef.current;
      if (container) {
        scrollRestoreRef.current = {
          height: container.scrollHeight,
          top: container.scrollTop,
        };
      }
      setMessages((atual) => [...maisAntigas, ...atual]);
    }

    setTemMaisAntigas(maisAntigas.length === PAGE_SIZE);
    setCarregandoAntigas(false);
  }

  function aoRolar() {
    const container = containerRef.current;
    if (!container || carregandoAntigas || !temMaisAntigas) return;
    if (container.scrollTop < 60) {
      carregarMaisAntigas();
    }
  }

  async function enviarMensagem(textoBruto: string) {
    const texto = textoBruto.trim();
    if (!texto || enviando || !empresa) return;

    setMessages((atual) => [
      ...atual,
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: texto,
        card: null,
        registro: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setEnviando(true);

    try {
      const resposta = await fetch("/api/mimu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error ?? "A Mimu não conseguiu responder.");
      }

      setMessages((atual) => [
        ...atual,
        {
          id: dados.id,
          role: "assistant",
          content: dados.content,
          card: dados.card ?? null,
          registro: dados.registro ?? null,
          createdAt: dados.createdAt,
        },
      ]);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "A Mimu não conseguiu responder agora. Tenta de novo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  /** Busca o primeiro cliente cujo nome bate (aproximado) com o texto extraído do chat. */
  async function buscarClientePorNome(
    empresaId: string,
    nome: string,
  ): Promise<{ id: string; nome: string } | null> {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .ilike("nome", `%${nome}%`)
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }

  async function confirmarRegistro(mensagem: MimuMessage) {
    if (!mensagem.registro || !empresa || confirmandoRegistroId) return;
    const registro = mensagem.registro;
    setConfirmandoRegistroId(mensagem.id);

    try {
      const clienteEncontrado = registro.cliente
        ? await buscarClientePorNome(empresa.id, registro.cliente)
        : null;
      const dataFinal = registro.data ?? paraISOLocal(new Date());

      if (registro.tipoRegistro === "agendamento") {
        const horario = registro.horario ?? "09:00";
        const { error } = await supabase.from("agendamentos").insert({
          empresa_id: empresa.id,
          cliente_id: clienteEncontrado?.id ?? null,
          titulo: registro.descricao || registro.cliente || "Agendamento",
          descricao: null,
          valor_previsto: registro.valor,
          data_hora: new Date(`${dataFinal}T${horario}:00`).toISOString(),
          duracao_minutos: null,
          status: "confirmado",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transacoes").insert({
          empresa_id: empresa.id,
          tipo: registro.tipoRegistro,
          valor: registro.valor!,
          descricao:
            registro.descricao ||
            (!clienteEncontrado ? registro.cliente : null),
          categoria: null,
          cliente_id: clienteEncontrado?.id ?? null,
          forma_pagamento: null,
          data: dataFinal,
          parcelas: 1,
          parcela_atual: 1,
        });
        if (error) throw error;
      }

      const registroConfirmado: RegistroPendente = {
        ...registro,
        confirmado: true,
      };

      await supabase
        .from("conversas_mimu")
        .update({
          metadata: JSON.parse(
            JSON.stringify({ registro: registroConfirmado }),
          ) as Json,
        })
        .eq("id", mensagem.id);

      setMessages((atual) =>
        atual.map((m) =>
          m.id === mensagem.id ? { ...m, registro: registroConfirmado } : m,
        ),
      );

      showToast(
        registro.tipoRegistro === "agendamento"
          ? "Agendamento criado!"
          : registro.tipoRegistro === "entrada"
            ? "Entrada registrada!"
            : "Saída registrada!",
      );
    } catch {
      showToast("Não consegui registrar. Tenta pelo formulário.");
    } finally {
      setConfirmandoRegistroId(null);
    }
  }

  async function corrigirRegistro(mensagem: MimuMessage) {
    if (!mensagem.registro || !empresa) return;
    const registro = mensagem.registro;

    const dados: CorrecaoMimu = {};
    if (registro.valor) dados.valor = String(registro.valor);
    if (registro.descricao) dados.descricao = registro.descricao;
    if (registro.data) dados.data = registro.data;
    if (registro.horario) dados.horario = registro.horario;

    if (registro.cliente) {
      const clienteEncontrado = await buscarClientePorNome(
        empresa.id,
        registro.cliente,
      );
      if (clienteEncontrado) {
        dados.clienteId = clienteEncontrado.id;
        dados.clienteNome = clienteEncontrado.nome;
      } else {
        dados.clienteNome = registro.cliente;
      }
    }

    // Handoff via sessionStorage, não query string — valor e nome de
    // cliente nunca aparecem na URL (histórico do navegador, logs de acesso).
    salvarCorrecaoMimu(dados);

    const destino =
      registro.tipoRegistro === "entrada"
        ? "/financeiro/nova-entrada"
        : registro.tipoRegistro === "saida"
          ? "/financeiro/nova-saida"
          : "/agenda/novo";

    router.push(destino);
  }

  async function limparHistorico() {
    if (!empresa) return;
    const { error } = await supabase
      .from("conversas_mimu")
      .delete()
      .eq("empresa_id", empresa.id);

    setConfirmAberto(false);

    if (error) {
      showToast("Não consegui limpar o histórico.");
      return;
    }

    setMessages([]);
    setTemMaisAntigas(false);
    showToast("Histórico limpo!", Trash2);
  }

  function alternarDitado() {
    if (gravando) {
      recognitionRef.current?.stop();
      return;
    }

    const Construtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Construtor) {
      showToast("Seu navegador não suporta ditado por voz.");
      return;
    }

    const recognition = new Construtor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const texto = event.results[0]?.[0]?.transcript ?? "";
      setInputValue((atual) => (atual ? `${atual} ${texto}` : texto));
    };
    recognition.onend = () => setGravando(false);
    recognition.onerror = () => setGravando(false);

    recognitionRef.current = recognition;
    recognition.start();
    setGravando(true);
  }

  function aoTeclar(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviarMensagem(inputValue);
    }
  }

  function aoDigitar(valor: string) {
    setInputValue(valor);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }

  if (carregandoAuth || !empresa) {
    return <MimuChatSkeleton />;
  }

  const chips = SUGESTOES[periodoDoDia(new Date().getHours())];

  return (
    <div className="mx-auto flex flex-col gap-4 lg:max-w-3xl">
      <div className="flex flex-col overflow-hidden rounded-card border border-neutro-border bg-superficie">
        <header className="flex items-center justify-between border-b border-neutro-border px-4 py-3">
          <div className="flex items-center gap-3">
            <LogoMark size="sm" />
            <div>
              <p className="text-sm font-semibold text-escuro">Mimu</p>
              <p className="flex items-center gap-1.5 text-xs text-neutro-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-verde" />
                Online
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Limpar histórico"
            onClick={() => setConfirmAberto(true)}
            className="flex h-9 w-9 items-center justify-center rounded-button text-neutro-muted transition-colors hover:bg-primary-light hover:text-primary-forte"
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </header>

        <div
          ref={containerRef}
          onScroll={aoRolar}
          className="flex max-h-[55dvh] min-h-[45dvh] flex-col gap-4 overflow-y-auto p-4 lg:max-h-[62dvh]"
        >
          {carregandoHistorico ? (
            <MensagensSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-10 text-center">
              <LogoMark size="md" />
              <p className="mt-2 font-semibold text-escuro">
                Fala comigo!
              </p>
              <p className="max-w-[260px] text-sm text-neutro-muted">
                Pergunta sobre seu caixa, agenda ou clientes que eu te ajudo.
              </p>
            </div>
          ) : (
            <>
              {carregandoAntigas && (
                <p className="text-center text-xs text-neutro-muted">
                  Carregando mensagens antigas...
                </p>
              )}
              {messages.map((mensagem) => (
                <Balao
                  key={mensagem.id}
                  mensagem={mensagem}
                  confirmando={confirmandoRegistroId === mensagem.id}
                  onConfirmarRegistro={() => confirmarRegistro(mensagem)}
                  onCorrigirRegistro={() => corrigirRegistro(mensagem)}
                />
              ))}
            </>
          )}
          {enviando && <DigitandoIndicador />}
        </div>

        <div className="flex gap-2 overflow-x-auto scroll-fade-x border-t border-neutro-border px-4 py-2.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => enviarMensagem(chip)}
              disabled={enviando}
              className="flex-shrink-0 rounded-full border border-primary-border bg-primary-light px-3.5 py-1.5 text-xs font-medium text-primary-forte transition-colors hover:bg-primary hover:text-primary-text disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 border-t border-neutro-border p-3">
          <button
            type="button"
            aria-label={gravando ? "Parar ditado" : "Ditar mensagem"}
            onClick={alternarDitado}
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-button transition-colors",
              gravando
                ? "bg-erro text-white"
                : "text-neutro-muted hover:bg-primary-light hover:text-primary-forte",
            )}
          >
            <Mic className="h-5 w-5" strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(event) => aoDigitar(event.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Fala com a Mimu..."
            className="max-h-[120px] flex-1 resize-none touch-manipulation rounded-button border border-neutro-border bg-fundo px-3.5 py-2.5 text-base text-escuro outline-none placeholder:text-neutro-muted focus:border-primary-forte md:text-sm"
          />

          <button
            type="button"
            aria-label="Enviar mensagem"
            onClick={() => enviarMensagem(inputValue)}
            disabled={!inputValue.trim() || enviando}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-button bg-primary text-primary-text transition-colors hover:bg-primary-hover disabled:bg-neutro-disabled disabled:text-neutro-disabled-text"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAberto}
        title="Limpar histórico?"
        description="Isso apaga toda a conversa com a Mimu. Não dá pra desfazer."
        confirmLabel="Limpar"
        onConfirm={limparHistorico}
        onCancel={() => setConfirmAberto(false)}
      />
    </div>
  );
}

function Balao({
  mensagem,
  confirmando,
  onConfirmarRegistro,
  onCorrigirRegistro,
}: {
  mensagem: MimuMessage;
  confirmando: boolean;
  onConfirmarRegistro: () => void;
  onCorrigirRegistro: () => void;
}) {
  const isUser = mensagem.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isUser && <LogoMark size="sm" />}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-card px-4 py-2.5 text-sm text-escuro",
            isUser
              ? "rounded-br-sm border border-primary-border bg-primary-light"
              : "rounded-bl-sm border border-neutro-border bg-superficie",
          )}
        >
          <p className="whitespace-pre-wrap">{mensagem.content}</p>
        </div>
        {mensagem.card && <CartaoResposta card={mensagem.card} />}
        {mensagem.registro && (
          <CartaoConfirmacaoRegistro
            registro={mensagem.registro}
            confirmando={confirmando}
            onConfirmar={onConfirmarRegistro}
            onCorrigir={onCorrigirRegistro}
          />
        )}
        <span className="px-1 text-[11px] text-neutro-muted">
          {formatHorario(mensagem.createdAt)}
        </span>
      </div>
    </div>
  );
}

function CartaoConfirmacaoRegistro({
  registro,
  confirmando,
  onConfirmar,
  onCorrigir,
}: {
  registro: RegistroPendente;
  confirmando: boolean;
  onConfirmar: () => void;
  onCorrigir: () => void;
}) {
  if (registro.confirmado) {
    return (
      <div className="flex w-full min-w-[220px] items-center gap-2 rounded-card border border-verde/30 bg-verde-light px-4 py-3">
        <Check className="h-4 w-4 flex-shrink-0 text-verde" strokeWidth={2.5} />
        <p className="text-sm font-semibold text-verde-dark">
          {registro.tipoRegistro === "agendamento"
            ? "Agendamento criado!"
            : "Registrado!"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-[240px] rounded-card border border-neutro-border bg-superficie p-4">
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutro-muted">Tipo</dt>
          <dd className="font-semibold text-escuro">
            {TIPO_REGISTRO_LABEL[registro.tipoRegistro]}
          </dd>
        </div>
        {registro.valor !== null && (
          <div className="flex justify-between">
            <dt className="text-neutro-muted">Valor</dt>
            <dd className="font-semibold text-escuro">
              {formatCurrency(registro.valor)}
            </dd>
          </div>
        )}
        {registro.descricao && (
          <div className="flex justify-between gap-4">
            <dt className="flex-shrink-0 text-neutro-muted">Descrição</dt>
            <dd className="text-right font-semibold text-escuro">
              {registro.descricao}
            </dd>
          </div>
        )}
        {registro.cliente && (
          <div className="flex justify-between gap-4">
            <dt className="flex-shrink-0 text-neutro-muted">Cliente</dt>
            <dd className="text-right font-semibold text-escuro">
              {registro.cliente}
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-neutro-muted">Data</dt>
          <dd className="font-semibold text-escuro">
            {formatDataRegistro(registro.data)}
          </dd>
        </div>
        {registro.tipoRegistro === "agendamento" && registro.horario && (
          <div className="flex justify-between">
            <dt className="text-neutro-muted">Horário</dt>
            <dd className="font-semibold text-escuro">{registro.horario}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCorrigir}
          disabled={confirmando}
          className="flex-1 rounded-button border border-neutro-border bg-superficie py-2 text-sm font-semibold text-escuro transition-colors hover:bg-fundo disabled:opacity-50"
        >
          Corrigir
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          className="flex-1 rounded-button bg-primary py-2 text-sm font-semibold text-primary-text transition-colors hover:bg-primary-hover disabled:bg-neutro-disabled disabled:text-neutro-disabled-text"
        >
          {confirmando ? "Salvando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

function CartaoResposta({ card }: { card: MimuCard }) {
  const temComparacao =
    card.comparacaoLabel !== undefined && card.valorComparacao !== undefined;
  const subiu = (card.variacaoPercentual ?? 0) >= 0;

  return (
    <div className="w-full min-w-[220px] rounded-card border border-neutro-border bg-superficie p-4">
      <p className="text-xs text-neutro-muted">{card.titulo}</p>
      <p className="mt-1 text-2xl font-bold text-primary-forte">
        {formatCurrency(card.valor)}
      </p>
      {temComparacao && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-neutro-muted">
            {card.comparacaoLabel}: {formatCurrency(card.valorComparacao!)}
          </span>
          {card.variacaoPercentual !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 font-semibold",
                subiu ? "text-verde" : "text-erro",
              )}
            >
              {subiu ? (
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {Math.abs(card.variacaoPercentual).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DigitandoIndicador() {
  return (
    <div className="flex items-end gap-2">
      <LogoMark size="sm" />
      <div className="flex items-center gap-1 rounded-card rounded-bl-sm border border-neutro-border bg-superficie px-4 py-3.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutro-muted [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutro-muted [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutro-muted" />
      </div>
    </div>
  );
}

function MensagensSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-2xl" />
        <Skeleton className="h-14 w-2/3 rounded-card" />
      </div>
      <div className="flex flex-row-reverse items-end gap-2">
        <Skeleton className="h-10 w-1/2 rounded-card" />
      </div>
      <div className="flex items-end gap-2">
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-2xl" />
        <Skeleton className="h-20 w-3/4 rounded-card" />
      </div>
    </div>
  );
}

function MimuChatSkeleton() {
  return (
    <div className="mx-auto flex flex-col gap-4 lg:max-w-3xl">
      <div className="flex flex-col overflow-hidden rounded-card border border-neutro-border bg-superficie">
        <div className="flex items-center gap-3 border-b border-neutro-border px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex max-h-[55vh] min-h-[45vh] flex-col gap-4 p-4 lg:max-h-[62vh]">
          <MensagensSkeleton />
        </div>
      </div>
    </div>
  );
}
