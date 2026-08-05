// Camada de dados com dois backends intercambiáveis:
//  - LocalStore: persiste no localStorage (modo demo/offline, zero configuração)
//  - SupaStore:  persiste no Supabase (produção multiusuário)
// A escolha é automática: com credenciais do Supabase no ambiente, usa Supabase.

import { DEMO_SEED } from "./demo-seed";
import { CLIENTES_2026, LANCAMENTOS_2026 } from "./import-2026";
import { CONTRATOS_ZAPSIGN } from "./import-contratos";
import { CONTRATOS_MANUAIS } from "./import-contratos-extra";
import { AUDIENCIAS_ESAJ } from "./import-audiencias";
import { CASOS_WHATSAPP, REMOVER_CLIENTES } from "./import-casos";
import { getSupabase, supabaseConfigurado } from "./supabase";
import type { Andamento, Cliente, ContratoHonorarios, EventoAgenda, Lancamento, Processo, TableName } from "./types";

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
  const lancExistentes = new Set((await s.list<Lancamento>("lancamentos")).map((l) => l.id));

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

  // Contratos combinados fora do ZapSign (informados manualmente), vinculados a
  // clientes que já existem.
  for (const cm of CONTRATOS_MANUAIS) {
    const alvo = clientesPorId.get(cm.cliente_id);
    if (alvo) {
      const patch: Partial<Cliente> = {};
      if (cm.contratante && cm.contratante !== alvo.nome) patch.nome = cm.contratante;
      if (cm.cpf && !alvo.cpf_cnpj) patch.cpf_cnpj = cm.cpf;
      if (cm.rg && !alvo.rg) patch.rg = cm.rg;
      if (cm.endereco && !alvo.endereco) patch.endereco = cm.endereco;
      if (cm.nota) {
        const base = (alvo.notas ?? "").split("Contrato combinado")[0].trim();
        patch.notas = `${base ? base + " " : ""}Contrato combinado (fora do ZapSign). ${cm.nota}`.trim();
      }
      if (Object.keys(patch).length) {
        await s.update<Cliente>("clientes", alvo.id, patch);
        clientesEnriquecidos++;
      }
    } else {
      // cliente que ainda não existia no sistema (contrato presencial/eletrônico
      // de quem não aparecia no extrato). Cria com os dados informados.
      await s.insert<Cliente>("clientes", {
        id: cm.cliente_id,
        tipo: "pf",
        nome: cm.contratante,
        cpf_cnpj: cm.cpf || undefined,
        rg: cm.rg || undefined,
        endereco: cm.endereco || undefined,
        notas: `Contrato combinado (fora do ZapSign).${cm.nota ? " " + cm.nota : ""}`.trim(),
      } as Partial<Cliente>);
      clientesPorId.set(cm.cliente_id, { id: cm.cliente_id } as Cliente);
      clientesNovos++;
    }

    // entrada já paga antes do período do extrato importado
    if (cm.entrada) {
      const entradaId = `impzp-entrada-${String(cm.idx).padStart(2, "0")}`;
      if (!lancExistentes.has(entradaId)) {
        await s.insert<Lancamento>("lancamentos", {
          id: entradaId,
          tipo: "receita",
          categoria: "Honorários",
          cliente_id: cm.cliente_id,
          descricao: `Entrada — honorários (${cm.contratante})`,
          valor: cm.entrada.valor,
          vencimento: cm.entrada.data,
          pago_em: cm.entrada.data,
        } as Partial<Lancamento>);
      }
    }

    const procId = `impzp-p-${String(cm.idx).padStart(2, "0")}`;
    if (!processosExistentes.has(procId)) {
      await s.insert<Processo>("processos", {
        id: procId,
        numero_cnj: cm.numero_cnj || undefined,
        cliente_id: cm.cliente_id,
        area: "criminal",
        tribunal: "TJSP",
        status: "ativo",
        parte_contraria: "Ministério Público",
        objeto: `Defesa de ${cm.defendido}${cm.numero_cnj ? ` — autos ${cm.numero_cnj}` : ""}. Contrato combinado (fora do ZapSign).`,
        monitorado: false,
      } as Partial<Processo>);
      processosNovos++;
    }

    const contId = `impzp-h-${String(cm.idx).padStart(2, "0")}`;
    if (!contratosExistentes.has(contId)) {
      await s.insert<ContratoHonorarios>("contratos_honorarios", {
        id: contId,
        cliente_id: cm.cliente_id,
        processo_id: procId,
        tipo: "fixo",
        valor_fixo: cm.valor,
        descricao: `${cm.observacao ?? `${cm.parcelas}x de ${cm.parcela_valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`} — defesa de ${cm.defendido}.`,
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

export interface ResultadoDataJud {
  processosConsultados: number;
  andamentosNovos: number;
  erros: number;
}

/** Busca as movimentações dos processos (com número CNJ) na API Pública do
 *  DataJud e grava os andamentos novos. Idempotente: movimentos já registrados
 *  (mesma data + descrição no mesmo processo) são pulados. */
export async function atualizarMovimentacoesDataJud(): Promise<ResultadoDataJud> {
  const s = getStore();
  const processos = (await s.list<Processo>("processos")).filter((p) => p.numero_cnj);
  const numeros = processos.map((p) => p.numero_cnj!);
  if (!numeros.length) return { processosConsultados: 0, andamentosNovos: 0, erros: 0 };

  const res = await fetch("/api/tribunais/datajud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeros }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    resultado?: Record<string, { data: string; descricao: string }[]>;
    erros?: Record<string, string>;
  };
  const resultado = json.resultado ?? {};
  const erros = json.erros ? Object.keys(json.erros).length : 0;

  const andamentos = await s.list<Andamento>("andamentos");
  let andamentosNovos = 0;

  for (const p of processos) {
    const d = (p.numero_cnj ?? "").replace(/\D/g, "");
    const movs = resultado[d] ?? [];
    const existentes = new Set(
      andamentos.filter((a) => a.processo_id === p.id).map((a) => `${a.data}|${a.descricao}`)
    );
    for (const m of movs) {
      const chave = `${m.data}|${m.descricao}`;
      if (existentes.has(chave)) continue;
      existentes.add(chave);
      await s.insert<Andamento>("andamentos", {
        processo_id: p.id,
        data: m.data,
        descricao: m.descricao,
        origem: "tribunal",
      });
      andamentosNovos++;
    }
  }

  return { processosConsultados: numeros.length, andamentosNovos, erros };
}

export interface ResultadoVincendas {
  contratos: number;
  parcelasGeradas: number;
}

function somaMesesData(iso: string, meses: number): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const alvo = new Date(a, m - 1 + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimoDia));
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, "0")}-${String(alvo.getDate()).padStart(2, "0")}`;
}

/** Gera as parcelas AINDA A VENCER de cada contrato (ZapSign), lançando-as no
 *  Financeiro como recebimentos futuros. Desconta o que o cliente já pagou (não
 *  duplica), segue a cadência mensal a partir do dia da assinatura e só cria as
 *  parcelas com vencimento a partir do mês atual. Pode rodar de novo: as parcelas
 *  a vencer geradas antes (id "impzp-venc-") são substituídas. */
export async function gerarParcelasVincendas(): Promise<ResultadoVincendas> {
  const s = getStore();
  const lancs = await s.list<Lancamento>("lancamentos");

  // remove as parcelas a vencer geradas em execuções anteriores (recomeça limpo)
  for (const l of lancs.filter((x) => x.id.startsWith("impzp-venc-"))) {
    await s.remove("lancamentos", l.id);
  }

  const pagosPorCliente = new Map<string, number>();
  const pagoEmData = new Set<string>(); // "cliente_id|vencimento" já quitado nessa data
  for (const l of lancs) {
    if (l.tipo === "receita" && l.pago_em && l.cliente_id && !l.id.startsWith("impzp-venc-")) {
      pagosPorCliente.set(l.cliente_id, (pagosPorCliente.get(l.cliente_id) ?? 0) + l.valor);
      pagoEmData.add(`${l.cliente_id}|${l.vencimento}`);
    }
  }

  const cutoff = new Date().toISOString().slice(0, 10); // só parcelas de hoje pra frente

  let contratos = 0;
  let parcelasGeradas = 0;

  for (const ct of CONTRATOS_ZAPSIGN) {
    const clienteId = ct.match_id ?? `impzp-c-${String(ct.idx).padStart(2, "0")}`;
    const parcela = Math.round((ct.valor / ct.parcelas) * 100) / 100;
    const jaPago = pagosPorCliente.get(clienteId) ?? 0;
    const pagas = Math.min(ct.parcelas, Math.max(0, Math.round(jaPago / parcela)));
    if (pagas >= ct.parcelas) continue; // contrato quitado

    let gerouAlguma = false;
    for (let k = pagas + 1; k <= ct.parcelas; k++) {
      const venc = somaMesesData(ct.assinatura, k - 1);
      if (venc < cutoff) continue; // parcela no passado — assume-se resolvida (saldo fica na ficha do cliente)
      const ultima = k === ct.parcelas;
      const valor = ultima ? Math.round((ct.valor - parcela * (ct.parcelas - 1)) * 100) / 100 : parcela;
      await s.insert<Lancamento>("lancamentos", {
        id: `impzp-venc-${String(ct.idx).padStart(2, "0")}-${k}`,
        tipo: "receita",
        categoria: "Honorários",
        cliente_id: clienteId,
        processo_id: `impzp-p-${String(ct.idx).padStart(2, "0")}`,
        descricao: `Parcela ${k}/${ct.parcelas} — honorários (${ct.contratante})`,
        valor,
        vencimento: venc,
      } as Partial<Lancamento>);
      parcelasGeradas++;
      gerouAlguma = true;
    }
    if (gerouAlguma) contratos++;
  }

  // Contratos combinados (fora do ZapSign): cadência a partir do dia médio de
  // pagamento do cliente, começando na próxima ocorrência desse dia.
  const hojeD = new Date();
  for (const cm of CONTRATOS_MANUAIS) {
    const jaPago = pagosPorCliente.get(cm.cliente_id) ?? 0;
    const saldo = Math.round((cm.valor - jaPago) * 100) / 100;
    if (saldo < 0.5) continue; // quitado
    const nRestantes = Math.max(1, Math.round(saldo / cm.parcela_valor));

    // primeiro vencimento: próxima ocorrência do dia_venc a partir de hoje
    let base = new Date(hojeD.getFullYear(), hojeD.getMonth(), cm.dia_venc);
    if (base.toISOString().slice(0, 10) < cutoff) base = new Date(hojeD.getFullYear(), hojeD.getMonth() + 1, cm.dia_venc);
    const baseISO = base.toISOString().slice(0, 10);

    let gerouAlguma = false;
    let colocadas = 0; // parcelas a vencer já geradas
    let mes = 0; // deslocamento de meses a partir do primeiro vencimento
    // gera exatamente nRestantes parcelas, pulando os meses cuja data já foi
    // quitada (ex.: 1ª parcela paga na assinatura, no próprio dia do vencimento)
    while (colocadas < nRestantes && mes < nRestantes + 12) {
      const venc = somaMesesData(baseISO, mes);
      mes++;
      if (pagoEmData.has(`${cm.cliente_id}|${venc}`)) continue;
      const ultima = colocadas === nRestantes - 1;
      const valor = ultima ? Math.round((saldo - cm.parcela_valor * (nRestantes - 1)) * 100) / 100 : cm.parcela_valor;
      await s.insert<Lancamento>("lancamentos", {
        id: `impzp-venc-${String(cm.idx).padStart(2, "0")}-${colocadas + 1}`,
        tipo: "receita",
        categoria: "Honorários",
        cliente_id: cm.cliente_id,
        processo_id: `impzp-p-${String(cm.idx).padStart(2, "0")}`,
        descricao: `Parcela a vencer — honorários (${cm.contratante})`,
        valor,
        vencimento: venc,
      } as Partial<Lancamento>);
      colocadas++;
      parcelasGeradas++;
      gerouAlguma = true;
    }
    if (gerouAlguma) contratos++;
  }

  return { contratos, parcelasGeradas };
}

export interface ResultadoCasos {
  clientesNovos: number;
  clientesComplementados: number;
  processosNovos: number;
  andamentosNovos: number;
  eventosNovos: number;
  pagamentosNovos: number;
  removidos: number;
}

function normalizaNome(s: string): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Importa os casos reconstruídos das conversas de WhatsApp. Idempotente: casa
 *  cada caso com o cliente já existente (por CPF ou nome) e complementa processo,
 *  andamentos, eventos e pagamentos que faltavam; também remove os não-clientes. */
export async function importarCasosWhatsapp(): Promise<ResultadoCasos> {
  const s = getStore();
  const clientes = await s.list<Cliente>("clientes");
  const processos = await s.list<Processo>("processos");
  const processosById = new Map(processos.map((p) => [p.id, p]));
  const processosExist = new Set(processos.map((p) => p.id));
  const andamentosExist = new Set((await s.list<Andamento>("andamentos")).map((a) => a.id));
  const eventosExist = new Set((await s.list<EventoAgenda>("eventos_agenda")).map((e) => e.id));
  const lancExist = new Set((await s.list<Lancamento>("lancamentos")).map((l) => l.id));

  const r: ResultadoCasos = {
    clientesNovos: 0, clientesComplementados: 0, processosNovos: 0,
    andamentosNovos: 0, eventosNovos: 0, pagamentosNovos: 0, removidos: 0,
  };
  const digs = (x?: string) => (x ?? "").replace(/\D/g, "");

  // 1) limpeza — remove não-clientes e seus lançamentos
  const todosLancs = await s.list<Lancamento>("lancamentos");
  for (const id of REMOVER_CLIENTES) {
    for (const l of todosLancs.filter((x) => x.cliente_id === id)) await s.remove("lancamentos", l.id);
    if (clientes.find((c) => c.id === id)) { await s.remove("clientes", id); r.removidos++; }
  }

  const porCpf = new Map(clientes.filter((c) => c.cpf_cnpj).map((c) => [digs(c.cpf_cnpj), c]));

  for (const caso of CASOS_WHATSAPP) {
    // resolve o cliente já cadastrado (CPF primeiro, senão por nome)
    let alvo: Cliente | undefined;
    if (caso.cpf) alvo = porCpf.get(digs(caso.cpf));
    if (!alvo) {
      const alvos = caso.match.map(normalizaNome);
      alvo = clientes.find((c) => {
        const n = normalizaNome(c.nome);
        return alvos.some((m) => n.startsWith(m) || m.startsWith(n) || n.includes(m));
      });
    }

    let clienteId: string;
    if (alvo) {
      const patch: Partial<Cliente> = {};
      const e = caso.enriquecer;
      if (e?.nome && e.nome.length > alvo.nome.length) patch.nome = e.nome;
      if (e?.cpf_cnpj && !alvo.cpf_cnpj) patch.cpf_cnpj = e.cpf_cnpj;
      if (e?.rg && !alvo.rg) patch.rg = e.rg;
      if (e?.endereco && !alvo.endereco) patch.endereco = e.endereco;
      if (e?.nota) {
        const base = (alvo.notas ?? "").split("[caso]")[0].trim();
        patch.notas = `${base ? base + " " : ""}[caso] ${e.nota}`.trim();
      }
      if (Object.keys(patch).length) { await s.update<Cliente>("clientes", alvo.id, patch); r.clientesComplementados++; }
      clienteId = alvo.id;
    } else {
      clienteId = `impcw-c-${caso.idx}`;
      if (!clientes.find((c) => c.id === clienteId)) {
        await s.insert<Cliente>("clientes", {
          id: clienteId, tipo: "pf",
          nome: caso.enriquecer?.nome ?? caso.match[0],
          cpf_cnpj: caso.enriquecer?.cpf_cnpj, rg: caso.enriquecer?.rg, endereco: caso.enriquecer?.endereco,
          notas: caso.enriquecer?.nota ? `[caso] ${caso.enriquecer.nota}` : undefined,
        } as Partial<Cliente>);
        r.clientesNovos++;
      }
    }

    // processos (cria novo, ou atualiza situação/CNJ se já existir)
    for (const p of caso.processos) {
      if (processosExist.has(p.id)) {
        const atual = processosById.get(p.id);
        const patch: Partial<Processo> = {};
        if (p.situacao) (patch as Record<string, unknown>).situacao = p.situacao;
        if (p.numero_cnj && atual && !atual.numero_cnj) patch.numero_cnj = p.numero_cnj;
        if (Object.keys(patch).length) await s.update<Processo>("processos", p.id, patch);
      } else {
        const encerrado = p.situacao === "encerrado" || p.situacao === "encerrado_quitado";
        await s.insert<Processo>("processos", {
          id: p.id, numero_cnj: p.numero_cnj, cliente_id: clienteId,
          area: (p.area ?? "criminal") as Processo["area"], tribunal: "TJSP", comarca: p.comarca,
          objeto: p.objeto, parte_contraria: p.parte_contraria,
          status: encerrado ? "encerrado" : "ativo", monitorado: false,
          ...(p.situacao ? { situacao: p.situacao } : {}),
        } as Partial<Processo>);
        processosExist.add(p.id);
        r.processosNovos++;
      }
    }

    // andamentos
    for (let i = 0; i < caso.andamentos.length; i++) {
      const a = caso.andamentos[i];
      const id = `impcw-a-${caso.idx}-${i + 1}`;
      if (!andamentosExist.has(id)) {
        await s.insert<Andamento>("andamentos", { id, processo_id: a.processo, data: a.data, origem: "manual", descricao: a.descricao } as Partial<Andamento>);
        r.andamentosNovos++;
      }
    }

    // eventos (audiências / vídeos)
    for (const ev of caso.eventos ?? []) {
      if (!eventosExist.has(ev.id)) {
        await s.insert<EventoAgenda>("eventos_agenda", { id: ev.id, tipo: ev.tipo as EventoAgenda["tipo"], titulo: ev.titulo, processo_id: ev.processo, cliente_id: clienteId, inicio: ev.inicio, local: ev.local } as Partial<EventoAgenda>);
        r.eventosNovos++;
      }
    }

    // pagamentos que faltavam na planilha
    for (const pg of caso.pagamentos ?? []) {
      if (!lancExist.has(pg.id)) {
        await s.insert<Lancamento>("lancamentos", { id: pg.id, tipo: "receita", categoria: "Honorários", cliente_id: clienteId, descricao: pg.descricao, valor: pg.valor, vencimento: pg.data, pago_em: pg.data } as Partial<Lancamento>);
        r.pagamentosNovos++;
      }
    }
  }

  return r;
}
