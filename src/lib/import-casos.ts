// Casos reconstruídos a partir das conversas de WhatsApp (jul/2026).
// A importação (importarCasosWhatsapp) é IDEMPOTENTE e casa cada caso com o
// cliente que já existe (por CPF ou nome), complementando em vez de duplicar.
// Ids próprios com prefixo "impcw-" para poder rodar de novo sem duplicar.

export interface CasoWhatsapp {
  idx: number;
  match: string[]; // nomes candidatos para localizar o cliente já cadastrado
  cpf?: string; // se souber, casa por CPF (mais confiável)
  enriquecer?: { nome?: string; cpf_cnpj?: string; rg?: string; endereco?: string; nota?: string };
  processos: {
    id: string; // "impcw-p-.." para novo, ou id existente (ex. "impzp-p-105") para reaproveitar
    numero_cnj?: string;
    area?: string;
    objeto: string;
    parte_contraria?: string;
    comarca?: string;
    situacao?: string;
  }[];
  andamentos: { processo: string; data: string; descricao: string }[];
  eventos?: { id: string; tipo: string; titulo: string; inicio: string; local?: string; processo?: string }[];
  pagamentos?: { id: string; valor: number; data: string; descricao: string }[];
}

// Clientes que NÃO são clientes (pagamentos por outros motivos) — serão removidos.
export const REMOVER_CLIENTES = ["imp26c-joaoluizdeo", "imp26c-gustavorob"];

