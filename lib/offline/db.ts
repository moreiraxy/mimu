import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type TabelaOffline = "transacoes" | "agendamentos" | "clientes";
export type OperacaoOffline = "insert" | "update";

export interface FilaItem {
  id: string;
  tabela: TabelaOffline;
  operacao: OperacaoOffline;
  registroId: string;
  dados: Record<string, unknown>;
  criadoEm: number;
}

type RegistroOffline = Record<string, unknown> & {
  id: string;
  sincronizado: boolean;
};

interface MimuOfflineDB extends DBSchema {
  transacoes: { key: string; value: RegistroOffline };
  agendamentos: { key: string; value: RegistroOffline };
  clientes: { key: string; value: RegistroOffline };
  fila_sincronizacao: {
    key: string;
    value: FilaItem;
    indexes: { criadoEm: number };
  };
}

const NOME_DB = "mimu-offline";
const VERSAO_DB = 1;

let dbPromise: Promise<IDBPDatabase<MimuOfflineDB>> | null = null;

/** Abre (e cria, na primeira vez) o banco local — null em contextos sem IndexedDB (SSR, testes). */
export function abrirDB(): Promise<IDBPDatabase<MimuOfflineDB>> | null {
  if (typeof indexedDB === "undefined") return null;

  if (!dbPromise) {
    dbPromise = openDB<MimuOfflineDB>(NOME_DB, VERSAO_DB, {
      upgrade(db) {
        db.createObjectStore("transacoes", { keyPath: "id" });
        db.createObjectStore("agendamentos", { keyPath: "id" });
        db.createObjectStore("clientes", { keyPath: "id" });
        const fila = db.createObjectStore("fila_sincronizacao", {
          keyPath: "id",
        });
        fila.createIndex("criadoEm", "criadoEm");
      },
    });
  }
  return dbPromise;
}

/** Quantos itens ainda esperam sincronizar — usado pelo banner/indicador de status. */
export async function contarPendentes(): Promise<number> {
  const db = await abrirDB();
  if (!db) return 0;
  return db.count("fila_sincronizacao");
}
