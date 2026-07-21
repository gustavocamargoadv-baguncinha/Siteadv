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
];
