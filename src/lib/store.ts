// Camada de dados com dois backends intercambiáveis:
//  - LocalStore: persiste no localStorage (modo demo/offline, zero configuração)
//  - SupaStore:  persiste no Supabase (produção multiusuário)
// A escolha é automática: com credenciais do Supabase no ambiente, usa Supabase.

import { DEMO_SEED } from "./demo-seed";
import { CLIENTES_2026, LANCAMENTOS_2026 } from "./import-2026";
import { CONTRATOS_ZAPSIGN } from "./import-contratos";
import { AUDIENCIAS_ESAJ } from "./import-audiencias";
import { getSupabase, supabaseConfigurado } from "./supabase";
import type { Cliente, ContratoHonorarios, EventoAgenda, Lancamento, Processo, TableName } from "./types";

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

/** Marca o localStorage do modo demo como já semeado, porém vazio — usado antes
 *  de importar dados reais para não trazer junto os exemplos fictícios. */
function limparTudoLocal() {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  for (const table of Object.keys(DEMO_SEED)) {
    localStorage.setItem(PREFIX + table, "[]");
  }
  localStorage.setItem(PREFIX + "seeded", "1");
}

export interface ResultadoImportacao {
  clientesNovos: number;
  lancamentosNovos: number;
  jaImportados: number;
}

/** Importa os clientes e lançamentos reais de 2026 (planilha do escritório).
 *  Idempotente: registros já importados (id com prefixo "imp26") são pulados.
 *  Se `limparAntes`, remove os dados de demonstração fictícios primeiro. */
export async function importarDados2026(limparAntes: boolean): Promise<ResultadoImportacao> {
  if (limparAntes) limparTudoLocal();
  const s = getStore();

  const clientesExistentes = new Set((await s.list<Cliente>("clientes")).map((c) => c.id));
  const lancExistentes = new Set((await s.list<Lancamento>("lancamentos")).map((l) => l.id));

  let clientesNovos = 0;
  let lancamentosNovos = 0;
  let jaImportados = 0;

  for (const c of CLIENTES_2026) {
    if (c.id && clientesExistentes.has(c.id)) {
      jaImportados++;
      continue;
    }
    await s.insert<Cliente>("clientes", c as Partial<Cliente>);
    clientesNovos++;
  }

  for (const l of LANCAMENTOS_2026) {
    if (l.id && lancExistentes.has(l.id)) continue;
    await s.insert<Lancamento>("lancamentos", l as Partial<Lancamento>);
    lancamentosNovos++;
  }

  return { clientesNovos, lancamentosNovos, jaImportados };
}

export interface ResultadoContratos {
  clientesNovos: number;
  clientesEnriquecidos: number;
  processosNovos: number;
  contratosNovos: number;
}

/** Importa os contratos do ZapSign: cada contratante vira/atualiza um Cliente,
 *  cada contrato vira um Processo (defendido + autos) e um Contrato de honorários.
 *  Não recria pagamentos — o saldo em aberto sai dos recebimentos já importados.
 *  Idempotente: processos e contratos usam ids estáveis (prefixo "impzp"). */
