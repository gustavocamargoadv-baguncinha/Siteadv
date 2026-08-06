// Métricas de desempenho do escritório — tudo derivado dos lançamentos que já
// existem no sistema. Nenhum número é inventado aqui: o que não dá para calcular
// com honestidade fica de fora (ex.: comparação anual só aparece quando há mais
// de um ano com dados).

import type { Cliente, Lancamento, Processo } from "./types";
import { FASES } from "./fases";
import type { SituacaoCaso } from "./types";

export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Só receitas efetivamente recebidas (têm data de pagamento). */
function recebidas(lancamentos: Lancamento[]): Lancamento[] {
  return lancamentos.filter((l) => l.tipo === "receita" && !!l.pago_em);
}

/** Anos que têm pelo menos um recebimento, do mais antigo para o mais novo. */
export function anosComDados(lancamentos: Lancamento[]): string[] {
  const anos = new Set<string>();
  for (const l of recebidas(lancamentos)) anos.add(l.pago_em!.slice(0, 4));
  return [...anos].sort();
}

export interface ResumoAno {
  ano: string;
  total: number;
  porMes: number[]; // 12 posições, em reais
  nRecebimentos: number;
  /** Quantos meses já contam para o ritmo: no ano corrente, até o mês de hoje. */
  mesesDecorridos: number;
}

export function resumoAno(lancamentos: Lancamento[], ano: string, hojeISO: string): ResumoAno {
  const porMes = new Array(12).fill(0);
  let total = 0;
  let n = 0;
  for (const l of recebidas(lancamentos)) {
    if (!l.pago_em!.startsWith(ano)) continue;
    const m = Number(l.pago_em!.slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    porMes[m] += l.valor;
    total += l.valor;
    n++;
  }
  const anoCorrente = hojeISO.slice(0, 4);
  const mesesDecorridos = ano === anoCorrente ? Number(hojeISO.slice(5, 7)) : 12;
  return { ano, total, porMes, nRecebimentos: n, mesesDecorridos };
}

/** Projeção simples para o fim do ano: mantém a média mensal já realizada.
 *  Só faz sentido no ano corrente — nos anos fechados devolve o próprio total. */
export function projecaoAno(r: ResumoAno): number {
  if (r.mesesDecorridos >= 12 || r.mesesDecorridos === 0) return r.total;
  return Math.round((r.total / r.mesesDecorridos) * 12);
}

/** Variação percentual entre dois valores. null quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

export interface FatiaCarteira {
  fase: SituacaoCaso;
  rotulo: string;
  emoji: string;
  cor: string; // hex — paleta validada (ver Charts.tsx)
  quantidade: number;
}

/** Cores da carteira ATIVA. Paleta validada para daltonismo (ΔE ≥ 8 em todos os
 *  pares) — ver validate_palette. Cada fatia sempre acompanha rótulo + contagem,
 *  então a identidade nunca depende só da cor. */
const COR_FASE: Partial<Record<SituacaoCaso, string>> = {
  precisa_agir: "#dc2626",
  aguardando_tramite: "#ca8a04",
  aguardando_cliente: "#2563eb",
};

/** Distribuição da carteira ATIVA por fase (os encerrados viram estatística à
 *  parte — misturá-los esconderia onde está o trabalho de verdade). */
export function distribuicaoCarteira(processos: Processo[]): { fatias: FatiaCarteira[]; ativos: number; encerrados: number } {
  const ativosPorFase = new Map<SituacaoCaso, number>();
  let encerrados = 0;
  for (const p of processos) {
    const info = FASES.find((f) => f.valor === p.situacao);
    if (p.status === "encerrado" || info?.encerrado) {
      encerrados++;
      continue;
    }
    // sem fase definida entra como "preciso agir" — é o padrão seguro: aparece
    // no vermelho e cobra uma decisão, em vez de sumir do radar.
    const fase: SituacaoCaso = info?.valor ?? "precisa_agir";
    ativosPorFase.set(fase, (ativosPorFase.get(fase) ?? 0) + 1);
  }
  const fatias: FatiaCarteira[] = [];
  for (const f of FASES) {
    if (f.encerrado) continue;
    const q = ativosPorFase.get(f.valor) ?? 0;
    if (q === 0) continue;
    fatias.push({ fase: f.valor, rotulo: f.rotulo, emoji: f.emoji, cor: COR_FASE[f.valor] ?? "#64748b", quantidade: q });
  }
  const ativos = fatias.reduce((s, f) => s + f.quantidade, 0);
  return { fatias, ativos, encerrados };
}

export interface ClienteFaturamento {
  id: string;
  nome: string;
  total: number;
}

/** Clientes que mais faturaram no ano. */
export function topClientes(
  lancamentos: Lancamento[],
  clientes: Cliente[],
  ano: string,
  limite = 6
): ClienteFaturamento[] {
  const porCliente = new Map<string, number>();
  for (const l of recebidas(lancamentos)) {
    if (!l.pago_em!.startsWith(ano) || !l.cliente_id) continue;
    porCliente.set(l.cliente_id, (porCliente.get(l.cliente_id) ?? 0) + l.valor);
  }
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  return [...porCliente.entries()]
    .map(([id, total]) => ({ id, nome: nomes.get(id) ?? "Sem vínculo", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

/* ---------------------------------------------------------------------------
 * Meta anual — guardada no navegador (localStorage). É um alvo pessoal, não um
 * dado do escritório, então não vai para o banco: fica em quem usa o aparelho.
 * ------------------------------------------------------------------------- */

const CHAVE_META = "camargo-adv:meta";

export function lerMeta(ano: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const cru = window.localStorage.getItem(`${CHAVE_META}:${ano}`);
    const v = cru ? Number(cru) : NaN;
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function salvarMeta(ano: string, valor: number): void {
  if (typeof window === "undefined") return;
  try {
    if (valor > 0) window.localStorage.setItem(`${CHAVE_META}:${ano}`, String(Math.round(valor)));
    else window.localStorage.removeItem(`${CHAVE_META}:${ano}`);
  } catch {
    /* navegador sem localStorage — a meta simplesmente não persiste */
  }
}

/** Sugestão de meta quando ainda não há uma definida: 20% acima do ano anterior
 *  (a ideia de "crescer no ano"); sem ano anterior, arredonda a projeção atual. */
export function metaSugerida(resumoAtual: ResumoAno, totalAnoAnterior: number | null): number {
  const base = totalAnoAnterior && totalAnoAnterior > 0 ? totalAnoAnterior * 1.2 : projecaoAno(resumoAtual) * 1.1;
  const arredonda = base >= 100000 ? 10000 : 5000;
  return Math.max(arredonda, Math.ceil(base / arredonda) * arredonda);
}
