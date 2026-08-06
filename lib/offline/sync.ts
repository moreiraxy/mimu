import type { createClient } from "@/lib/supabase/client";
import { abrirDB, type OperacaoOffline, type TabelaOffline } from "./db";

type Supabase = ReturnType<typeof createClient>;

export interface ResultadoOffline {
  id: string;
  error: string | null;
  offline: boolean;
}

/**
 * Só considera "offline" o sinal explícito do navegador — não tenta adivinhar
 * timeout de rede vs. erro de validação. Isso mantém o caminho 100%
 * previsível pro cenário que precisa funcionar de verdade: registrar algo
 * com o Wi-Fi desligado.
 */
function estaOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function salvarOffline(
  tabela: TabelaOffline,
  operacao: OperacaoOffline,
  registroId: string,
  dados: Record<string, unknown>,
): Promise<void> {
  const db = await abrirDB();
  if (!db) throw new Error("IndexedDB indisponível neste navegador.");

  const agora = new Date().toISOString();
  const dadosParaFila =
    operacao === "insert" ? { id: registroId, ...dados } : dados;

  const tx = db.transaction([tabela, "fila_sincronizacao"], "readwrite");
  const storeRegistro = tx.objectStore(tabela);

  if (operacao === "insert") {
    await storeRegistro.put({
      ...dados,
      id: registroId,
      created_at: dados.created_at ?? agora,
      updated_at: dados.updated_at ?? agora,
      sincronizado: false,
    });
  } else {
    const atual = (await storeRegistro.get(registroId)) ?? { id: registroId };
    await storeRegistro.put({
      ...atual,
      ...dados,
      id: registroId,
      updated_at: agora,
      sincronizado: false,
    });
  }

  await tx.objectStore("fila_sincronizacao").put({
    id: crypto.randomUUID(),
    tabela,
    operacao,
    registroId,
    dados: dadosParaFila,
    criadoEm: Date.now(),
  });

  await tx.done;
}

/**
 * Tenta gravar direto no Supabase; se o navegador estiver offline, grava em
 * IndexedDB (sincronizado=false) e enfileira pra sincronizar na reconexão.
 * `insert` sempre recebe um id gerado no cliente (crypto.randomUUID()) —
 * assim o registro nunca precisa trocar de id depois de sincronizado.
 */
export async function executarComSuporteOffline(
  supabase: Supabase,
  tabela: TabelaOffline,
  operacao: OperacaoOffline,
  registroId: string,
  dados: Record<string, unknown>,
): Promise<ResultadoOffline> {
  if (estaOffline()) {
    await salvarOffline(tabela, operacao, registroId, dados);
    return { id: registroId, error: null, offline: true };
  }

  if (operacao === "insert") {
    const { error } = await supabase
      .from(tabela)
      .insert({ id: registroId, ...dados } as never);
    if (error) return { id: registroId, error: error.message, offline: false };
    return { id: registroId, error: null, offline: false };
  }

  const { error } = await supabase
    .from(tabela)
    .update(dados as never)
    .eq("id", registroId);
  if (error) return { id: registroId, error: error.message, offline: false };
  return { id: registroId, error: null, offline: false };
}

export interface ResultadoSincronizacao {
  processados: number;
  falhou: boolean;
}

/**
 * Processa a fila em ordem (mais antigo primeiro). Em update, se o servidor
 * tiver sido alterado depois que o item entrou na fila, o servidor vence — o
 * item enfileirado é descartado em vez de sobrescrever uma mudança mais nova.
 * Para no primeiro erro real de rede pra não perder a ordem nem reprocessar
 * fora de sequência.
 */
export async function processarFila(
  supabase: Supabase,
): Promise<ResultadoSincronizacao> {
  const db = await abrirDB();
  if (!db || estaOffline()) return { processados: 0, falhou: false };

  const itens = await db.getAllFromIndex("fila_sincronizacao", "criadoEm");
  let processados = 0;

  for (const item of itens) {
    let sucesso = false;

    if (item.operacao === "insert") {
      const { error } = await supabase.from(item.tabela).insert(item.dados as never);
      // 23505 = já existe (reenvio da mesma fila) — trata como sucesso.
      sucesso = !error || (error as { code?: string }).code === "23505";
    } else {
      const { data: servidor } = await supabase
        .from(item.tabela)
        .select("updated_at")
        .eq("id", item.registroId)
        .maybeSingle();

      const registroServidor = servidor as { updated_at?: string } | null;
      const servidorMaisRecente =
        !!registroServidor?.updated_at &&
        new Date(registroServidor.updated_at).getTime() > item.criadoEm;

      if (servidorMaisRecente) {
        sucesso = true; // conflito: servidor vence, descarta a edição local
      } else {
        const { error } = await supabase
          .from(item.tabela)
          .update(item.dados as never)
          .eq("id", item.registroId);
        sucesso = !error;
      }
    }

    if (!sucesso) return { processados, falhou: true };

    const tx = db.transaction([item.tabela, "fila_sincronizacao"], "readwrite");
    const storeRegistro = tx.objectStore(item.tabela);
    const registroLocal = await storeRegistro.get(item.registroId);
    if (registroLocal) {
      await storeRegistro.put({ ...registroLocal, sincronizado: true });
    }
    await tx.objectStore("fila_sincronizacao").delete(item.id);
    await tx.done;

    processados++;
  }

  return { processados, falhou: false };
}
