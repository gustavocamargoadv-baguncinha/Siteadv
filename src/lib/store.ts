// Camada de dados com dois backends intercambiáveis:
//  - LocalStore: persiste no localStorage (modo demo/offline, zero configuração)
//  - SupaStore:  persiste no Supabase (produção multiusuário)
// A escolha é automática: com credenciais do Supabase no ambiente, usa Supabase.

import { DEMO_SEED } from "./demo-seed";
import { getSupabase, supabaseConfigurado } from "./supabase";
import type { TableName } from "./types";

export interface Row {
  id: string;
  created_at?: string;
}

export interface Store {
  list<T extends Row>(table: TableName): Promise<T[]>;
  insert<T extends Row>(table: TableName, row: Partial<T>): Promise<T>;
  update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
}

const PREFIX = "camargoadv:";

function emitChange(table: TableName) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`${PREFIX}changed`, { detail: { table } }));
  }
}

export function onTableChange(table: TableName, cb: () => void): () => void {
  const handler = (e: Event) => {
    if ((e as CustomEvent).detail?.table === table) cb();
  };
  window.addEventListener(`${PREFIX}changed`, handler);
  return () => window.removeEventListener(`${PREFIX}changed`, handler);
}

class LocalStore implements Store {
  private ensureSeed() {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(PREFIX + "seeded")) {
      for (const [table, rows] of Object.entries(DEMO_SEED)) {
        if (!localStorage.getItem(PREFIX + table)) {
          const stamped = rows.map((r) => ({ created_at: new Date().toISOString(), ...r }));
          localStorage.setItem(PREFIX + table, JSON.stringify(stamped));
        }
      }
      localStorage.setItem(PREFIX + "seeded", "1");
    }
  }

  private read<T>(table: TableName): T[] {
    if (typeof window === "undefined") return [];
    this.ensureSeed();
    try {
      return JSON.parse(localStorage.getItem(PREFIX + table) || "[]") as T[];
    } catch {
      return [];
    }
  }

  private write<T>(table: TableName, rows: T[]) {
    localStorage.setItem(PREFIX + table, JSON.stringify(rows));
    emitChange(table);
  }

  async list<T extends Row>(table: TableName): Promise<T[]> {
    return this.read<T>(table);
  }

  async insert<T extends Row>(table: TableName, row: Partial<T>): Promise<T> {
    const rows = this.read<T>(table);
    const novo = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...row,
    } as T;
    rows.push(novo);
    this.write(table, rows);
    return novo;
  }

  async update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Promise<T> {
    const rows = this.read<T>(table);
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) throw new Error(`Registro ${id} não encontrado em ${table}`);
    rows[i] = { ...rows[i], ...patch };
    this.write(table, rows);
    return rows[i];
  }

  async remove(table: TableName, id: string): Promise<void> {
    const rows = this.read<Row>(table).filter((r) => r.id !== id);
    this.write(table, rows);
  }
}

class SupaStore implements Store {
  async list<T extends Row>(table: TableName): Promise<T[]> {
    const { data, error } = await getSupabase().from(table).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as T[];
  }

  async insert<T extends Row>(table: TableName, row: Partial<T>): Promise<T> {
    const { data, error } = await getSupabase().from(table).insert(row as never).select().single();
    if (error) throw error;
    emitChange(table);
    return data as T;
  }

  async update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Promise<T> {
    const { data, error } = await getSupabase().from(table).update(patch as never).eq("id", id).select().single();
    if (error) throw error;
    emitChange(table);
    return data as T;
  }

  async remove(table: TableName, id: string): Promise<void> {
    const { error } = await getSupabase().from(table).delete().eq("id", id);
    if (error) throw error;
    emitChange(table);
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (!store) store = supabaseConfigurado ? new SupaStore() : new LocalStore();
  return store;
}

/** Apaga os dados locais do modo demo e restaura os dados de exemplo. */
export function resetarDadosDemo() {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
