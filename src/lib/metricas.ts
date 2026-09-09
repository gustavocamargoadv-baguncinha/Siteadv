// Métricas de desempenho do escritório — tudo derivado dos lançamentos que já
// existem no sistema. Nenhum número é inventado aqui: o que não dá para calcular
// com honestidade fica de fora (ex.: comparação anual só aparece quando há mais
// de um ano com dados).

import type { Cliente, Lancamento, Processo } from "./types";
import { FASES } from "./fases";
import { HISTORICO_ANUAL } from "./historico";
import type { SituacaoCaso } from "./types";

export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Só receitas efetivamente recebidas (têm data de pagamento). */
function recebidas(lancamentos: Lancamento[]): Lancamento[] {
  return lancamentos.filter((l) => l.tipo === "receita" && !!l.pago_em);
}

/** Anos com dados: os que têm recebimento lançado + os anos fechados que vieram
 *  das planilhas antigas (histórico agregado). Do mais antigo para o mais novo. */
export function anosComDados(lancamentos: Lancamento[]): string[] {
  const anos = new Set<string>();
  for (const l of recebidas(lancamentos)) anos.add(l.pago_em!.slice(0, 4));
  for (const h of HISTORICO_ANUAL) anos.add(h.ano);
  return [...anos].sort();
}

export interface ResumoAno {
  ano: string;
  total: number;
  porMes: number[]; // 12 posições, em reais
  nRecebimentos: number;
  /** Quantos meses já contam para o ritmo: no ano corrente, até o mês de hoje. */
  mesesDecorridos: number;
  /** Veio do histórico agregado (planilha de ano fechado), não dos lançamentos. */
  historico?: boolean;
  /** Os mesmos meses, com os recebimentos marcados como excepcionais espalhados
   *  em partes iguais. Some exatamente o mesmo `total`: nada é criado nem
   *  perdido, só muda de mês. */
  porMesDiluido: number[];
  /** Quanto e quantos recebimentos foram espalhados — para a tela poder dizer
   *  ao usuário o que está vendo em vez de mostrar um gráfico diferente sem
   *  explicação. */
  totalDiluido: number;
  nDiluidos: number;
}

/** Espalha `valor` em partes iguais pelos `meses` primeiros meses, em centavos,
 *  distribuindo o resto um a um. Somar as partes devolve o valor original —
 *  dividir em reais deixaria centavos para trás e o gráfico não bateria com o
 *  total do ano. */
function espalhar(destino: number[], valor: number, meses: number): void {
  if (valor <= 0 || meses <= 0) return;
  const centavos = Math.round(valor * 100);
  const base = Math.floor(centavos / meses);
  const resto = centavos - base * meses;
  for (let m = 0; m < meses; m++) {
    destino[m] += (base + (m < resto ? 1 : 0)) / 100;
  }
}

