// Prazos criminais: presets e contagem.
//
// O e-SAJ/eproc continuam sendo a fonte da verdade — o Dr. Gustavo lê a
// intimação lá. O papel daqui é transformar "fui intimado hoje da sentença" em
// uma data de vencimento sem ele precisar contar no dedo, e guardar isso para o
// alarme do Google Agenda tocar (ver src/lib/ics.ts).

/** Feriados nacionais fixos (dia-mês). Os móveis (Carnaval, Páscoa, Corpus
 *  Christi) e os forenses locais NÃO estão aqui — por isso a data calculada é
 *  sempre uma SUGESTÃO a conferir, nunca a palavra final. */
const FERIADOS_FIXOS = new Set([
  "01-01", // Confraternização
  "04-21", // Tiradentes
  "05-01", // Trabalho
  "09-07", // Independência
  "10-12", // Padroeira
  "11-02", // Finados
  "11-15", // Proclamação
  "11-20", // Consciência Negra
  "12-25", // Natal
]);

function ehDiaUtil(d: Date): boolean {
  const diaSemana = d.getUTCDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  const mmdd = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  if (FERIADOS_FIXOS.has(mmdd)) return false;
  // Recesso forense: 20/12 a 06/01 (art. 220 do CPC; na prática o fórum para).
  const mes = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  if ((mes === 12 && dia >= 20) || (mes === 1 && dia <= 6)) return false;
  return true;
}

function paraData(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Soma dias ÚTEIS a uma data (a contagem começa no dia útil seguinte). */
export function somaDiasUteis(isoInicial: string, dias: number): string {
  const d = paraData(isoInicial);
  let restantes = dias;
  while (restantes > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (ehDiaUtil(d)) restantes--;
  }
  return paraISO(d);
}

/** Subtrai dias úteis — usado para a meta interna, antes do prazo fatal. */
export function subtraiDiasUteis(iso: string, dias: number): string {
  const d = paraData(iso);
  let restantes = dias;
  while (restantes > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (ehDiaUtil(d)) restantes--;
  }
  return paraISO(d);
}

export interface PresetPrazo {
  id: string;
  rotulo: string;
  dias: number;
  /** Prazo penal conta em dias CORRIDOS (art. 798 do CPP); o da Lei 9.099 e os
   *  de natureza cível/recursal em dias ÚTEIS. */
  uteis: boolean;
  base: string; // o que dispara a contagem, para aparecer na tela
}

/** Os prazos do dia a dia da defesa criminal. */
export const PRESETS_PRAZO: PresetPrazo[] = [
  { id: "resposta_acusacao", rotulo: "Resposta à acusação", dias: 10, uteis: false, base: "da citação" },
  { id: "alegacoes_finais", rotulo: "Alegações finais (memoriais)", dias: 5, uteis: false, base: "da intimação" },
  { id: "apelacao", rotulo: "Apelação — interposição", dias: 5, uteis: false, base: "da intimação da sentença" },
  { id: "razoes_apelacao", rotulo: "Apelação — razões", dias: 8, uteis: false, base: "da intimação para razões" },
  { id: "rese", rotulo: "RESE — interposição", dias: 5, uteis: false, base: "da intimação da decisão" },
  { id: "razoes_rese", rotulo: "RESE — razões", dias: 2, uteis: false, base: "da interposição" },
  { id: "embargos_declaracao", rotulo: "Embargos de declaração", dias: 2, uteis: false, base: "da intimação" },
  { id: "jecrim", rotulo: "Recurso — Lei 9.099 (JECrim)", dias: 10, uteis: true, base: "da intimação" },
  { id: "resp_rext", rotulo: "REsp / RExt", dias: 15, uteis: true, base: "da intimação do acórdão" },
  { id: "contrarrazoes", rotulo: "Contrarrazões", dias: 8, uteis: false, base: "da intimação" },
  { id: "outro", rotulo: "Outro (informar os dias)", dias: 5, uteis: false, base: "da intimação" },
];

export function preset(id: string): PresetPrazo | undefined {
  return PRESETS_PRAZO.find((p) => p.id === id);
}

/** Soma dias corridos, mas se cair em dia não útil empurra para o próximo — é o
 *  que diz o art. 798, §3º do CPP (prorroga-se o vencimento em fim de semana ou
 *  feriado). */
function somaDiasCorridos(isoInicial: string, dias: number): string {
  const d = paraData(isoInicial);
  d.setUTCDate(d.getUTCDate() + dias);
  while (!ehDiaUtil(d)) d.setUTCDate(d.getUTCDate() + 1);
  return paraISO(d);
}

export interface PrazoCalculado {
  dataLimite: string; // prazo fatal
  dataInterna: string; // meta interna, com folga para trabalhar
  descricao: string; // como a conta foi feita, para conferência
}

/** Calcula o vencimento a partir da data da intimação.
 *  A meta interna fica 2 dias úteis antes (ou no dia seguinte à intimação,
 *  quando o prazo é curto demais para isso). */
export function calcularPrazo(dataIntimacao: string, presetId: string, diasCustom?: number): PrazoCalculado {
  const p = preset(presetId);
  const dias = diasCustom && diasCustom > 0 ? diasCustom : p?.dias ?? 5;
  const uteis = p?.uteis ?? false;

  const dataLimite = uteis ? somaDiasUteis(dataIntimacao, dias) : somaDiasCorridos(dataIntimacao, dias);
  let dataInterna = subtraiDiasUteis(dataLimite, 2);
  // prazo curto: a meta interna não pode cair antes da própria intimação
  if (dataInterna <= dataIntimacao) dataInterna = somaDiasUteis(dataIntimacao, 1);
  if (dataInterna > dataLimite) dataInterna = dataLimite;

  return {
    dataLimite,
    dataInterna,
    descricao: `${dias} dias ${uteis ? "úteis" : "corridos"} ${p?.base ?? "da intimação"}`,
  };
}
