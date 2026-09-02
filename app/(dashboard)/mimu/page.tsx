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
  ArrowUp,
  ArrowUpRight,
  Check,
  History,
  Loader2,
  Mic,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useDitado } from "@/hooks/useDitado";
import { LogoMark, MarcaTraco } from "@/components/Logo";
import { FolhaAcoes } from "@/components/dashboard/FolhaAcoes";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FolhaHistorico } from "./FolhaHistorico";
import { cn, paraISOLocal } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { salvarCorrecaoMimu, type CorrecaoMimu } from "@/lib/mimu-correcao";
import type { Json } from "@/types/database";
import type { MimuCard, RegistroPendente, TipoRegistroMimu } from "@/lib/mimu-prompts";

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

/**
 * Quanto tempo o "digitando" fica na tela, no mínimo.
 *
 * 700ms é o tempo de um olhar: dá para ver que ela está respondendo sem que a
 * conversa pareça travada. Abaixo disso vira piscada; acima, começa a parecer
 * lentidão inventada.
 */
const TEMPO_MINIMO_DIGITANDO = 700;

export default function MimuChatPage() {
  const { user, empresa, modulos, loading: carregandoAuth } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [messages, setMessages] = useState<MimuMessage[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [temMaisAntigas, setTemMaisAntigas] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  /*
   * O ditado grava e manda transcrever no servidor — ver hooks/useDitado.ts
   * para o porquê de não ser mais a API de voz do navegador.
   *
   * O texto ENTRA NO CAMPO em vez de virar mensagem sozinho: falar é um jeito
   * de escrever, não de enviar. Quem dita quer ler o que a máquina entendeu
   * antes de mandar — ainda mais quando a frase tem um valor em dinheiro
   * dentro.
   */
  const ditado = useDitado({
    aoTranscrever: (texto) =>
      setInputValue((atual) => (atual ? `${atual} ${texto}` : texto)),
    aoFalhar: (mensagem) => showToast(mensagem),
  });

  // O primeiro nome abre a conversa ("Olá, Rayssa"). Cai em "por aqui" pelo
  // mesmo motivo do painel: saudação sem nome é melhor que saudação com um
  // "undefined" no meio.
  const primeiroNome =
    (user?.user_metadata?.nome_completo as string | undefined)?.split(" ")[0] ??
    "por aqui";
  const [confirmandoRegistroId, setConfirmandoRegistroId] = useState<
    string | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  /*
   * A pergunta digitada na barra de baixo chega aqui pela URL e é enviada
   * sozinha.
   *
   * A barra "Pergunte à Mimu" virou um campo de verdade: quem escreve ali e
   * aperta enviar espera que a conversa já ABRA com a mensagem mandada — não
   * que a tela abra vazia e ela tenha que digitar tudo de novo.
   *
   * Espera o histórico carregar, senão a resposta apareceria antes das
   * mensagens antigas e daria um pulo na lista. O `enviadaDaUrlRef` garante
   * que isso aconteça UMA vez: sem ele, qualquer re-render mandaria de novo,
   * e cada envio custa duas chamadas ao Groq.
   *
   * A URL é limpa logo em seguida — sem isso, recarregar a página (ou voltar
   * para ela pelo histórico do navegador) reenviaria a mesma pergunta.
   */
  const enviadaDaUrlRef = useRef(false);

  useEffect(() => {
    if (enviadaDaUrlRef.current || carregandoHistorico || !empresa) return;

    const pergunta = new URLSearchParams(window.location.search).get("q");
    if (!pergunta?.trim()) return;

    enviadaDaUrlRef.current = true;
    /*
     * Limpa a URL com o histórico do navegador, e não com `router.replace`.
     *
     * O `replace` do Next é uma NAVEGAÇÃO: ele entra na fila do roteador no
     * meio do envio que acabou de começar, e na prática o `?q=` continuava na
     * barra de endereço. Ficando ali, recarregar a página monta o componente de
     * novo, o ref nasce zerado, e a mesma pergunta é enviada outra vez — duas
     * chamadas ao Groq por um F5.
     *
     * `replaceState` só reescreve o endereço. É exatamente o que se quer aqui:
     * apagar o rastro sem mexer no que está acontecendo na tela.
     */
    window.history.replaceState(null, "", "/mimu");
    void enviarMensagem(pergunta);
    // `enviarMensagem` é recriada a cada render e entrar aqui provocaria o
    // laço que o ref já impede; as dependências que importam são estas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoHistorico, empresa?.id]);

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
    const comecou = Date.now();

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

      /*
       * A MIMU DIGITA ANTES DE FALAR, sempre — mesmo quando a resposta chega
       * rápido.
       *
       * O indicador de "digitando" já existia, mas ele durava exatamente o
       * tempo da rede: numa resposta de 200ms ele piscava e sumia, e a
       * mensagem simplesmente aparecia do nada. Um piscar é pior que nada,
       * porque o olho registra o movimento sem conseguir ler o que era.
       *
       * O piso é de tempo TOTAL, e não uma espera somada: uma resposta que
       * demorou 3 segundos sai na hora, sem penalidade. Só a resposta rápida
       * demais espera completar o mínimo.
       */
      const faltando = TEMPO_MINIMO_DIGITANDO - (Date.now() - comecou);
      if (faltando > 0) {
        await new Promise((resolve) => setTimeout(resolve, faltando));
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
    /*
      O chat OCUPA A TELA INTEIRA, por cima de tudo — inclusive da barra de
      baixo.

      Era um cartão com borda no meio da página, com cabeçalho próprio ("Mimu /
      Online"), a conversa espremida numa altura fixa de 55% da tela e a barra
      de navegação ainda visível embaixo. Conversar é uma coisa que se faz de
      corpo inteiro: qualquer moldura em volta rouba altura da conversa e
      lembra o tempo todo que você está "dentro de uma tela" do app.

      Na referência não há moldura, não há título e não há barra: há a conversa,
      um X para sair e o campo. É o que está aqui.
    */
    <div className="fixed inset-0 z-50 flex flex-col bg-fundo">
      <header
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fechar conversa"
          className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        {/* O relógio abre as CONVERSAS RECENTES — as do app e as do WhatsApp.
            Era uma lixeira: apagar tudo, a coisa mais destrutiva possível, era
            a única disponível num canto que a referência usa para VOLTAR ao
            que já foi conversado. Limpar continua existindo, como último item
            de dentro da folha. */}
        <button
          type="button"
          aria-label="Conversas recentes"
          onClick={() => setHistoricoAberto(true)}
          className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
        >
          <History className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </header>

      <div
        ref={containerRef}
        onScroll={aoRolar}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2"
      >
        {carregandoHistorico ? (
          <MensagensSkeleton />
        ) : messages.length === 0 ? (
          /*
            O vazio é o centro da tela, e não um aviso no alto.
            É onde a marca se apresenta e faz a pergunta — a única coisa na
            tela, para a resposta ser a próxima.
          */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <MarcaTraco size={58} className="text-escuro" />
            <p className="mt-2 text-[22px] font-bold leading-tight text-escuro">
              Olá, {primeiroNome}
            </p>
            <p className="text-[20px] leading-tight text-neutro-muted">
              Como posso te ajudar?
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

      <div
        className="flex flex-col gap-3 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)" }}
      >
        {/* As sugestões ficam logo ACIMA do campo, rolando na horizontal —
            perto do polegar e do que vai ser digitado, não presas num
            rodapé separado. */}
        <div className="scroll-fade-x -mr-4 flex gap-2 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => enviarMensagem(chip)}
              disabled={enviando}
              className="vidro-card flex-shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold text-escuro disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2.5">
          {/* O "+" abre as ações de criar. Na referência ele guarda anexos;
              aqui guarda o que a Mimu serve para fazer — registrar venda,
              despesa, agendamento. */}
          <button
            type="button"
            aria-label="Nova ação"
            onClick={() => setAcoesAbertas(true)}
            className="vidro-card flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-escuro"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="vidro-card flex min-h-[48px] flex-1 items-end gap-2 rounded-[24px] py-2 pl-4 pr-2">
            <textarea
              ref={textareaRef}
              /*
                O TECLADO SOBE JUNTO COM A CONVERSA.

                Quem toca no M da barra quer escrever — é o gesto inteiro da
                referência: um toque abre a conversa com o cursor já no campo.
                Sem isto, abrir a Mimu custava dois toques, e o segundo era num
                campo lá embaixo, do outro lado da tela.

                `autoFocus` do React vira um `focus()` logo depois de montar. No
                Safari isso só abre o teclado quando a montagem veio de um toque
                — que é exatamente o caso aqui — e quando não vem, o pior que
                acontece é o campo ficar focado sem teclado, como antes.
              */
              autoFocus
              rows={1}
              value={inputValue}
              onChange={(event) => aoDigitar(event.target.value)}
              onKeyDown={aoTeclar}
              placeholder="Envie uma mensagem"
              className="max-h-[120px] flex-1 resize-none touch-manipulation bg-transparent py-1.5 text-base text-escuro outline-none placeholder:text-neutro-muted"
            />

            {/*
              UM botão só, que troca de papel: microfone enquanto não há texto,
              enviar assim que há. É o que a referência faz, e evita dois
              botões redondos disputando o mesmo canto — com o campo vazio,
              "enviar" não tem o que fazer.
            */}
            {inputValue.trim() ? (
              <button
                type="button"
                aria-label="Enviar mensagem"
                onClick={() => enviarMensagem(inputValue)}
                disabled={enviando}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-text disabled:opacity-50"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                aria-label={
                  ditado.estado === "gravando"
                    ? "Parar e transcrever"
                    : ditado.estado === "transcrevendo"
                      ? "Transcrevendo"
                      : "Gravar áudio"
                }
                onClick={ditado.alternar}
                disabled={ditado.estado === "transcrevendo"}
                className={cn(
                  "flex h-9 flex-shrink-0 items-center justify-center gap-1.5 rounded-full transition-[width,background-color]",
                  // Gravando, o botão cresce para caber o contador. É o que
                  // diz que está ouvindo AGORA — e o número subindo é a prova
                  // de que não travou, que era exatamente a dúvida de antes.
                  ditado.estado === "gravando"
                    ? "w-[68px] bg-erro px-2 text-white"
                    : "w-9 bg-escuro text-fundo",
                )}
              >
                {ditado.estado === "transcrevendo" ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2} />
                ) : ditado.estado === "gravando" ? (
                  <>
                    <Square className="h-3 w-3 fill-current" strokeWidth={0} />
                    <span className="text-[12px] font-bold tabular-nums">
                      {Math.floor(ditado.segundos / 60)}:
                      {String(ditado.segundos % 60).padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <Mic className="h-[18px] w-[18px]" strokeWidth={2} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <FolhaAcoes
        aberta={acoesAbertas}
        aoFechar={() => setAcoesAbertas(false)}
        modulos={modulos}
      />

      <FolhaHistorico
        aberta={historicoAberto}
        aoFechar={() => setHistoricoAberto(false)}
        empresaId={empresa.id}
        aoPedirLimpeza={() => setConfirmAberto(true)}
      />

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
              : "vidro-card rounded-bl-sm",
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
        <Check className="h-4 w-4 flex-shrink-0 text-verde-texto" strokeWidth={2.5} />
        <p className="text-sm font-semibold text-verde-texto">
          {registro.tipoRegistro === "agendamento"
            ? "Agendamento criado!"
            : "Registrado!"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-[240px] vidro-card rounded-[20px] p-4">
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
          className="flex-1 vidro-card rounded-button py-2 text-sm font-semibold text-escuro transition-colors hover:bg-fundo disabled:opacity-50"
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
    <div className="w-full min-w-[220px] vidro-card rounded-[20px] p-4">
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
                subiu ? "text-verde-texto" : "text-erro-texto",
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
      <div className="flex items-center gap-1 rounded-card vidro-card rounded-bl-sm px-4 py-3.5">
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
      <div className="flex flex-col overflow-hidden vidro-card rounded-[20px]">
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
