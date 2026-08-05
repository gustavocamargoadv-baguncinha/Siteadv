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
    pagamentos: [
      { id: "impcw-l-204-1", valor: 400, data: "2026-01-28", descricao: "Honorários — parcela (execução do Leonardo — Roselina)" },
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
  {
    idx: 215,
    match: ["romer"],
    enriquecer: { nota: "Contato/pagador de terceiro. Réu: Romer/Alex (execução penal). Contrato R$ 1.800 (4x400). Conferir nome completo." },
    processos: [
      {
        id: "impcw-p-215",
        numero_cnj: "0002889-30.2025.8.26.0428",
        area: "execucao_penal",
        objeto: "Execução penal (réu preso na P2) — recurso de agravo em execução (R.A.). Juiz converteu duas penas de regime aberto em fechado; busca-se reverter.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-215", data: "2026-06-29", descricao: "Procuração colhida; solicitado boletim informativo e atestado de pena." },
      { processo: "impcw-p-215", data: "2026-07-03", descricao: "Protocolado o recurso de agravo em execução (R.A.)." },
    ],
    pagamentos: [
      { id: "impcw-l-215-1", valor: 400, data: "2026-06-27", descricao: "Honorários — 1ª parcela (execução penal — Romer/Alex)" },
    ],
  },
  {
    idx: 216,
    match: ["anderson campo", "anderson campos"],
    enriquecer: { nota: "Pagador — defesa do Sérgio da Silva (CPF 100.008.538-44). Contrato 8x400 (dia 20)." },
    processos: [
      {
        id: "impcw-p-216",
        area: "criminal",
        objeto: "Defesa do réu Sérgio da Silva — revisão criminal (preso, transferido para Iperó). Revisão negada no TJ; impetrado HC no STJ.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-216", data: "2026-03-31", descricao: "Revisão criminal julgada e negada pelo Tribunal de Justiça." },
      { processo: "impcw-p-216", data: "2026-04-14", descricao: "Impetrado Habeas Corpus no STJ — distribuído a ministro; aguardando decisão." },
    ],
    pagamentos: [
      { id: "impcw-l-216-1", valor: 400, data: "2026-07-20", descricao: "Honorários — parcela (defesa de Sérgio da Silva)" },
    ],
  },
  {
    idx: 217,
    match: ["cesar morei", "cesar moreira"],
    enriquecer: { nota: "Réu: César Moreira (2 casos). 1º caso: apelação ganha (pena reduzida a 1a8m, regime aberto). 2º caso: Maria da Penha. Há saldo de honorários a receber — conferir." },
    processos: [
      {
        id: "impcw-p-217",
        numero_cnj: "1500040-60.2025.8.26.0444",
        area: "criminal",
        objeto: "Defesa do réu César Moreira — 2º caso (Lei Maria da Penha / agressão). Responde em liberdade; audiência de instrução realizada em 23/06/2026.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-217", data: "2026-05-28", descricao: "1º caso: apelação provida — pena reduzida de 6a8m para 1a8m em regime aberto." },
      { processo: "impcw-p-217", data: "2026-06-23", descricao: "Realizada a audiência de instrução do 2º caso (Maria da Penha)." },
    ],
  },
  {
    idx: 218,
    match: ["edvan lemes", "edvan"],
    enriquecer: { nota: "Réu: Edvan. Contrato R$ 2.520 (6x420). ANPP recusado pelo promotor; busca-se revisão da audiência + acordo cível com a vítima." },
    processos: [
      {
        id: "impcw-p-218",
        numero_cnj: "1503014-47.2024.8.26.0269",
        area: "criminal",
        objeto: "Defesa do réu Edvan — recusa de ANPP (acordo de não persecução penal) pelo Ministério Público. Firmado acordo cível com a vítima e pedida a revisão da audiência.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-218", data: "2025-07-25", descricao: "Acordo cível com a vítima assinado e juntado; peticionada a revisão da audiência de ANPP." },
    ],
  },
  {
    idx: 219,
    match: ["rayssa vitoria", "rayssa"],
    enriquecer: {
      nota: "Pagadora: Rayssa (esposa). Réu: Moisés Nunes da Rocha (RG 57.945.095-8, mãe Mirian Nunes Ferreira), preso na P2 de Itapetininga e depois transferido para Iperó. Serviços avulsos de atendimento/diligência no presídio (levar e trazer recados à família) — não é contrato de defesa completa.",
    },
    processos: [
      {
        id: "impcw-p-219",
        area: "criminal",
        objeto: "Atendimentos e diligências no presídio para o réu Moisés Nunes da Rocha (recados à família). Serviços avulsos — não é defesa completa.",
        situacao: "aguardando_cliente",
      },
    ],
    andamentos: [
      { processo: "impcw-p-219", data: "2026-06-01", descricao: "Atendimento no presídio (P2 Itapetininga) — recado à família." },
      { processo: "impcw-p-219", data: "2026-06-09", descricao: "Réu transferido para Iperó; combinado atendimento por vídeo." },
    ],
  },
  {
    idx: 220,
    match: ["bruno de ol", "bruno"],
    cpf: "438.328.508-21",
    enriquecer: {
      cpf_cnpj: "438.328.508-21",
      rg: "43.310.321-8",
      endereco: "Rua Waldomiro Vaz da Rocha, nº 203, Nova Itapetininga, Itapetininga-SP",
      nota: "Réu do próprio caso. Contrato R$ 1.800 (4x450) para defesa + eventual recurso. Todo dia 01 o vencimento.",
    },
    processos: [
      {
        id: "impcw-p-220",
        numero_cnj: "1500849-61.2023.8.26.0269",
        area: "criminal",
        objeto: "Defesa do réu Bruno — acusação de furto qualificado (defesa sustenta apropriação, bem mais branda). Busca-se acordo/absolvição; vítima (Clarice) não localizada para intimação.",
        parte_contraria: "Ministério Público",
        comarca: "Itapetininga",
        situacao: "precisa_agir",
      },
    ],
    andamentos: [
      { processo: "impcw-p-220", data: "2026-06-08", descricao: "Procuração colhida e habilitação nos autos; petição juntada." },
      { processo: "impcw-p-220", data: "2026-07-03", descricao: "Ministério Público se manifestou insistindo na intimação da vítima." },
      { processo: "impcw-p-220", data: "2026-08-04", descricao: "MP pediu nova tentativa de intimação da vítima (Clarice) em endereço na Rua Waldomiro Vaz da Rocha; audiência pode ser remarcada." },
    ],
    eventos: [
      { id: "impcw-e-220-1", tipo: "audiencia", titulo: "Audiência de instrução — Bruno (online) — pode ser remarcada (vítima não localizada)", inicio: "2026-08-06T00:00:00", local: "Online", processo: "impcw-p-220" },
    ],
    pagamentos: [
      { id: "impcw-l-220-1", valor: 450, data: "2026-08-05", descricao: "Honorários — parcela (defesa de Bruno — furto/apropriação)" },
    ],
  },
  {
    idx: 221,
    match: ["vanda toledo", "vanda"],
    enriquecer: {
      nome: "Vanda Toledo",
      nota: "Pagadora: Vanda Toledo. Réu: Matheus — preso em flagrante; defesa na audiência de custódia obteve a liberdade. ATENÇÃO: há comprovante de pagamento de 17/06/2026 (foto) sem valor informado na conversa — lançar manualmente o valor no financeiro.",
    },
    processos: [
      {
        id: "impcw-p-221",
        area: "criminal",
        objeto: "Defesa do réu Matheus — prisão em flagrante. Na audiência de custódia o juiz acolheu a defesa e concedeu a liberdade (o MP havia pedido a prisão).",
        parte_contraria: "Ministério Público",
        situacao: "encerrado",
      },
    ],
    andamentos: [
      { processo: "impcw-p-221", data: "2026-06-17", descricao: "Audiência de custódia — defesa acolhida; concedida a liberdade e expedido alvará de soltura. Réu solto no mesmo dia." },
    ],
  },
  {
    idx: 222,
    match: ["valdeci ant", "valdeci da van", "valdeci"],
    enriquecer: {
      nota: "Réu do próprio caso — Valdeci (motorista de van). Paga honorários em parcelas mensais (comprovantes na conversa; a parcela de 10/06/2026 = R$ 350 já consta na planilha). Conferir número do processo e demais valores/parcelas.",
    },
    processos: [
      {
        id: "impcw-p-222",
        area: "criminal",
        objeto: "Acompanhamento do processo do réu Valdeci. Conferir número do processo e objeto exato (não informado na conversa).",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [],
  },
  {
    idx: 223,
    match: ["leticia", "lee diniz", "leandro wallace"],
    enriquecer: {
      nome: "Letícia (Lee Diniz)",
      nota: "Familiar/pagadora que cuida de vários casos: réu Leandro Wallace (média-alta) e réu Silvano (matrícula 1.400.579, baixa-média), além de sobrinhos presos em 2026. Relacionamento longo (desde 2024) com muitas parcelas — NÃO lancei os pagamentos aqui para não duplicar; conferir o financeiro na planilha e complementar manualmente.",
    },
    processos: [
      {
        id: "impcw-p-223-leandro",
        numero_cnj: "1501521-28.2026.8.26.0378",
        area: "criminal",
        objeto: "Defesa do réu Leandro Wallace — sentença condenatória proferida; interposta apelação. Caso relacionado: 1500935-88.2026.8.26.0378.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-223-silvano",
        numero_cnj: "0006810-09.2025.8.26.0521",
        area: "criminal",
        objeto: "Defesa do réu Silvano (matrícula 1.400.579) — alvará de soltura expedido; acompanhamento de execução e pedido de aproximação familiar (transferência para Capela do Alto).",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-223-leandro", data: "2026-06-18", descricao: "Realizada a audiência de instrução; o juiz não proferiu sentença no ato (nova audiência a designar)." },
      { processo: "impcw-p-223-leandro", data: "2026-07-07", descricao: "Sentença condenatória juntada aos autos." },
      { processo: "impcw-p-223-leandro", data: "2026-07-20", descricao: "Apelação interposta; aguardando subir ao Tribunal e marcação do julgamento." },
      { processo: "impcw-p-223-silvano", data: "2025-12-02", descricao: "Alvará de soltura expedido no 2º processo do Silvano." },
    ],
    pagamentos: [
      { id: "impcw-l-223-1", valor: 100, data: "2024-11-21", descricao: "Honorários — parcela (casos Leandro/Silvano — Letícia)" },
      { id: "impcw-l-223-2", valor: 400, data: "2025-12-15", descricao: "Honorários — parcela (casos Leandro/Silvano — Letícia)" },
      { id: "impcw-l-223-3", valor: 330, data: "2026-06-06", descricao: "Honorários — parcela (casos Leandro/Silvano — Letícia)" },
    ],
  },
  {
    idx: 224,
    match: ["daiane da silv", "daiane da silva", "daiane"],
    enriquecer: {
      nome: "Daiane da Silva Gomes",
      endereco: "Rua Afrânio Peixoto, nº 255",
      nota: "Pagadora/esposa: Daiane da Silva Gomes. Réu: Bruno Batista Rodrigues (marido), preso no CDP de Sorocaba. Contrato R$ 4.500 (10x450, vencimento dia 20), assinado por ZapSign em 13/01/2026. Defesa sustenta álibi (internação em clínica em set/2024). Parcelas de jan a abr/2026 já constam na planilha.",
    },
    processos: [
      {
        id: "impcw-p-224",
        numero_cnj: "1505517-12.2024.8.26.0602",
        area: "criminal",
        objeto: "Defesa do réu Bruno Batista Rodrigues — acusação grave (período de set/2024). Defesa sustenta que o réu estava internado em clínica. Impetrado HC por excesso de prazo (pedido de liberdade).",
        parte_contraria: "Ministério Público",
        comarca: "Sorocaba",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-224b",
        numero_cnj: "1500043-19.2025.8.26.0378",
        area: "criminal",
        objeto: "Novo processo identificado contra o réu Bruno (jul/2026) — estão procurando o réu e uma tal Natália. Depoimento na delegacia foi desfavorável. Avaliar defesa.",
        parte_contraria: "Ministério Público",
        situacao: "precisa_agir",
      },
    ],
    andamentos: [
      { processo: "impcw-p-224", data: "2026-01-13", descricao: "Contrato assinado; juíza designou audiência para 11/05/2026 às 14:15." },
      { processo: "impcw-p-224", data: "2026-05-05", descricao: "Audiência adiada pelo juízo; impetrado Habeas Corpus por excesso de prazo (pedido de liberdade)." },
      { processo: "impcw-p-224b", data: "2026-07-06", descricao: "Identificado novo processo (1500043-19.2025.8.26.0378) contra o réu." },
    ],
    pagamentos: [
      { id: "impcw-l-224-1", valor: 300, data: "2025-12-09", descricao: "Honorários — atendimento inicial no presídio (Bruno — CDP Sorocaba)" },
    ],
  },
  {
    idx: 225,
    match: ["daniele barbos", "danielle", "daniele"],
    enriquecer: {
      nota: "Pagadora: Danielle. Réu: Diego Barboza Fernandes (\"Tainan\"), CPF 438.580.268-83, preso em Iperó. 1º caso (R$ 3.000, 8x375) resultou na liberdade do réu — restou saldo pendente de ~R$ 1.875. Novo caso: honorários R$ 3.200 (8x400), contrato separado. ATENÇÃO: pagamentos irregulares/em atraso — cobrar. A parcela de R$ 1.500 de 23/04/2026 já consta na planilha.",
    },
    processos: [
      {
        id: "impcw-p-225",
        numero_cnj: "0000208-76.2026.8.26.0582",
        area: "criminal",
        objeto: "Defesa do réu Diego Barboza Fernandes — novo caso. Audiência realizada; processo concluso para sentença. Também há questão de restituição de veículo apreendido (evitar pagamento de pátio).",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-225", data: "2026-04-27", descricao: "Audiência de instrução realizada; processo segue concluso para sentença." },
      { processo: "impcw-p-225", data: "2026-06-30", descricao: "Obtida ordem para restituição do veículo apreendido sem necessidade de pagamento de pátio." },
    ],
  },
  {
    idx: 226,
    match: ["ana clara barb", "ana clara"],
    enriquecer: {
      nome: "Ana Clara Barbosa Pereira",
      nota: "Vários casos: (1) ação de guarda da criança em favor da avó paterna — guarda provisória revertida favoravelmente; (2) saldo de caso anterior (~R$ 1.400); (3) irmão da cliente preso (audiência de custódia em fev/2026). Pagamentos de R$ 750/mês (R$ 450 da guarda + R$ 300 do outro caso) já constam na planilha.",
    },
    processos: [
      {
        id: "impcw-p-226-guarda",
        area: "civel",
        objeto: "Ação de guarda da criança em favor da avó paterna. Guarda provisória revertida favoravelmente; audiência de conciliação (17/06/2026) dispensada. Aguardando guarda definitiva.",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-226-irmao",
        area: "criminal",
        objeto: "Defesa do irmão da cliente — preso; audiência de custódia realizada em fev/2026.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-226-irmao", data: "2026-02-04", descricao: "Irmão da cliente preso; audiência de custódia." },
      { processo: "impcw-p-226-guarda", data: "2026-06-03", descricao: "Revertida a guarda provisória favoravelmente; audiência de conciliação dispensada." },
    ],
  },
  {
    idx: 227,
    match: ["mateus adriano", "mateus"],
    enriquecer: {
      nota: "Casal Mateus e Keila. Pedido de recurso para revisar o valor da pensão alimentícia ao salário mínimo. ATENÇÃO: verificar possível cadastro duplicado \"KEILA STEPH\" na planilha (mesmo casal) e consolidar.",
    },
    processos: [
      {
        id: "impcw-p-227",
        area: "civel",
        objeto: "Recurso para revisão do valor da pensão alimentícia (reduzir ao salário mínimo) — Mateus e Keila.",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-227", data: "2026-04-23", descricao: "Peticionado o recurso para revisão do valor da pensão." },
    ],
  },
  {
    idx: 228,
    match: ["esposa do flavio", "flavio", "esposa do marido"],
    enriquecer: {
      nome: "Esposa do Flávio (P2)",
      nota: "Réu: Flávio (matrícula 718-392), preso na P2. Serviços de diligência no presídio — levar esboço de apelação (a apelação é conduzida por outro escritório, \"Barbosa e Veiga\") e passar recados à família. Não é contrato de defesa completa. ATENÇÃO: comprovante de 23/04/2026 (foto) sem valor informado na conversa — lançar manualmente no financeiro.",
    },
    processos: [
      {
        id: "impcw-p-228",
        area: "criminal",
        objeto: "Diligências e atendimento no presídio para o réu Flávio (levar documentos e recados). Não é defesa completa — apelação conduzida por outro escritório.",
        situacao: "aguardando_cliente",
      },
    ],
    andamentos: [
      { processo: "impcw-p-228", data: "2026-04-23", descricao: "Atendimento no presídio (P2) — levado o esboço da apelação e passado recado à família." },
    ],
  },
  {
    idx: 229,
    match: ["jose pedro iva", "jose pedro", "jose pedro ivanchuk"],
    enriquecer: {
      nome: "José Pedro Ivanchuk",
      nota: "Cliente como assistente de acusação contra o réu Christian. Contrato de R$ 3.000 (10x300, jul/2025 a abr/2026) — QUITADO. Parcelas de 2026 já constam na planilha. Consultou sobre eventual ação de danos morais (novo processo).",
    },
    processos: [
      {
        id: "impcw-p-229",
        area: "criminal",
        objeto: "Assistência de acusação em ação penal contra o réu Christian. Audiência de instrução realizada em 24/06/2026 (por vídeo). Aguardando sentença.",
        parte_contraria: "Christian (réu)",
        comarca: "Itapetininga",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-229", data: "2026-06-24", descricao: "Audiência de instrução realizada (por vídeo). Aguardando sentença." },
    ],
  },
  {
    idx: 230,
    match: ["maria de fatim", "maria de fatima"],
    enriquecer: {
      nota: "Avó pagadora (Dona Maria). Neto: Ryan, preso — pedido de progressão/saída. Obtida a soltura em 05/12/2025. Mensalidades de R$ 350 (as parcelas de 2026 constam na planilha).",
    },
    processos: [
      {
        id: "impcw-p-230",
        area: "execucao_penal",
        objeto: "Execução penal do neto Ryan — pedido de progressão/soltura. Concedida a soltura em 05/12/2025.",
        parte_contraria: "Ministério Público",
        situacao: "encerrado",
      },
    ],
    andamentos: [
      { processo: "impcw-p-230", data: "2025-12-03", descricao: "Juiz proferiu a decisão favorável." },
      { processo: "impcw-p-230", data: "2025-12-05", descricao: "Ryan solto." },
    ],
  },
  {
    idx: 231,
    match: ["ka namorada do igor", "igor ferreira"],
    enriquecer: {
      nome: "Ka (namorada do Igor)",
      nota: "Contato/pagadora: Ka (namorada). Réu: Igor Ferreira da Silva (RG 49.142.439-5, nascido em 13/12/1992), preso no CDP de Sorocaba (tráfico). Contrato R$ 3.600 (9x400). ENCERRADO: em 05/05/2026 os pais do Igor contrataram outro advogado; o réu foi condenado (7 anos e 9 meses). Contato encerrou o relacionamento.",
    },
    processos: [
      {
        id: "impcw-p-231",
        area: "criminal",
        objeto: "Defesa do réu Igor Ferreira da Silva — tráfico de drogas. Tese central de nulidade da abordagem policial. HC negado no TJSP; preparado HC para o STJ. Réu condenado (7a9m). Defesa depois assumida por outro advogado.",
        parte_contraria: "Ministério Público",
        situacao: "encerrado",
      },
    ],
    andamentos: [
      { processo: "impcw-p-231", data: "2026-02-19", descricao: "HC negado no TJSP; iniciado HC para o STJ." },
      { processo: "impcw-p-231", data: "2026-05-05", descricao: "Pais do réu contrataram outro advogado; caso encerrado no escritório. Réu condenado a 7 anos e 9 meses." },
    ],
    pagamentos: [
      { id: "impcw-l-231-1", valor: 300, data: "2025-12-12", descricao: "Honorários — parcela (defesa de Igor Ferreira)" },
      { id: "impcw-l-231-2", valor: 400, data: "2026-03-02", descricao: "Honorários — parcela (defesa de Igor Ferreira)" },
    ],
  },
  {
    idx: 232,
    match: ["janaina"],
    enriquecer: {
      nome: "Janaína",
      nota: "Ação de guarda da criança Enzo (retirado de abrigo). Guarda provisória concedida — Enzo entregue à família em 01/12/2025. Buscando a guarda definitiva. Contrato de 5 parcelas — QUITADO em 05/03/2026 (valores não informados na conversa). Irmã: Vanessa. Verificar possível vínculo com \"VANESSA APA\" na planilha.",
    },
    processos: [
      {
        id: "impcw-p-232",
        area: "civel",
        objeto: "Ação de guarda da criança Enzo (retirado de abrigo). Guarda provisória concedida em 01/12/2025; buscando a guarda definitiva.",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-232", data: "2025-11-18", descricao: "Entrevista no departamento técnico (relatório social)." },
      { processo: "impcw-p-232", data: "2025-12-01", descricao: "Guarda provisória concedida; Enzo entregue à família. Determinada creche via Secretaria da Educação." },
    ],
  },
  {
    idx: 233,
    match: ["renata fernand", "renata"],
    enriquecer: {
      nota: "Mãe/pagadora: Renata. Réu: Pablo, preso em Iperó. Processo complexo com vários réus (veio do juízo das garantias de Sorocaba para a 2ª Vara de Itapetininga). HC no TJSP. Pagamentos de R$ 450/mês já constam na planilha.",
    },
    processos: [
      {
        id: "impcw-p-233",
        area: "criminal",
        objeto: "Defesa do réu Pablo — ação penal com vários réus (2ª Vara de Itapetininga). Impetrado HC no TJSP. Audiência de instrução realizada em 06/04/2026. Aguardando sentença.",
        parte_contraria: "Ministério Público",
        comarca: "Itapetininga",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-233", data: "2025-10-13", descricao: "Processo principal distribuído à 2ª Vara de Itapetininga (vindo do juízo das garantias de Sorocaba). HC com o relator no TJSP." },
      { processo: "impcw-p-233", data: "2026-01-29", descricao: "Data da audiência de instrução designada." },
      { processo: "impcw-p-233", data: "2026-04-06", descricao: "Audiência de instrução realizada. Aguardando sentença." },
    ],
  },
  {
    idx: 234,
    match: ["wagner de o", "wagner"],
    enriquecer: {
      nota: "Complemento do cadastro Wagner de O. Contrato QUITADO (parcela final de R$ 400 em 20/02/2026, já na planilha). Processo do celular apreendido finalizado — aparelho retirado na delegacia de Pilar do Sul em 28/07/2026.",
    },
    processos: [
      {
        id: "impcw-p-234",
        numero_cnj: "1500807-20.2025.8.26.0567",
        area: "criminal",
        objeto: "Caso do réu Wagner — resolvido favoravelmente (nome retirado dos sistemas). Restava a restituição do celular apreendido, retirado na delegacia de Pilar do Sul em 28/07/2026.",
        parte_contraria: "Ministério Público",
        situacao: "encerrado_quitado",
      },
    ],
    andamentos: [
      { processo: "impcw-p-234", data: "2026-07-28", descricao: "Celular apreendido retirado pelo cliente na delegacia de Pilar do Sul. Caso totalmente finalizado." },
    ],
  },
  {
    idx: 235,
    match: ["bruno jose alves", "bruno correa", "bruno corrêa"],
    enriquecer: {
      nome: "Bruno José Alves Corrêa Cardoso",
      cpf_cnpj: "383.737.338-09",
      rg: "40.425.127-4",
      endereco: "Rua Olímpio Augusto Ribeiro, nº 10, Vila Arruda",
      nota: "Réu do próprio caso. Investigação por furto e estelionato (mesmo caso). Contrato R$ 3.150 (7x450, ou R$ 300/semana). Procuração colhida em 26/02/2026. Responde em liberdade. Há um Edson Bruno (matrícula 32732945) relacionado ao caso.",
    },
    processos: [
      {
        id: "impcw-p-235",
        area: "criminal",
        objeto: "Defesa do réu Bruno José Alves Corrêa Cardoso — investigação por furto e estelionato. Acompanhamento na fase de delegacia (interrogatório).",
        parte_contraria: "Ministério Público",
        comarca: "Sorocaba",
        situacao: "precisa_agir",
      },
    ],
    andamentos: [
      { processo: "impcw-p-235", data: "2026-02-26", descricao: "Procuração colhida; acompanhamento na delegacia." },
    ],
    pagamentos: [
      { id: "impcw-l-235-1", valor: 300, data: "2026-02-28", descricao: "Honorários — 1ª parcela (defesa de Bruno — furto/estelionato) — conferir valor" },
    ],
  },
  {
    idx: 236,
    match: ["paula cristina", "paiva"],
    enriquecer: {
      nota: "Contato/pagadora (família Paiva). Réus: Dheivid (marido/irmão) e Paulo Osmar. Contrato R$ 3.600 (8x450). Dheivid absolvido/solto em processos (dez/2025); Paulo Osmar denunciado por tráfico — audiência a marcar. Pagamentos de R$ 500/mês já constam na planilha.",
    },
    processos: [
      {
        id: "impcw-p-236-dheivid",
        area: "criminal",
        objeto: "Defesa do réu Dheivid — dois processos: um com absolvição e outro (junto com o Paulo) em que obteve a soltura após a sentença (dez/2025). Promotoria recorreu em um deles.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
      {
        id: "impcw-p-236-paulo",
        area: "criminal",
        objeto: "Defesa do réu Paulo Osmar — denúncia por tráfico aceita; audiência de instrução a ser marcada.",
        parte_contraria: "Ministério Público",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-236-dheivid", data: "2025-12-15", descricao: "Réus (marido e irmão) absolvidos/soltos; sentença proferida. Promotoria recorreu em um dos processos." },
      { processo: "impcw-p-236-paulo", data: "2026-03-28", descricao: "Denúncia por tráfico aceita contra Paulo Osmar; aguardando marcação da audiência." },
    ],
  },
  {
    idx: 237,
    match: ["madlene a ribe", "madlene"],
    enriquecer: {
      nota: "Cliente: Madlene. Réu: Davi (serviço comunitário cumprido integralmente em 02/03/2026; pleiteado indulto). Contrato novo de R$ 5.000 (20x250, formalizado por ZapSign em 23/02/2026, pensando em quitar com o INSS). Também trata de doação de imóvel (irmão renuncia parte em favor dela). A parcela de 05/02/2026 já consta na planilha.",
    },
    processos: [
      {
        id: "impcw-p-237",
        area: "criminal",
        objeto: "Defesa do réu Davi — pena de prestação de serviços à comunidade cumprida integralmente (02/03/2026). Pleiteada a concessão de indulto para encerrar.",
        parte_contraria: "Ministério Público",
        comarca: "Tatuí",
        situacao: "aguardando_tramite",
      },
    ],
    andamentos: [
      { processo: "impcw-p-237", data: "2026-03-02", descricao: "Réu Davi concluiu integralmente a prestação de serviços à comunidade." },
      { processo: "impcw-p-237", data: "2026-04-06", descricao: "Pleiteada a concessão de indulto para encerrar o cumprimento." },
    ],
    pagamentos: [
      { id: "impcw-l-237-1", valor: 250, data: "2026-02-23", descricao: "Honorários — parcela (contrato 20x250 — Madlene/Davi)" },
    ],
  },
];