export async function importarContratosZapsign(): Promise<ResultadoContratos> {
  const s = getStore();
  const clientes = await s.list<Cliente>("clientes");
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));
  const processosExistentes = new Set((await s.list<Processo>("processos")).map((p) => p.id));
  const contratosExistentes = new Set((await s.list<ContratoHonorarios>("contratos_honorarios")).map((h) => h.id));

  let clientesNovos = 0;
  let clientesEnriquecidos = 0;
  let processosNovos = 0;
  let contratosNovos = 0;

  for (const ct of CONTRATOS_ZAPSIGN) {
    const notaRevisar = ct.revisar
      ? " Vínculo provável com o pagamento do extrato — conferir se é a mesma pessoa."
      : "";

    // dados de qualificação vindos do contrato
    const dadosCliente: Partial<Cliente> = {
      nome: ct.contratante,
      cpf_cnpj: ct.cpf || undefined,
      rg: ct.rg || undefined,
      nacionalidade: ct.nacionalidade || undefined,
      estado_civil: ct.estado_civil || undefined,
      profissao: ct.profissao || undefined,
      endereco: ct.endereco || undefined,
      email: ct.email || undefined,
      telefone: ct.telefone || undefined,
    };

    // 1) resolver cliente (enriquecer o do extrato ou criar novo)
    let clienteId: string;
    const alvo = ct.match_id ? clientesPorId.get(ct.match_id) : undefined;
    if (alvo) {
      // preserva o que já existe; completa com os dados do contrato
      const patch: Partial<Cliente> = {};
      for (const [k, v] of Object.entries(dadosCliente)) {
        if (v && !alvo[k as keyof Cliente]) (patch as Record<string, unknown>)[k] = v;
      }
      // nome truncado do extrato → nome completo do contrato
      patch.nome = ct.contratante;
      // nota idempotente: remove qualquer nota ZapSign anterior antes de reescrever,
      // para reimportar não empilhar o mesmo texto várias vezes
      const notaBase = (alvo.notas ?? "").split("Dados completados pelo contrato")[0].trim();
      patch.notas = `${notaBase ? notaBase + " " : ""}Dados completados pelo contrato (ZapSign).${notaRevisar}`.trim();
      await s.update<Cliente>("clientes", alvo.id, patch);
      clienteId = alvo.id;
      clientesEnriquecidos++;
    } else {
      const novoId = `impzp-c-${String(ct.idx).padStart(2, "0")}`;
      if (!clientesPorId.has(novoId)) {
        await s.insert<Cliente>("clientes", {
          id: novoId,
          tipo: "pf",
          ...dadosCliente,
          notas: `Cadastrado a partir do contrato (ZapSign).${notaRevisar}`,
        } as Partial<Cliente>);
        clientesNovos++;
      }
      clienteId = novoId;
    }

    // 2) processo (defendido + autos)
    const processoId = `impzp-p-${String(ct.idx).padStart(2, "0")}`;
    const defesaDe = ct.defendido ? ct.defendido : "o(a) próprio(a) contratante";
    if (!processosExistentes.has(processoId)) {
      await s.insert<Processo>("processos", {
        id: processoId,
        numero_cnj: ct.numero_cnj || undefined,
        cliente_id: clienteId,
        area: "criminal",
        tribunal: "TJSP",
        vara: ct.vara || undefined,
        comarca: ct.comarca || undefined,
        status: "ativo",
        parte_contraria: "Ministério Público",
        objeto: `Defesa de ${defesaDe}${ct.cpf_defendido ? ` (CPF ${ct.cpf_defendido})` : ""}${
          ct.numero_cnj ? ` — autos ${ct.numero_cnj}` : ""
        }. Origem: contrato ${ct.arquivo}.`,
        monitorado: false,
      } as Partial<Processo>);
      processosNovos++;
    }

    // 3) contrato de honorários
    const contratoId = `impzp-h-${String(ct.idx).padStart(2, "0")}`;
    const parcela = Math.round((ct.valor / ct.parcelas) * 100) / 100;
    if (!contratosExistentes.has(contratoId)) {
      await s.insert<ContratoHonorarios>("contratos_honorarios", {
        id: contratoId,
        cliente_id: clienteId,
        processo_id: processoId,
        tipo: "fixo",
        valor_fixo: ct.valor,
        descricao: `${ct.parcelas}x de ${parcela.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })} — defesa de ${defesaDe}. Assinado em ${ct.assinatura} (${ct.status_contrato}).`,
        status: "ativo",
      } as Partial<ContratoHonorarios>);
      contratosNovos++;
    }
  }

  return { clientesNovos, clientesEnriquecidos, processosNovos, contratosNovos };
}

export interface ResultadoAudiencias {
  novas: number;
  vinculadas: number;
}

/** Importa as audiências do e-SAJ como eventos da agenda. Quando o processo já
 *  existe (contratos ZapSign), vincula ao processo e ao cliente. Idempotente. */
export async function importarAudienciasEsaj(): Promise<ResultadoAudiencias> {
  const s = getStore();
  const eventosExistentes = new Set((await s.list<EventoAgenda>("eventos_agenda")).map((e) => e.id));
  const processos = await s.list<Processo>("processos");
  const processosPorId = new Map(processos.map((p) => [p.id, p]));
  const digitos = (c?: string) => (c ?? "").replace(/\D/g, "");
  const processosPorCnj = new Map(processos.filter((p) => p.numero_cnj).map((p) => [digitos(p.numero_cnj), p]));

  let novas = 0;
  let vinculadas = 0;

  for (const a of AUDIENCIAS_ESAJ) {
    if (eventosExistentes.has(a.id)) continue;
    // resolve processo: id explícito, senão por número CNJ
    const proc = (a.processo_id && processosPorId.get(a.processo_id)) || processosPorCnj.get(digitos(a.numero_cnj));
    if (proc) vinculadas++;

    const notas = [
      a.tipo_audiencia,
      a.crime,
      a.redesignada ? "AUDIÊNCIA REDESIGNADA" : null,
      `Autos ${a.numero_cnj}`,
      "Fonte: e-SAJ TJSP",
    ]
      .filter(Boolean)
      .join(" · ");

    await s.insert<EventoAgenda>("eventos_agenda", {
      id: a.id,
      tipo: "audiencia",
      titulo: `Audiência — ${a.defendido}`,
      processo_id: proc?.id,
      cliente_id: proc?.cliente_id,
      // horário de parede (sem conversão de fuso): a hora da audiência é sempre
      // a mesma independente do dispositivo/fuso de quem abre a agenda
      inicio: a.inicio.replace(/-03:00$/, ""),
      local: a.sala,
      notas,
    } as Partial<EventoAgenda>);
    novas++;
  }

  return { novas, vinculadas };
}
