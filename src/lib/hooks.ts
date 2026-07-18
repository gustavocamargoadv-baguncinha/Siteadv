"use client";

import { useCallback, useEffect, useState } from "react";
import { getStore, onTableChange, type Row } from "./store";
import type { TableName } from "./types";

export function useTable<T extends Row>(table: TableName) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await getStore().list<T>(table));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    refresh();
    return onTableChange(table, refresh);
  }, [table, refresh]);

  const insert = useCallback(
    async (row: Partial<T>) => {
      const novo = await getStore().insert<T>(table, row);
      await refresh();
      return novo;
    },
    [table, refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const r = await getStore().update<T>(table, id, patch);
      await refresh();
      return r;
    },
    [table, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await getStore().remove(table, id);
      await refresh();
    },
    [table, refresh]
  );

  return { rows, loading, erro, refresh, insert, update, remove };
}

/** Mapa id → registro, para resolver relações no cliente. */
export function byId<T extends Row>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}
