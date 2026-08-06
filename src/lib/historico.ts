// Histórico dos anos fechados (2024 e 2025), lido das planilhas de controle
// do escritório. Aqui vão apenas AGREGADOS — total do ano, o que entrou mês a
// mês e quem mais faturou. Não viram clientes nem lançamentos no sistema: são
// anos encerrados, e criar ~200 clientes antigos poluiria a carteira, a
// cobrança e a geração de parcelas. Servem só às métricas de Desempenho.
//
// Critério: somadas as ENTRADAS de cada aba de mês, excluindo os lançamentos
// que não são de cliente (João Luiz — conta dividida; Gustavo — o próprio),
// exatamente como foi feito em 2026, para a comparação ser justa.

export interface AnoHistorico {
  ano: string;
  total: number;
  porMes: number[]; // 12 posições, em reais
  nRecebimentos: number;
  topClientes: { nome: string; total: number }[];
}

export const HISTORICO_ANUAL: AnoHistorico[] = [
  {
    ano: "2024",
    total: 134597.41,
    porMes: [10030.82, 7980.25, 12953.03, 15288.44, 8742.16, 9718.93, 8919.16, 14879.16, 13009.16, 9830.0, 11081.8, 12164.5],
    nRecebimentos: 380,
    topClientes: [
      { nome: "REGINALDO JOSE", total: 8000.0 },
      { nome: "Empresa CNPJ 55.543.067/0001-64", total: 6209.0 },
      { nome: "VANDA MARIANO", total: 5050.0 },
      { nome: "Depósito em espécie (caixa eletrônico/agência)", total: 4645.0 },
      { nome: "VERUSKA AMARO", total: 4500.0 },
      { nome: "Vinícius Furqu", total: 4374.95 },
    ],
  },
  {
    ano: "2025",
    total: 125517.11,
    porMes: [8872.31, 10171.0, 9125.0, 13678.83, 13246.0, 9470.47, 14663.0, 6113.0, 10677.5, 7630.0, 9610.0, 12260.0],
    nRecebimentos: 321,
    topClientes: [
      { nome: "Depósito em espécie (caixa eletrônico/agência)", total: 6095.0 },
      { nome: "POLIANA NICOLY", total: 4300.0 },
      { nome: "Lu", total: 4000.0 },
      { nome: "PATRICIA APARE", total: 3800.0 },
      { nome: "VALQUIRIA PACH", total: 3400.0 },
      { nome: "GILMARA MACEDO", total: 3200.0 },
    ],
  },
];