export const CASOS_WHATSAPP: CasoWhatsapp[] = [
  {
    idx: 201,
    match: ["valquiria pach", "valquiria", "valdeci"],
    enriquecer: { nota: "Pagadora: Valquíria Pacheco Machado (filha, OAB 543.152). Réu: Valdeci (pai)." },
    processos: [
      {
        id: "impzp-p-105", // já criado na importação de contratos (reaproveita)
        numero_cnj: "1500298-89.2025.8.26.0470",
        area: "criminal",
        objeto: "Inquérito — acusação da tia (Idalina), Barra do Turvo. Pedido de trancamento (atipicidade/falta de justa causa).",
        parte_contraria: "Ministério Público",
        comarca: "Barra do Turvo",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-201g",
        numero_cnj: "1500241-71.2025.8.26.0470",
        area: "criminal",
        objeto: "Inquérito — acusação da criança Isabeli, Guareí (art. 217-A). Pedido de trancamento; oitiva por precatória em Mogi Mirim.",
        parte_contraria: "Ministério Público",
        comarca: "Guareí",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impzp-p-105", data: "2025-12-03", descricao: "Protocolado requerimento de trancamento de inquérito (caso da tia — art. 213)." },
      { processo: "impcw-p-201g", data: "2025-11-28", descricao: "Protocolado requerimento de trancamento de inquérito (caso da criança — art. 217-A)." },
      { processo: "impcw-p-201g", data: "2026-02-20", descricao: "Exame pericial negativo. Oitiva da criança designada por carta precatória (Mogi Mirim), via Teams, para 11/06/2026." },
      { processo: "impcw-p-201g", data: "2026-03-20", descricao: "MP manifestou-se pelo indeferimento do trancamento; acompanhando para eventual HC." },
    ],
    eventos: [
      { id: "impcw-e-201-1", tipo: "audiencia", titulo: "Oitiva da criança (Isabeli) — precatória Mogi Mirim (Valdeci)", inicio: "2026-06-11T14:00:00", local: "Via Teams", processo: "impcw-p-201g" },
    ],
  },
  {
    idx: 202,
    match: ["vanessa de mel", "vanessa"],
    cpf: "492.613.748-83",
    enriquecer: {
      nome: "Vanessa de Mello",
      cpf_cnpj: "492.613.748-83",
      rg: "55.687.500-X",
      endereco: "Rua Otaviano Ferreira Leite, nº 60, Santo Bueno (CDHU nova), Buri-SP",
      nota: "Pagadora — defesa do irmão Vagner de Mello Góes (CPF 355.961.488-06).",
    },
    processos: [
      {
        id: "impcw-p-202",
        area: "criminal",
        objeto: "Defesa do réu Vagner de Mello Góes — condenação por falso testemunho (pena 4a5m). Revisão criminal / HC buscando redução e regime semiaberto.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-202", data: "2026-06-03", descricao: "Contratação e início. Réu no CDP de Sorocaba (depois transferido para P2 de Guareí)." },
      { processo: "impcw-p-202", data: "2026-06-09", descricao: "HC impetrado no STJ nº 2026/0228512-7 — distribuído a ministro." },
      { processo: "impcw-p-202", data: "2026-06-12", descricao: "HC negado; ministro pediu informações ao tribunal, seguindo para a PGR e retorno para decisão." },
      { processo: "impcw-p-202", data: "2026-08-05", descricao: "Nova decisão: negada, sob alegação de coisa julgada (mérito não analisado). Avaliar novos meios de impugnação." },
    ],
    pagamentos: [
      { id: "impcw-l-202-1", valor: 300, data: "2026-07-03", descricao: "Honorários — parcela (defesa de Vagner de Mello Góes)" },
      { id: "impcw-l-202-2", valor: 300, data: "2026-08-03", descricao: "Honorários — parcela (defesa de Vagner de Mello Góes)" },
    ],
  },
  {
    idx: 203,
    match: ["karina pres", "karina"],
    enriquecer: { nota: "Pagadora: Karina Prestes (mãe). Réu: Kauã." },
    processos: [
      {
        id: "impcw-p-203",
        area: "criminal",
        objeto: "Defesa do réu Kauã. Preso no CDP de Sorocaba; liminar em HC concedida (soltura). Responde em liberdade, aguardando audiência de instrução.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-203", data: "2026-02-11", descricao: "Liminar concedida em Habeas Corpus — expedido alvará de soltura do Kauã." },
      { processo: "impcw-p-203", data: "2026-05-18", descricao: "Audiência de instrução remarcada pelo juízo para 18/08/2026, às 14h." },
    ],
    eventos: [
      { id: "impcw-e-203-1", tipo: "audiencia", titulo: "Audiência de instrução — Kauã", inicio: "2026-08-18T14:00:00", processo: "impcw-p-203" },
    ],
    pagamentos: [
      { id: "impcw-l-203-1", valor: 200, data: "2026-07-13", descricao: "Honorários — parcela (defesa de Kauã)" },
    ],
  },
  {
    idx: 204,
    match: ["roselina rodri", "roselina"],
    enriquecer: { nota: "Pagadora: Roselina Rodrigues. Réu: Leonardo. Conferir parcelas — planilha só tem 1 pagamento, mas há comprovantes mensais na conversa." },
    processos: [
      {
        id: "impcw-p-204",
        numero_cnj: "0010374-93.2025.8.26.0521",
        area: "execucao_penal",
        objeto: "Execução penal do Leonardo — pedido de progressão/liberdade e remição (atestado e boletim informativo).",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-204", data: "2026-04-17", descricao: "Enviada cópia da decisão do processo de execução (0010374-93.2025.8.26.0521)." },
      { processo: "impcw-p-204", data: "2026-07-16", descricao: "Peticionado pedido de liberdade/progressão; acompanhando manifestação sobre eventual regressão." },
    ],
  },
  {
    idx: 205,
    match: ["cristiane", "cristiane roberta"],
    cpf: "321.400.418-28",
    enriquecer: {
      nome: "Cristiane Roberta Rodrigues da Costa",
      cpf_cnpj: "321.400.418-28",
      rg: "45.140.873-1",
      endereco: "Rua Julio Stein, nº 33, Jardim Paraíso, Indaiatuba-SP",
      nota: "Esposa/pagadora — defesa do David Ribeiro de Oliveira. Contrato 6x450 (1ª paga 21/07).",
    },
    processos: [
      {
        id: "impcw-p-205",
        area: "criminal",
        objeto: "Defesa do réu David Ribeiro de Oliveira — descumprimento de medida protetiva (Lei Maria da Penha). Processo em segredo de justiça; preso no CDP de Hortolândia.",
        parte_contraria: "Ministério Público",
        comarca: "Indaiatuba",
        situacao: "precisa_agir",
      },
    ],
    andamentos: [
      { processo: "impcw-p-205", data: "2026-07-17", descricao: "Réu preso novamente (descumprimento de medida). Audiência de custódia; encaminhado ao CDP de Hortolândia." },
      { processo: "impcw-p-205", data: "2026-07-23", descricao: "Procuração colhida no presídio; iniciado o acesso ao processo (segredo de justiça)." },
    ],
    eventos: [
      { id: "impcw-e-205-1", tipo: "video", titulo: "Atendimento por vídeo — David (CDP Hortolândia)", inicio: "2026-08-06T11:00:00", local: "Teams — CDP Hortolândia", processo: "impcw-p-205" },
    ],
  },
  {
    idx: 206,
    match: ["davi ferreira", "davi ferreira da silva"],
    enriquecer: { nota: "Contratante: Davi Ferreira da Silva. Réu: Alison de Paula Silva (CPF 538.665.678-39). Contrato 8x550 (1ª paga 27/07)." },
    processos: [
      {
        id: "impcw-p-206",
        numero_cnj: "1510989-16.2026.8.26.0378",
        area: "criminal",
        objeto: "Defesa do réu Alison de Paula Silva — tentativa de latrocínio (Pilar do Sul). Preso na Cadeia Pública de Capão Bonito.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-206", data: "2026-07-28", descricao: "Impetrado Habeas Corpus (independente de procuração) em favor do réu." },
      { processo: "impcw-p-206", data: "2026-07-29", descricao: "Peticionada habilitação nos autos; atendimento com o réu na Cadeia Pública de Capão Bonito." },
    ],
  },
  {
    idx: 207,
    match: ["wagner de o", "wagner"],
    enriquecer: { nota: "Contrato quitado integralmente em 24/07/2026 (parcelas de R$ 250)." },
    processos: [
      {
        id: "impcw-p-207",
        area: "criminal",
        objeto: "Acompanhamento criminal — parcelas de R$ 250, quitadas.",
        situacao: "encerrado_quitado",
      },
    ],
    andamentos: [
      { processo: "impcw-p-207", data: "2026-07-24", descricao: "Todas as parcelas quitadas. Contrato encerrado." },
    ],
  },
  {
    idx: 208,
    match: ["luana donizeti", "luana"],
    enriquecer: {
      nome: "Luana Donizeti Ferreira da Silva",
      endereco: "Rua das Camélias, Vila Rosa, nº 17, Buri-SP",
      nota: "Esposa/pagadora — defesa do Ronaldo Ferreira da Silva (CPF 517.353.048-08). Contrato 10x600 (dia 12).",
    },
    processos: [
      {
        id: "impcw-p-208",
        numero_cnj: "1500420-97.2026.8.26.0622",
        area: "criminal",
        objeto: "Defesa do réu Ronaldo Ferreira da Silva — tráfico de drogas (réu primário), preso no CDP de Sorocaba. HC buscando responder em liberdade.",
        parte_contraria: "Ministério Público",
        comarca: "Buri",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-208", data: "2026-06-15", descricao: "Procuração colhida; Habeas Corpus impetrado. Réu no CDP de Sorocaba." },
      { processo: "impcw-p-208", data: "2026-07-07", descricao: "Processo remetido à comarca de Buri; aguardando intimação para defesa prévia e designação de audiência." },
    ],
    pagamentos: [
      { id: "impcw-l-208-1", valor: 600, data: "2026-07-10", descricao: "Honorários — parcela (defesa de Ronaldo Ferreira da Silva)" },
    ],
  },
  {
    idx: 209,
    match: ["rodrigo fer", "rodrigo"],
    cpf: "389.192.418-64",
    enriquecer: {
      nome: "Rodrigo Fernandes de Souza",
      cpf_cnpj: "389.192.418-64",
      rg: "39.506.621-9",
      endereco: "Rua Guimarães Rosa, nº 1070, Jardim América — CEP 85864-260",
      nota: "Irmão/pagador — defesa do Danilo (CPF 359.467.278-69). Contrato 10x800 com HC.",
    },
    processos: [
      {
        id: "impcw-p-209",
        numero_cnj: "1500941-34.2026.8.26.0269",
        area: "criminal",
        objeto: "Defesa do réu Danilo — prisão preventiva (Lei Maria da Penha). Preso na P2 de Itapetininga. HC nº 2117734-30.2026.8.26.0000.",
        parte_contraria: "Ministério Público",
        comarca: "Itapetininga",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-209", data: "2026-05-11", descricao: "Habeas Corpus impetrado (nº 2117734-30.2026.8.26.0000)." },
      { processo: "impcw-p-209", data: "2026-05-19", descricao: "Preventiva mantida; MP ofereceu denúncia. Requerida perícia de oxidação de digitais e arroladas testemunhas." },
      { processo: "impcw-p-209", data: "2026-07-26", descricao: "Ordem concedida no HC — liberdade; alvará de soltura expedido." },
    ],
    eventos: [
      { id: "impcw-e-209-1", tipo: "audiencia", titulo: "Audiência de instrução — Danilo", inicio: "2026-07-29T16:30:00", processo: "impcw-p-209" },
    ],
    pagamentos: [
      { id: "impcw-l-209-1", valor: 800, data: "2026-07-17", descricao: "Honorários — 3ª parcela (defesa de Danilo)" },
    ],
  },
  {
    idx: 210,
    match: ["etiene"],
    enriquecer: {
      nome: "Etiene (defesa de Gislaine)",
      nota: "Pagadora (Etiene) — defesa de Gislaine Ferreira Martins, na Penitenciária Feminina de Votorantim (matrícula 637141). À vista R$ 1.600. Conferir/completar nome e CPF da contratante.",
    },
    processos: [
      {
        id: "impcw-p-210",
        area: "execucao_penal",
        objeto: "Defesa de Gislaine Ferreira Martins (Penitenciária Feminina de Votorantim) — redução de pena/regime (extensão do caso do Vagner) e tentativa de prisão domiciliar.",
        parte_contraria: "Ministério Público",
        comarca: "Votorantim",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-210", data: "2026-07-22", descricao: "Procuração colhida no presídio; iniciado o trabalho de redução de pena/regime." },
    ],
    pagamentos: [
      { id: "impcw-l-210-1", valor: 1600, data: "2026-07-17", descricao: "Honorários — à vista (defesa de Gislaine Ferreira Martins)" },
    ],
  },
  {
    idx: 211,
    match: ["daiane cristina", "daiane cristina freitas"],
    cpf: "299.423.448-37",
    enriquecer: {
      nome: "Daiane Cristina Freitas Oliveira da Cunha",
      cpf_cnpj: "299.423.448-37",
      rg: "42.131.587-8",
      endereco: "Rua Doutor Manoel Guimarães, nº 319",
      nota: "Pagadora — defesa do Antônio Marcos de Jesus Pereira. Contrato 12x375.",
    },
    processos: [
      {
        id: "impcw-p-211",
        area: "criminal",
        objeto: "Defesa do réu Antônio Marcos de Jesus Pereira — tráfico de drogas; preso em Iperó. HC para responder em liberdade.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-211", data: "2026-07-06", descricao: "Habeas Corpus impetrado (réu preso em Iperó)." },
      { processo: "impcw-p-211", data: "2026-08-04", descricao: "Concedido o alvará de soltura do Antônio." },
    ],
    eventos: [
      { id: "impcw-e-211-1", tipo: "audiencia", titulo: "Audiência de instrução — Antônio Marcos de Jesus Pereira", inicio: "2026-08-25T16:15:00", processo: "impcw-p-211" },
    ],
    pagamentos: [
      { id: "impcw-l-211-1", valor: 375, data: "2026-07-01", descricao: "Honorários — 1ª parcela (defesa de Antônio Marcos de Jesus Pereira)" },
    ],
  },
  {
    idx: 212,
    match: ["ana laura r"],
    enriquecer: { nota: "Irmã/pagadora — defesa do Efrain. Contrato 6x400." },
    processos: [
      {
        id: "impcw-p-212",
        area: "criminal",
        objeto: "Defesa do réu Efrain — prisão preventiva; transferido para a ADP de Iperó. HC no Tribunal (liminar negada) + pedido de liberdade ao juízo de origem.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-212", data: "2026-06-09", descricao: "Habeas Corpus impetrado (réu preso, preventiva)." },
      { processo: "impcw-p-212", data: "2026-06-26", descricao: "Liminar negada; HC segue para julgamento. Feito pedido de liberdade ao juízo de origem." },
      { processo: "impcw-p-212", data: "2026-07-27", descricao: "Decisão de liberdade proferida; aguardando expedição/chegada do alvará no presídio." },
    ],
    pagamentos: [
      { id: "impcw-l-212-1", valor: 400, data: "2026-07-08", descricao: "Honorários — parcela (defesa de Efrain)" },
    ],
  },
  {
    idx: 213,
    match: ["iracema feliza", "iracema"],
    enriquecer: {
      cpf_cnpj: "097.866.368-30",
      endereco: "Rua Avises Ravacci, nº 94",
      nota: "Contato: filho Edward. TRÊS frentes — (1) reclamação trabalhista (ex-empregada da Viação Estevam); (2) criminal (agressão sofrida por Iracema — agressora Renata); (3) cível/consumidor (compra de veículo, concessionária + banco). Conferir valores e separar melhor os processos.",
    },
    processos: [
      {
        id: "impcw-p-213t",
        area: "trabalhista",
        objeto: "Reclamação trabalhista de Iracema contra a Viação Estevam (verbas rescisórias/FGTS). Justiça gratuita requerida.",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-213c",
        area: "civel",
        objeto: "Ação cível/consumidor sobre compra de veículo (concessionária + banco). Conferir dados e valores.",
        situacao: "preciso_agir",
      },
    ],
    andamentos: [
      { processo: "impcw-p-213t", data: "2026-05-20", descricao: "Procuração e documentos colhidos; ajuizada reclamação trabalhista com pedido de justiça gratuita." },
      { processo: "impcw-p-213c", data: "2026-07-01", descricao: "Enviado checklist de documentos para a ação sobre o veículo (concessionária/banco)." },
    ],
  },
  {
    idx: 214,
    match: ["andrea farias", "andrea"],
    cpf: "344.751.328-43",
    enriquecer: {
      cpf_cnpj: "344.751.328-43",
      rg: "37.792.730-2",
      nota: "Mãe/pagadora — defesa do Wendell Kemerson Farias de Souza (2 processos). Contrato R$ 4.000 (entrada 1.000 + 6x500).",
    },
    processos: [
      {
        id: "impzp-p-101", // processo já criado na importação de contratos (reaproveita)
        area: "criminal",
        objeto: "Defesa do réu Wendell — 1º processo (CDP de Sorocaba). Sentenciado a 9 anos (regime fechado); em apelação para redução da pena.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-214b",
        area: "criminal",
        objeto: "Defesa do réu Wendell — 2º processo (preventiva). Audiência de instrução realizada.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impzp-p-101", data: "2026-03-26", descricao: "Realizada a audiência de instrução do 1º processo." },
      { processo: "impcw-p-214b", data: "2026-05-21", descricao: "Realizada a audiência de instrução do 2º processo (juiz de Pilar do Sul)." },
      { processo: "impzp-p-101", data: "2026-07-10", descricao: "Sentença: 9 anos em regime fechado. Interposta apelação buscando redução (fração de 2/5)." },
    ],
    pagamentos: [
      { id: "impcw-l-214-1", valor: 250, data: "2026-07-06", descricao: "Honorários — parcela final parcial (defesa de Wendell); saldo de R$ 300 a receber" },
    ],
  },
];
