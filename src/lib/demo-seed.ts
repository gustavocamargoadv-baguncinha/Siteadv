// Dados de demonstração para o modo local (sem Supabase configurado).
// As datas são geradas em relação a "hoje" para o painel sempre parecer vivo.

import type { TableName } from "./types";

function d(offsetDias: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDias);
  return dt.toISOString().slice(0, 10);
}

function dh(offsetDias: number, hora: number, min = 0): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDias);
  dt.setHours(hora, min, 0, 0);
  return dt.toISOString();
}

const m1 = "m-0001"; // Gustavo (admin)
const m2 = "m-0002";
const m3 = "m-0003";

const c1 = "c-0001";
const c2 = "c-0002";
const c3 = "c-0003";
const c4 = "c-0004";

const p1 = "p-0001";
const p2 = "p-0002";
const p3 = "p-0003";
const p4 = "p-0004";
const p5 = "p-0005";

export const DEMO_SEED: Record<TableName, Record<string, unknown>[]> = {
  membros: [
    {
      id: m1,
      nome: "Gustavo Roberto de Camargo",
      email: "gustavocamargoadvfit@gmail.com",
      papel: "admin",
      oab: "OAB/SP 431.515",
      telefone: "(11) 99999-0001",
      ativo: true,
    },
    {
      id: m2,
      nome: "Ana Paula Ferreira",
      email: "ana.ferreira@exemplo.com",
      papel: "estagiario",
      telefone: "(11) 99999-0002",
      ativo: true,
    },
    {
      id: m3,
      nome: "Marcos Vinícius Silva",
      email: "marcos.silva@exemplo.com",
      papel: "secretaria",
      telefone: "(11) 99999-0003",
      ativo: true,
    },
  ],

  clientes: [
    {
      id: c1,
      tipo: "pf",
      nome: "Carlos Eduardo Mendes",
      cpf_cnpj: "123.456.789-00",
      rg: "12.345.678-9 SSP/SP",
      nacionalidade: "brasileiro",
      estado_civil: "solteiro",
      profissao: "autônomo",
      email: "carlos.mendes@exemplo.com",
      telefone: "(11) 98888-1111",
      endereco: "Rua das Acácias, 120, Centro, CEP 18200-000, Itapetininga-SP",
      notas: "Réu preso. Família acompanha pelo irmão, Roberto.",
    },
    {
      id: c2,
      tipo: "pf",
      nome: "Juliana Aparecida Souza",
      cpf_cnpj: "987.654.321-00",
      rg: "98.765.432-1 SSP/SP",
      nacionalidade: "brasileira",
      estado_civil: "casada",
      profissao: "desempregada",
      email: "juliana.souza@exemplo.com",
      telefone: "(11) 98888-2222",
      endereco: "Av. Brasil, 450, Vila Nova, CEP 18205-000, Itapetininga-SP",
      notas: "Execução penal — progressão de regime em andamento.",
    },
    {
      id: c3,
      tipo: "pf",
      nome: "Roberto Lima Santos",
      cpf_cnpj: "111.222.333-44",
      email: "roberto.lima@exemplo.com",
      telefone: "(11) 98888-3333",
      notas: "Indicado pelo cliente Carlos Mendes.",
    },
    {
      id: c4,
      tipo: "pj",
      nome: "Mendes & Filhos Comércio Ltda.",
      cpf_cnpj: "12.345.678/0001-90",
      email: "contato@mendesfilhos.com.br",
      telefone: "(11) 3333-4444",
      notas: "Consultoria preventiva — compliance.",
    },
  ],

  processos: [
    {
      id: p1,
      numero_cnj: "1501234-56.2025.8.26.0050",
      cliente_id: c1,
      area: "criminal",
      tribunal: "TJSP",
      vara: "1ª Vara Criminal",
      comarca: "São Paulo — Barra Funda",
      fase: "Instrução",
      status: "ativo",
      parte_contraria: "Ministério Público de São Paulo",
      objeto: "Ação penal — art. 33, Lei 11.343/06. Tese: insuficiência probatória e nulidade da busca domiciliar.",
      responsavel_id: m1,
      monitorado: true,
    },
    {
      id: p2,
      numero_cnj: "0009876-54.2024.8.26.0496",
      cliente_id: c2,
      area: "execucao_penal",
      tribunal: "TJSP",
      vara: "Vara de Execuções Criminais",
      comarca: "Presidente Prudente",
      fase: "Execução",
      status: "ativo",
      parte_contraria: "Ministério Público de São Paulo",
      objeto: "Execução penal — pedido de progressão ao regime semiaberto (lapso atingido, bom comportamento atestado).",
      responsavel_id: m1,
      monitorado: true,
    },
    {
      id: p3,
      numero_cnj: "1509999-88.2024.8.26.0050",
      cliente_id: c1,
      area: "criminal",
      tribunal: "TJSP",
      vara: "5ª Câmara de Direito Criminal",
      comarca: "São Paulo",
      fase: "Recursal",
      status: "ativo",
      parte_contraria: "Ministério Público de São Paulo",
      objeto: "Apelação criminal — condenação em 1º grau. Preliminar de cerceamento de defesa; mérito: absolvição por fragilidade probatória.",
      responsavel_id: m1,
      monitorado: true,
    },
    {
      id: p4,
      numero_cnj: "1002345-67.2025.8.26.0405",
      cliente_id: c3,
      area: "criminal",
      tribunal: "TJSP",
      vara: "2ª Vara Criminal",
      comarca: "Osasco",
      fase: "Resposta à acusação",
      status: "ativo",
      parte_contraria: "Ministério Público de São Paulo",
      objeto: "Ação penal — art. 155, §4º, CP. Tese: ausência de justa causa; pedido de absolvição sumária.",
      responsavel_id: m1,
      monitorado: false,
    },
    {
      id: p5,
      cliente_id: c4,
      area: "outra",
      fase: "Consultivo",
      status: "ativo",
      objeto: "Consultoria preventiva em compliance criminal empresarial.",
      responsavel_id: m1,
      monitorado: false,
    },
  ],

  andamentos: [
    { id: "a-0001", processo_id: p1, data: d(-1), origem: "tribunal", descricao: "Juntada de laudo pericial definitivo — Instituto de Criminalística." },
    { id: "a-0002", processo_id: p1, data: d(-6), origem: "tribunal", descricao: "Audiência de instrução designada. Intimadas as partes." },
    { id: "a-0003", processo_id: p1, data: d(-15), origem: "manual", descricao: "Reunião com a família do cliente. Alinhada estratégia para oitiva das testemunhas de defesa." },
    { id: "a-0004", processo_id: p2, data: d(-2), origem: "tribunal", descricao: "Vista ao Ministério Público sobre o pedido de progressão de regime." },
    { id: "a-0005", processo_id: p2, data: d(-20), origem: "manual", descricao: "Protocolado pedido de progressão ao regime semiaberto com atestado de conduta carcerária." },
    { id: "a-0006", processo_id: p3, data: d(-3), origem: "tribunal", descricao: "Autos conclusos ao relator — 5ª Câmara de Direito Criminal." },
    { id: "a-0007", processo_id: p3, data: d(-10), origem: "tribunal", descricao: "Recebida a apelação. Aberto prazo para razões recursais." },
    { id: "a-0008", processo_id: p4, data: d(-4), origem: "tribunal", descricao: "Citação do réu. Prazo de 10 dias para resposta à acusação." },
  ],

  prazos: [
    {
      id: "pz-0001",
      processo_id: p3,
      titulo: "Razões de apelação — Carlos Mendes",
      tipo: "Apelação",
      data_limite: d(2),
      data_interna: d(1),
      status: "pendente",
      responsavel_id: m1,
      notas: "Preliminar de cerceamento + mérito (in dubio pro reo). Minuta iniciada.",
    },
    {
      id: "pz-0002",
      processo_id: p4,
      titulo: "Resposta à acusação — Roberto Lima",
      tipo: "Resposta à acusação",
      data_limite: d(6),
      data_interna: d(4),
      status: "pendente",
      responsavel_id: m1,
      notas: "Requerer absolvição sumária (art. 397, CPP).",
    },
    {
      id: "pz-0003",
      processo_id: p1,
      titulo: "Manifestação sobre laudo pericial",
      tipo: "Manifestação",
      data_limite: d(9),
      status: "pendente",
      responsavel_id: m2,
      notas: "Verificar cadeia de custódia do material apreendido.",
    },
    {
      id: "pz-0004",
      processo_id: p2,
      titulo: "Réplica à cota do MP (progressão)",
      tipo: "Manifestação",
      data_limite: d(14),
      status: "pendente",
      responsavel_id: m1,
    },
    {
      id: "pz-0005",
      processo_id: p2,
      titulo: "Juntar atestado de trabalho para remição",
      tipo: "Petição",
      data_limite: d(-12),
      status: "concluido",
      concluido_em: d(-13),
      responsavel_id: m2,
    },
  ],

  eventos_agenda: [
    {
      id: "e-0001",
      tipo: "audiencia",
      titulo: "Audiência de instrução — Carlos Mendes",
      processo_id: p1,
      cliente_id: c1,
      inicio: dh(5, 14, 0),
      fim: dh(5, 16, 0),
      local: "Fórum Criminal da Barra Funda — sala 12",
      notas: "Oitiva de 3 testemunhas de acusação e 2 de defesa.",
    },
    {
      id: "e-0002",
      tipo: "atendimento",
      titulo: "Atendimento — família de Carlos Mendes",
      cliente_id: c1,
      inicio: dh(1, 10, 0),
      fim: dh(1, 11, 0),
      local: "Escritório",
    },
    {
      id: "e-0003",
      tipo: "reuniao",
      titulo: "Reunião de compliance — Mendes & Filhos",
      cliente_id: c4,
      inicio: dh(3, 9, 30),
      link_virtual: "https://meet.google.com/exemplo",
    },
    {
      id: "e-0004",
      tipo: "sustentacao",
      titulo: "Sustentação oral — apelação (5ª Câmara)",
      processo_id: p3,
      cliente_id: c1,
      inicio: dh(12, 13, 30),
      local: "TJSP — Palácio da Justiça",
      notas: "Confirmar pauta com o gabinete do relator.",
    },
  ],

  tarefas: [
    { id: "t-0001", titulo: "Finalizar minuta das razões de apelação", processo_id: p3, responsavel_id: m1, data_limite: d(1), prioridade: "alta", status: "fazendo" },
    { id: "t-0002", titulo: "Pedir cópia do laudo à perícia", processo_id: p1, responsavel_id: m2, data_limite: d(2), prioridade: "media", status: "pendente" },
    { id: "t-0003", titulo: "Emitir boleto da parcela 3 — Carlos Mendes", cliente_id: c1, responsavel_id: m3, data_limite: d(3), prioridade: "media", status: "pendente" },
    { id: "t-0004", titulo: "Organizar dossiê da audiência de instrução", processo_id: p1, responsavel_id: m2, data_limite: d(4), prioridade: "alta", status: "pendente" },
  ] as Record<string, unknown>[],

  documentos: [
    { id: "d-0001", nome: "Denúncia — MP.pdf", processo_id: p1, cliente_id: c1, tipo: "Peça processual", tamanho: 245000, visivel_cliente: true, enviado_por: m1 },
    { id: "d-0002", nome: "Laudo pericial definitivo.pdf", processo_id: p1, cliente_id: c1, tipo: "Prova", tamanho: 1200000, visivel_cliente: false, enviado_por: m2 },
    { id: "d-0003", nome: "Sentença condenatória — 1º grau.pdf", processo_id: p3, cliente_id: c1, tipo: "Decisão", tamanho: 480000, visivel_cliente: true, enviado_por: m1 },
    { id: "d-0004", nome: "Contrato de honorários — Carlos Mendes.pdf", cliente_id: c1, tipo: "Contrato", tamanho: 98000, visivel_cliente: true, enviado_por: m3 },
    { id: "d-0005", nome: "Atestado de conduta carcerária.pdf", processo_id: p2, cliente_id: c2, tipo: "Documento", tamanho: 156000, visivel_cliente: true, enviado_por: m2 },
  ],

  contratos_honorarios: [
    { id: "h-0001", cliente_id: c1, processo_id: p1, tipo: "fixo", valor_fixo: 18000, descricao: "Defesa criminal completa — 1º grau. 6x de R$ 3.000.", status: "ativo" },
    { id: "h-0002", cliente_id: c1, processo_id: p3, tipo: "fixo", valor_fixo: 12000, descricao: "Apelação criminal. 4x de R$ 3.000.", status: "ativo" },
    { id: "h-0003", cliente_id: c2, processo_id: p2, tipo: "fixo", valor_fixo: 6000, descricao: "Execução penal — progressão de regime. 3x de R$ 2.000.", status: "ativo" },
    { id: "h-0004", cliente_id: c4, tipo: "hora", valor_hora: 450, descricao: "Consultoria em compliance criminal — por hora.", status: "ativo" },
  ],

  lancamentos: [
    { id: "l-0001", tipo: "receita", categoria: "Honorários", cliente_id: c1, processo_id: p1, descricao: "Parcela 2/6 — defesa criminal", valor: 3000, vencimento: d(-30), pago_em: d(-28), forma_pagamento: "PIX" },
    { id: "l-0002", tipo: "receita", categoria: "Honorários", cliente_id: c1, processo_id: p1, descricao: "Parcela 3/6 — defesa criminal", valor: 3000, vencimento: d(-2) },
    { id: "l-0003", tipo: "receita", categoria: "Honorários", cliente_id: c1, processo_id: p3, descricao: "Parcela 1/4 — apelação", valor: 3000, vencimento: d(5) },
    { id: "l-0004", tipo: "receita", categoria: "Honorários", cliente_id: c2, processo_id: p2, descricao: "Parcela 2/3 — progressão de regime", valor: 2000, vencimento: d(10) },
    { id: "l-0005", tipo: "receita", categoria: "Consultoria", cliente_id: c4, descricao: "Horas de consultoria — mês anterior (8h)", valor: 3600, vencimento: d(-5), pago_em: d(-5), forma_pagamento: "Transferência" },
    { id: "l-0006", tipo: "despesa", categoria: "Custas", processo_id: p3, descricao: "Preparo da apelação", valor: 380, vencimento: d(1) },
    { id: "l-0007", tipo: "despesa", categoria: "Estrutura", descricao: "Aluguel do escritório", valor: 4500, vencimento: d(8) },
    { id: "l-0008", tipo: "despesa", categoria: "Assinaturas", descricao: "Monitoramento processual (API tribunais)", valor: 249, vencimento: d(8) },
  ],

  // Caixa de pautas — exemplos do que o monitoramento traz das fontes oficiais.
  pautas: [
    {
      id: "pt-0001",
      fonte: "stf",
      externo_id: "demo-stf-1",
      titulo: "STF conclui julgamento sobre marco temporal da prescrição em crimes continuados",
      resumo: "Plenário fixa tese sobre o termo inicial da contagem da prescrição nos crimes praticados em continuidade delitiva.",
      url: "https://portal.stf.jus.br/",
      data_fonte: d(-1),
      tema: "prescrição",
      status: "nova",
    },
    {
      id: "pt-0002",
      fonte: "stj",
      externo_id: "demo-stj-1",
      titulo: "Sexta Turma do STJ reafirma nulidade de busca domiciliar sem justa causa",
      resumo: "Colegiado anula provas obtidas em entrada forçada na residência sem fundadas razões, reforçando o Tema 280.",
      url: "https://www.stj.jus.br/",
      data_fonte: d(-2),
      tema: "processo penal",
      status: "nova",
    },
    {
      id: "pt-0003",
      fonte: "camara",
      externo_id: "demo-camara-1",
      titulo: "PL amplia hipóteses de substituição da pena privativa de liberdade",
      resumo: "Projeto em tramitação na Câmara altera o art. 44 do Código Penal para ampliar as penas restritivas de direitos.",
      url: "https://www.camara.leg.br/",
      data_fonte: d(-3),
      tema: "pena",
      status: "nova",
    },
    {
      id: "pt-0004",
      fonte: "senado",
      externo_id: "demo-senado-1",
      titulo: "Senado analisa mudança na execução penal sobre remição pela leitura",
      resumo: "Matéria propõe critérios uniformes para remição de pena pela leitura e pelo estudo.",
      url: "https://www25.senado.leg.br/",
      data_fonte: d(-5),
      tema: "execução penal",
      status: "usada",
    },
  ],

  posts: [
    {
      id: "ps-0001",
      titulo: "Busca domiciliar sem justa causa: o que muda com a nova decisão do STJ",
      slug: "busca-domiciliar-sem-justa-causa-stj",
      resumo: "A Sexta Turma reafirmou que a entrada na residência sem fundadas razões contamina as provas. Entenda os efeitos práticos para a defesa.",
      conteudo:
        "A Sexta Turma do Superior Tribunal de Justiça voltou a enfrentar um tema central para a defesa criminal: os limites da busca domiciliar.\n\n## O que foi decidido\n\nO colegiado reafirmou que a entrada forçada em domicílio exige **fundadas razões** — mera denúncia anônima ou \"atitude suspeita\" não bastam. Sem esse lastro, as provas obtidas são nulas.\n\n## Por que isso importa\n\nNa prática, abre-se caminho para o reconhecimento da ilicitude da prova e, por consequência, da absolvição em casos de flagrante decorrente de diligência irregular.\n\n*Este texto tem caráter informativo e não constitui aconselhamento jurídico.*",
      autor: "Gustavo Roberto de Camargo",
      fonte_url: "https://www.stj.jus.br/",
      status: "publicado",
      publicado_em: dh(-2, 9, 30),
      pauta_id: "pt-0002",
    },
  ],
};
