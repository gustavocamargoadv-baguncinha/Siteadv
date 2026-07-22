// Fases do caso — o fluxo real do escritório, do jeito que o Dr. Gustavo
// descreveu. Cada fase tem um rótulo interno (o que o advogado vê) e um
// rótulo amigável (o que o cliente lê no portal), além de cor e emoji.

import type { SituacaoCaso } from "./types";

export interface FaseInfo {
  valor: SituacaoCaso;
  rotulo: string; // interno (advogado)
  rotuloCliente: string; // portal do cliente
  emoji: string;
  cor: "vermelho" | "ambar" | "azul" | "cinza" | "verde";
  dica: string; // explicação curta no botão
  encerrado?: boolean; // caso concluído
}

export const FASES: FaseInfo[] = [
  {
    valor: "precisa_agir",
    rotulo: "Preciso agir",
    rotuloCliente: "Em preparação pelo advogado",
    emoji: "🔴",
    cor: "vermelho",
    dica: "Tenho que peticionar ou fazer algo neste caso",
  },
  {
    valor: "aguardando_tramite",
    rotulo: "Aguardando trâmite",
    rotuloCliente: "Aguardando o andamento da Justiça",
    emoji: "🟡",
    cor: "ambar",
    dica: "Peticionei — aguardando o trâmite/decisão do juízo",
  },
  {
    valor: "aguardando_cliente",
    rotulo: "Aguardando o cliente",
    rotuloCliente: "Aguardando você",
    emoji: "🔵",
    cor: "azul",
    dica: "Esperando documento, informação ou pagamento do cliente",
  },
  {
    valor: "encerrado",
    rotulo: "Encerrado",
    rotuloCliente: "Caso encerrado",
    emoji: "⚪",
    cor: "cinza",
    dica: "Caso concluído (pagamento ainda pendente)",
    encerrado: true,
  },
  {
    valor: "encerrado_quitado",
    rotulo: "Encerrado e quitado",
    rotuloCliente: "Caso encerrado",
    emoji: "🟢",
    cor: "verde",
    dica: "Concluído e pago integralmente pelo cliente",
    encerrado: true,
  },
];

export const FASE_POR_VALOR: Record<SituacaoCaso, FaseInfo> = Object.fromEntries(
  FASES.map((f) => [f.valor, f])
) as Record<SituacaoCaso, FaseInfo>;

export function faseInfo(v?: SituacaoCaso): FaseInfo | undefined {
  return v ? FASE_POR_VALOR[v] : undefined;
}
