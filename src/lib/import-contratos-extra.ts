// Contratos combinados fora do ZapSign (presenciais / acordos verbais), informados
// manualmente pelo escritório. Vinculam-se a clientes que já existem (pagadores do
// extrato). O dia de vencimento é a MÉDIA dos dias em que o cliente costuma pagar.
//
// Reaproveitam o mesmo esquema de ids dos contratos ZapSign (prefixo "impzp-"),
// com idx a partir de 101, para o gerador de parcelas a vencer tratar todos igual.

export interface ContratoManual {
  idx: number;
  cliente_id: string; // cliente já existente (imp26c-...)
  contratante: string; // nome (completo quando conhecido)
  defendido: string;
  numero_cnj?: string;
  valor: number; // total contratado
  parcela_valor: number; // valor de cada parcela
  parcelas: number; // nº total de parcelas
  dia_venc: number; // dia do mês de vencimento (média dos pagamentos)
  observacao?: string;
  // qualificação do contratante, quando conhecida (contrato em mãos)
  cpf?: string;
  rg?: string;
  endereco?: string;
  nota?: string; // ex.: quem é o pagador (terceiro)
  // entrada já paga antes do período do extrato importado
  entrada?: { valor: number; data: string };
}

export const CONTRATOS_MANUAIS: ContratoManual[] = [
  {
    idx: 101,
    cliente_id: "imp26c-andreafarias",
    contratante: "Andrea Farias",
    defendido: "Wendell Kemerson Farias de Souza",
    valor: 4000,
    parcela_valor: 500,
    parcelas: 7,
    dia_venc: 7,
    observacao: "Entrada de R$ 1.000 + 6 parcelas de R$ 500.",
  },
  {
    idx: 102,
    cliente_id: "imp26c-paulacristina",
    contratante: "Paula Cristina Paiva",
    defendido: "Paulo Osmar de Paiva",
    numero_cnj: "1500724-38.2024.8.26.0470",
    valor: 5000,
    parcela_valor: 500,
    parcelas: 10,
    dia_venc: 24,
  },
  {
    idx: 103,
    cliente_id: "imp26c-sandraregina",
    contratante: "Sandra Regina",
    defendido: "Marcos Antonio Geraldo de Lima",
    valor: 3200,
    parcela_valor: 400,
    parcelas: 8,
    dia_venc: 17,
  },
  {
    idx: 104,
    cliente_id: "imp26c-renatafernand",
    contratante: "Renata Fernanda",
    defendido: "Pablo Juan Seixas Pereira",
    valor: 4500,
    parcela_valor: 450,
    parcelas: 10,
    dia_venc: 16,
    observacao: "Contratado em setembro/2025.",
  },
  {
    idx: 105,
    cliente_id: "imp26c-valquiriapach", // conta pela qual entram os pagamentos (Valquíria)
    contratante: "Valdeci Silvestre Machado",
    defendido: "Valdeci Silvestre Machado (em nome próprio)",
    numero_cnj: "1500298-89.2025.8.26.0470",
    valor: 8000,
    parcela_valor: 600,
    parcelas: 10,
    dia_venc: 20,
    cpf: "197.268.788-37",
    rg: "28.50.172-6 SSP/SP",
    endereco: "Rua João Higino de Meira 44, Floresta I, Guareí-SP, CEP 18.252-006",
    nota: "Pagamentos efetuados por Valquíria (terceiro). Inquéritos 1500298-89 e 1500241-71.2025.8.26.0470.",
    observacao: "R$ 8.000: entrada de R$ 2.000 (paga em 19/11/2025) + 10x de R$ 600 (dia 20, desde dez/2025).",
    entrada: { valor: 2000, data: "2025-11-19" },
  },
];