export function resumoAno(lancamentos: Lancamento[], ano: string, hojeISO: string): ResumoAno {
  // ano fechado que veio da planilha antiga: usa o agregado direto
  const hist = HISTORICO_ANUAL.find((h) => h.ano === ano);
  if (hist) {
    return {
      ano,
      total: hist.total,
      porMes: hist.porMes,
      nRecebimentos: hist.nRecebimentos,
      mesesDecorridos: 12,
      historico: true,
      // ano fechado veio da planilha como total por mês: não há lançamento para
      // marcar como excepcional, então diluído e caixa são a mesma coisa
      porMesDiluido: hist.porMes,
      totalDiluido: 0,
      nDiluidos: 0,
    };
  }

  const porMes = new Array(12).fill(0);
  const porMesDiluido = new Array(12).fill(0);
  let total = 0;
  let n = 0;
  let totalDiluido = 0;
  let nDiluidos = 0;
  for (const l of recebidas(lancamentos)) {
    if (!l.pago_em!.startsWith(ano)) continue;
    const m = Number(l.pago_em!.slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    porMes[m] += l.valor;
    total += l.valor;
    n++;
    if (l.diluido) {
      totalDiluido += l.valor;
      nDiluidos++;
    } else {
      porMesDiluido[m] += l.valor;
    }
  }
  const anoCorrente = hojeISO.slice(0, 4);
  const mesesDecorridos = ano === anoCorrente ? Number(hojeISO.slice(5, 7)) : 12;
  // Espalha pelos meses que a tela plota (no ano corrente, os já decorridos) e
  // não pelos 12: jogar parte do valor em meses que ainda não existem sumiria
  // com ela do gráfico, e a soma das colunas deixaria de bater com o total.
  espalhar(porMesDiluido, totalDiluido, mesesDecorridos);
  return { ano, total, porMes, nRecebimentos: n, mesesDecorridos, porMesDiluido, totalDiluido, nDiluidos };
}

/** Projeção simples para o fim do ano: mantém a média mensal já realizada.
 *  Só faz sentido no ano corrente — nos anos fechados devolve o próprio total. */
export function projecaoAno(r: ResumoAno): number {
  if (r.mesesDecorridos >= 12 || r.mesesDecorridos === 0) return r.total;
  return Math.round((r.total / r.mesesDecorridos) * 12);
}

export interface PrevisaoMes {
  mes: string; // "2026-09"
  /** Dinheiro que já entrou neste mês. */
  recebido: number;
  /** Ainda em aberto com vencimento dentro deste mês. */
  aReceber: number;
  /** A parte de `aReceber` cujo dia de vencimento já passou — é o que dá para
   *  cobrar hoje, não semana que vem. */
  jaVenceu: number;
  /** Em aberto de meses anteriores. Fica FORA da previsão de propósito: é
   *  dinheiro que já não veio quando devia, e somá-lo transformaria a previsão
   *  num número otimista que nunca se cumpre. */
  atrasadoAnterior: number;
  /** recebido + aReceber: o que já está garantido no mês. NÃO é o faturamento
   *  esperado — ver `fatiaSemAgenda`. */
  previsao: number;
  quantidade: number; // quantas parcelas compõem o `aReceber`
  /** A fatia do faturamento do ano que veio de clientes SEM nenhuma parcela em
   *  aberto — ou seja, o dinheiro que uma conta baseada em agenda não tem como
   *  enxergar. 0..1, ou null quando ainda não há faturamento no ano.
   *
   *  Existe porque o número acima é lido como previsão e não é: num escritório
   *  onde a maior parte do dinheiro chega sem parcela marcada (caso novo, acordo
   *  combinado no mês, honorário fechado por fora), o total agendado é um piso,
   *  não um palpite. Sem esta medida ao lado, o card assusta todo mês. */
  fatiaSemAgenda: number | null;
}

/** O que o mês corrente já tem garantido: o que entrou somado ao que ainda vence
 *  dentro dele.
 *
 *  É um PISO, não uma previsão. Só enxerga parcela que alguém agendou, e boa
 *  parte do dinheiro deste escritório chega sem agenda nenhuma — daí o
 *  `fatiaSemAgenda` vir junto, para a tela poder dizer o tamanho do próprio
 *  ponto cego em vez de deixar o número passar por projeção.
 *
 *  É faturamento, não lucro: o sistema não registra despesas (o Financeiro só
 *  tem receitas), então subtrair custo daqui seria inventar número. */
export function previsaoMes(lancamentos: Lancamento[], hojeISO: string): PrevisaoMes {
  const mes = hojeISO.slice(0, 10).slice(0, 7);
  const ano = mes.slice(0, 4);
  const hoje = hojeISO.slice(0, 10);
  let recebido = 0;
  let aReceber = 0;
  let jaVenceu = 0;
  let atrasadoAnterior = 0;
  let quantidade = 0;
  // Cliente "com agenda" é o que tem alguma cobrança em aberto — não importa se
  // veio do gerador de contratos ou foi lançada à mão. É o que a conta do mês
  // consegue ver quando olha para a frente.
  const comAgenda = new Set<string>();

  for (const l of lancamentos) {
    if (l.tipo !== "receita") continue;
    if (l.pago_em) {
      if (l.pago_em.startsWith(mes)) recebido += l.valor;
      continue;
    }
    if (l.perdoado_em) continue; // dívida perdoada não volta como previsão
    if (l.cliente_id) comAgenda.add(l.cliente_id);
    if (l.vencimento.startsWith(mes)) {
      aReceber += l.valor;
      quantidade++;
      if (l.vencimento < hoje) jaVenceu += l.valor;
    } else if (l.vencimento < mes) {
      atrasadoAnterior += l.valor;
    }
  }

  // Segunda passada: o conjunto `comAgenda` só fica pronto no fim da primeira.
  let recebidoAno = 0;
  let recebidoSemAgenda = 0;
  for (const l of lancamentos) {
    if (l.tipo !== "receita" || !l.pago_em?.startsWith(ano)) continue;
    recebidoAno += l.valor;
    // sem cliente vinculado também conta como ponto cego: não há para quem olhar
    if (!l.cliente_id || !comAgenda.has(l.cliente_id)) recebidoSemAgenda += l.valor;
  }

  return {
    mes,
    recebido,
    aReceber,
    jaVenceu,
    atrasadoAnterior,
    previsao: recebido + aReceber,
    quantidade,
    fatiaSemAgenda: recebidoAno > 0 ? recebidoSemAgenda / recebidoAno : null,
  };
}

/** Variação percentual entre dois valores. null quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** Soma dos N primeiros meses do ano. Serve para comparar períodos equivalentes:
 *  confrontar 8 meses do ano corrente com os 12 do ano passado diria "queda"
 *  mesmo num ano que vai fechar melhor. */
export function totalAteMes(r: ResumoAno, meses: number): number {
  return r.porMes.slice(0, Math.max(0, Math.min(12, meses))).reduce((s, v) => s + v, 0);
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

/** Em que fatia da carteira ativa este processo cai — `null` quando está
 *  encerrado (fora da carteira).
 *
 *  Fonte única da regra: o gráfico da Desempenho e o filtro da lista de
 *  Processos chamam esta mesma função. Se cada tela reimplementasse o critério,
 *  o card diria "33 casos" e a lista abriria com outro número — e aí não dá
 *  para confiar em nenhum dos dois. */
export function faseCarteira(p: Processo): SituacaoCaso | null {
  const info = FASES.find((f) => f.valor === p.situacao);
  if (p.status === "encerrado" || info?.encerrado) return null;
  // sem fase definida entra como "preciso agir" — é o padrão seguro: aparece
  // no vermelho e cobra uma decisão, em vez de sumir do radar.
  return info?.valor ?? "precisa_agir";
}

/** Distribuição da carteira ATIVA por fase (os encerrados viram estatística à
 *  parte — misturá-los esconderia onde está o trabalho de verdade). */
export function distribuicaoCarteira(processos: Processo[]): { fatias: FatiaCarteira[]; ativos: number; encerrados: number } {
  const ativosPorFase = new Map<SituacaoCaso, number>();
  let encerrados = 0;
  for (const p of processos) {
    const fase = faseCarteira(p);
    if (fase === null) {
      encerrados++;
      continue;
    }
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
  // ano fechado: o ranking já vem pronto do histórico (sem id — não há ficha
  // de cliente para esses anos, então o nome é o que temos)
  const hist = HISTORICO_ANUAL.find((h) => h.ano === ano);
  if (hist) return hist.topClientes.slice(0, limite).map((c) => ({ id: "", nome: c.nome, total: c.total }));

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
