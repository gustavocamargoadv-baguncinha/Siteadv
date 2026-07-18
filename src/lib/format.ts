export function brl(v: number | undefined | null): string {
  if (v === undefined || v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataBR(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return d.toLocaleDateString("pt-BR");
}

export function dataHoraBR(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diasAteISO(iso: string): number {
  const hoje = new Date(hojeISO() + "T12:00:00").getTime();
  const alvo = new Date(iso.slice(0, 10) + "T12:00:00").getTime();
  return Math.round((alvo - hoje) / 86400000);
}

/** Urgência de um prazo pendente, para cor e ordenação. */
export function urgenciaPrazo(dataLimite: string): "vencido" | "hoje" | "urgente" | "proximo" | "tranquilo" {
  const d = diasAteISO(dataLimite);
  if (d < 0) return "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "urgente";
  if (d <= 7) return "proximo";
  return "tranquilo";
}

export function rotuloDias(dataLimite: string): string {
  const d = diasAteISO(dataLimite);
  if (d < -1) return `venceu há ${-d} dias`;
  if (d === -1) return "venceu ontem";
  if (d === 0) return "HOJE";
  if (d === 1) return "amanhã";
  return `em ${d} dias`;
}

export type StatusLancamento = "pago" | "atrasado" | "pendente";

export function statusLancamento(l: { pago_em?: string; vencimento: string }): StatusLancamento {
  if (l.pago_em) return "pago";
  if (diasAteISO(l.vencimento) < 0) return "atrasado";
  return "pendente";
}

/** Máscara visual do número CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
export function formatCNJ(n: string | undefined): string {
  if (!n) return "sem número";
  const digits = n.replace(/\D/g, "");
  if (digits.length !== 20) return n;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

export const AREAS: Record<string, string> = {
  criminal: "Criminal",
  execucao_penal: "Execução Penal",
  civel: "Cível",
  familia: "Família",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  outra: "Outra",
};

export const PAPEIS: Record<string, string> = {
  admin: "Administrador",
  advogado: "Advogado(a)",
  estagiario: "Estagiário(a)",
  secretaria: "Secretaria",
};

export const TIPOS_EVENTO: Record<string, string> = {
  audiencia: "Audiência",
  reuniao: "Reunião",
  sustentacao: "Sustentação oral",
  atendimento: "Atendimento",
  outro: "Outro",
};

export const TIPOS_HONORARIOS: Record<string, string> = {
  fixo: "Valor fixo",
  exito: "Êxito (%)",
  hora: "Por hora",
  misto: "Misto",
  pro_bono: "Pro bono",
};
