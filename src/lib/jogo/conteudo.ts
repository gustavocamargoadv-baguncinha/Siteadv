import type { Area } from "./tipos";

// ------------------------------------------------------------------
// Conteúdo do jogo: casos, teses, armadilhas, submundo e progressão.
// As teses buscam um "clima" realista (estilo 2ª fase da OAB) sem exigir
// que só advogado jogue — a lógica é escolher as teses coerentes com o caso.
// ------------------------------------------------------------------

export const ROTULO_AREA: Record<Area, string> = {
  trabalhista: "Trabalhista",
  civel: "Cível",
  consumidor: "Consumidor",
  familia: "Família",
  criminal: "Criminal",
  empresarial: "Empresarial",
};

export const EMOJI_AREA: Record<Area, string> = {
  trabalhista: "👷",
  civel: "⚖️",
  consumidor: "🛒",
  familia: "👨‍👩‍👧",
  criminal: "🚔",
  empresarial: "🏢",
};

export interface Arquetipo {
  area: Area;
  titulo: string;
  resumo: string;
  complexidade: number;
  valorBase: number;
  sinal: string;
  teses: { texto: string; correta: boolean }[];
}

// --- Casos "de verdade" (têm caminho de vitória se as teses certas forem escolhidas) ---
export const ARQUETIPOS: Arquetipo[] = [
  {
    area: "trabalhista",
    titulo: "Horas extras não pagas",
    resumo:
      "Trabalhou 2 anos fazendo hora extra sem registro nem pagamento. Tem controles de ponto e colegas que testemunham.",
    complexidade: 2,
    valorBase: 4500,
    sinal: "Cliente tem provas (ponto + testemunhas) e quer pagar direito.",
    teses: [
      { texto: "Horas extras com adicional de 50% e reflexos em férias, 13º e FGTS", correta: true },
      { texto: "Intervalo intrajornada suprimido (art. 71 CLT) como hora extra", correta: true },
      { texto: "Juntar controles de ponto e prova testemunhal da jornada", correta: true },
      { texto: "Pedir justa causa do empregador sem qualquer prova de falta grave", correta: false },
      { texto: "Dano moral por mero descumprimento contratual", correta: false },
    ],
  },
  {
    area: "trabalhista",
    titulo: "Reversão de justa causa",
    resumo:
      "Empregado dispensado por justa causa alegando 'desídia', mas nunca foi advertido antes e a punição veio meses depois do fato.",
    complexidade: 3,
    valorBase: 6000,
    sinal: "Faltam imediatidade e gradação da pena — bom terreno para reversão.",
    teses: [
      { texto: "Ausência de imediatidade entre a falta e a punição", correta: true },
      { texto: "Falta de gradação/proporcionalidade da pena disciplinar", correta: true },
      { texto: "Reversão para dispensa imotivada com verbas rescisórias + FGTS+40%", correta: true },
      { texto: "Confessar o ato faltoso e apenas pedir redução da multa", correta: false },
      { texto: "Alegar acidente de trabalho sem nexo nem CAT", correta: false },
    ],
  },
  {
    area: "consumidor",
    titulo: "Negativação indevida",
    resumo:
      "Cliente foi negativado por dívida que já havia pago. Tem o comprovante. Não possui outras negativações.",
    complexidade: 2,
    valorBase: 3800,
    sinal: "Prova de pagamento em mãos e nome limpo fora essa inscrição.",
    teses: [
      { texto: "Inversão do ônus da prova (art. 6º, VIII, CDC)", correta: true },
      { texto: "Dano moral in re ipsa pela inscrição indevida", correta: true },
      { texto: "Repetição do indébito em dobro (art. 42, § único, CDC)", correta: true },
      { texto: "Insistir em dano moral ignorando a Súmula 385 do STJ", correta: false },
      { texto: "Pedir prisão civil do gerente do banco", correta: false },
    ],
  },
  {
    area: "consumidor",
    titulo: "Voo cancelado sem assistência",
    resumo:
      "Companhia cancelou o voo, deixou o cliente 14h no aeroporto sem hotel nem alimentação. Ele perdeu um compromisso e tem os comprovantes de gastos.",
    complexidade: 2,
    valorBase: 4200,
    sinal: "Falha clara na prestação do serviço, com comprovantes de despesas.",
    teses: [
      { texto: "Responsabilidade objetiva do fornecedor (art. 14 CDC)", correta: true },
      { texto: "Dano moral pela falha e pelo descaso na assistência", correta: true },
      { texto: "Danos materiais com base nos comprovantes de gastos", correta: true },
      { texto: "Invocar a Convenção de Montreal para limitar a própria indenização", correta: false },
      { texto: "Pedir a cassação da concessão da companhia aérea", correta: false },
    ],
  },
  {
    area: "civel",
    titulo: "Acidente de trânsito com sequelas",
    resumo:
      "Cliente foi abalroado por motorista que furou o sinal. Tem boletim de ocorrência, laudo e ficou com sequela no joelho.",
    complexidade: 3,
    valorBase: 8000,
    sinal: "Nexo causal e culpa bem documentados (BO + testemunha + laudo).",
    teses: [
      { texto: "Responsabilidade civil por culpa (art. 186 CC) e nexo causal", correta: true },
      { texto: "Danos materiais e lucros cessantes comprovados", correta: true },
      { texto: "Dano moral e estético pela sequela permanente", correta: true },
      { texto: "Responsabilidade objetiva do particular sem previsão legal", correta: false },
      { texto: "Pedir a apreensão definitiva do veículo do réu", correta: false },
    ],
  },
  {
    area: "familia",
    titulo: "Guarda e alimentos",
    resumo:
      "Mãe busca regularizar a guarda e fixar pensão. Pai é presente, mas as partes não se entendem sobre a convivência.",
    complexidade: 3,
    valorBase: 5500,
    sinal: "Pai presente e com renda — cenário clássico de guarda compartilhada.",
    teses: [
      { texto: "Guarda compartilhada como regra (art. 1.584, §2º CC)", correta: true },
      { texto: "Melhor interesse da criança como vetor da convivência", correta: true },
      { texto: "Alimentos pelo binômio necessidade × possibilidade", correta: true },
      { texto: "Acusar alienação parental sem laudo nem qualquer prova", correta: false },
      { texto: "Pedir a perda do poder familiar do pai por divergência", correta: false },
    ],
  },
  {
    area: "criminal",
    titulo: "Furto de pequeno valor",
    resumo:
      "Réu primário preso por furtar um item de baixo valor em mercado. Bom comportamento, confessou, mercadoria recuperada.",
    complexidade: 3,
    valorBase: 5000,
    sinal: "Réu primário, res de pequeno valor e bem restituído.",
    teses: [
      { texto: "Princípio da insignificância (bagatela) diante do ínfimo valor", correta: true },
      { texto: "Furto privilegiado (art. 155, §2º CP) por primariedade e pequeno valor", correta: true },
      { texto: "Atenuante da confissão espontânea (art. 65, III, 'd', CP)", correta: true },
      { texto: "Legítima defesa como excludente em crime patrimonial", correta: false },
      { texto: "Negar autoria apesar da confissão e das câmeras", correta: false },
    ],
  },
  {
    area: "empresarial",
    titulo: "Cobrança de dívida documentada",
    resumo:
      "Pequena empresa não recebeu por serviços prestados. Tem contrato assinado, notas e trocas de e-mail confirmando a dívida.",
    complexidade: 2,
    valorBase: 6500,
    sinal: "Prova escrita robusta da dívida — bom para monitória/execução.",
    teses: [
      { texto: "Ação monitória com prova escrita sem eficácia executiva", correta: true },
      { texto: "Correção monetária e juros de mora desde o vencimento", correta: true },
      { texto: "Protesto e negativação do devedor como reforço", correta: true },
      { texto: "Pedir a falência da empresa por uma única fatura em atraso", correta: false },
      { texto: "Prisão do sócio por dívida civil", correta: false },
    ],
  },
  {
    area: "consumidor",
    titulo: "Produto com vício não resolvido",
    resumo:
      "Celular novo apresentou defeito, foi 3 vezes à assistência em 30 dias e não foi resolvido. Cliente tem ordens de serviço.",
    complexidade: 1,
    valorBase: 3000,
    sinal: "Prazo de 30 dias esgotado sem solução, com ordens de serviço.",
    teses: [
      { texto: "Vício do produto e opções do art. 18 do CDC (troca/abatimento/restituição)", correta: true },
      { texto: "Responsabilidade solidária de fabricante e loja", correta: true },
      { texto: "Dano moral pelo desgaste e privação prolongada do bem", correta: true },
      { texto: "Rescindir todo o contrato de telefonia da operadora por tabela", correta: false },
    ],
  },
  {
    area: "trabalhista",
    titulo: "Reconhecimento de vínculo (PJ x CLT)",
    resumo:
      "Prestador 'PJ' que batia ponto, tinha chefe e metas por 3 anos. Quer reconhecer o vínculo e as verbas.",
    complexidade: 4,
    valorBase: 9000,
    sinal: "Presentes pessoalidade, subordinação, habitualidade e onerosidade.",
    teses: [
      { texto: "Reconhecimento de vínculo pela primazia da realidade (art. 9º CLT)", correta: true },
      { texto: "Configuração de pessoalidade, subordinação, habitualidade e onerosidade", correta: true },
      { texto: "Verbas rescisórias, FGTS e anotação em CTPS", correta: true },
      { texto: "Sustentar que a 'pejotização' foi lícita porque havia contrato", correta: false },
      { texto: "Pedir dano moral por assédio sem nenhum episódio narrado", correta: false },
    ],
  },
];

// --- Casos "buxa" (armadilhas): calote, causa perdida, antiético ---
export const ARQUETIPOS_BUXA: Arquetipo[] = [
  {
    area: "civel",
    titulo: "Indenização por 'traição'",
    resumo:
      "Cliente exaltado quer processar o ex-cônjuge por infidelidade pedindo R$ 500 mil de dano moral. Sem qualquer ilícito além do fim do relacionamento.",
    complexidade: 2,
    valorBase: 1500,
    sinal: "Não há ilícito indenizável — pretensão emocional, sem causa de pedir.",
    teses: [
      { texto: "Dano moral por quebra do dever de fidelidade conjugal", correta: false },
      { texto: "Pedir R$ 500 mil sem prova de qualquer dano concreto", correta: false },
      { texto: "Danos materiais inexistentes", correta: false },
    ],
  },
  {
    area: "civel",
    titulo: "Causa já prescrita",
    resumo:
      "Cliente quer cobrar dívida de fato ocorrido há 8 anos. A pretensão prescreveu há tempos, mas ele insiste e promete 'pagar bem'.",
    complexidade: 2,
    valorBase: 1200,
    sinal: "Pretensão fulminada pela prescrição — derrota quase certa.",
    teses: [
      { texto: "Ignorar a prescrição e ajuizar assim mesmo", correta: false },
      { texto: "Alegar causa interruptiva inexistente da prescrição", correta: false },
      { texto: "Sustentar imprescritibilidade sem base legal", correta: false },
    ],
  },
  {
    area: "empresarial",
    titulo: "Cliente quer fraudar credores",
    resumo:
      "Empresário pede para 'blindar' o patrimônio transferindo bens para laranjas antes de uma execução iminente. Paga adiantado, em dinheiro.",
    complexidade: 3,
    valorBase: 20000,
    sinal: "Proposta antiética e ilegal (fraude à execução) — risco à OAB e à ficha.",
    teses: [
      { texto: "Simular vendas de bens para terceiros de confiança", correta: false },
      { texto: "Ocultar patrimônio às vésperas da execução", correta: false },
      { texto: "Usar laranjas para esvaziar o patrimônio", correta: false },
    ],
  },
  {
    area: "trabalhista",
    titulo: "Quer processar, mas não paga nem contrato",
    resumo:
      "Reclamação frágil, sem provas, e o cliente recusa entrada, recusa contrato e diz que 'paga quando ganhar'. Já trocou de advogado 3 vezes.",
    complexidade: 3,
    valorBase: 800,
    sinal: "Recusa entrada e contrato, histórico de calote — prejuízo provável.",
    teses: [
      { texto: "Aceitar só no êxito, sem contrato escrito", correta: false },
      { texto: "Ajuizar sem provas confiando na palavra do cliente", correta: false },
      { texto: "Inflar pedidos para 'assustar' a empresa", correta: false },
    ],
  },
  {
    area: "consumidor",
    titulo: "Litigância de má-fé disfarçada",
    resumo:
      "Cliente 'profissional' que já move dezenas de ações idênticas por danos morais fabricados, buscando acordos rápidos. Quer que você entre com mais uma.",
    complexidade: 2,
    valorBase: 900,
    sinal: "Padrão de litigância predatória — risco de má-fé e sanção.",
    teses: [
      { texto: "Fabricar dano moral genérico para forçar acordo", correta: false },
      { texto: "Omitir que o cliente já tem ações idênticas", correta: false },
      { texto: "Multiplicar ações sobre o mesmo fato", correta: false },
    ],
  },
];

// --- Submundo: propostas ilícitas de alto ganho ---
export const CRIMES: Omit<import("./tipos").OportunidadeCrime, "id">[] = [
  {
    titulo: "Honorário em dinheiro vivo de origem duvidosa",
    descricao:
      "Um 'cliente' oferece pagar tudo em espécie, muito acima do mercado, sem recibo. Cheira a lavagem de dinheiro.",
    ganho: 18000,
    chanceBase: 0.62,
    penaDias: 5,
    multa: 12000,
    perdaReputacao: 25,
  },
  {
    titulo: "Propina a servidor por informação privilegiada",
    descricao:
      "Um contato promete 'agilizar' uma decisão em troca de um valor por fora ao servidor. Corrupção ativa.",
    ganho: 30000,
    chanceBase: 0.5,
    penaDias: 8,
    multa: 25000,
    perdaReputacao: 40,
  },
  {
    titulo: "Caixa 2 do escritório",
    descricao:
      "Deixar de declarar parte dos honorários para pagar menos imposto. Sonegação fiscal — cai bem no bolso até a fiscalização bater.",
    ganho: 9000,
    chanceBase: 0.7,
    penaDias: 4,
    multa: 15000,
    perdaReputacao: 20,
  },
  {
    titulo: "Assessoria fixa para organização criminosa",
    descricao:
      "Um grupo oferece uma 'mensalidade' gorda para você ser o advogado de plantão deles. Ganho recorrente, ficha manchada.",
    ganho: 40000,
    chanceBase: 0.45,
    penaDias: 12,
    multa: 30000,
    perdaReputacao: 50,
  },
];

// --- Progressão: escritórios ---
export interface Escritorio {
  nome: string;
  descricao: string;
  aluguel: number; // por dia (ao encerrar o dia)
  slots: number; // casos ativos simultâneos
  qualidade: number; // multiplicador do valor dos casos que aparecem
  energiaBonus: number;
  maxEstagiarios: number;
  custoUpgrade: number; // custo para chegar neste nível
}

export const ESCRITORIOS: Escritorio[] = [
  {
    nome: "Mesa em coworking",
    descricao: "Uma mesa alugada e muita fé. Todo começo é assim.",
    aluguel: 60,
    slots: 2,
    qualidade: 1,
    energiaBonus: 0,
    maxEstagiarios: 0,
    custoUpgrade: 0,
  },
  {
    nome: "Sala própria no centro",
    descricao: "Placa na porta, secretária compartilhada e clientela um pouco melhor.",
    aluguel: 220,
    slots: 3,
    qualidade: 1.25,
    energiaBonus: 1,
    maxEstagiarios: 1,
    custoUpgrade: 8000,
  },
  {
    nome: "Andar comercial",
    descricao: "Recepção, salas de reunião e casos de maior porte batendo à porta.",
    aluguel: 700,
    slots: 5,
    qualidade: 1.6,
    energiaBonus: 2,
    maxEstagiarios: 3,
    custoUpgrade: 35000,
  },
  {
    nome: "Escritório boutique",
    descricao: "Marca respeitada, clientes selecionados e honorários generosos.",
    aluguel: 1800,
    slots: 7,
    qualidade: 2.1,
    energiaBonus: 3,
    maxEstagiarios: 5,
    custoUpgrade: 120000,
  },
  {
    nome: "Banca de referência nacional",
    descricao: "Nome no topo da lista. Grandes causas, grandes honorários, grande responsabilidade.",
    aluguel: 5000,
    slots: 10,
    qualidade: 3,
    energiaBonus: 5,
    maxEstagiarios: 8,
    custoUpgrade: 400000,
  },
];

// --- Progressão: cidades ---
export interface Cidade {
  id: string;
  nome: string;
  descricao: string;
  qualidade: number; // multiplicador extra do valor dos casos
  custoMudanca: number;
}

export const CIDADES: Cidade[] = [
  {
    id: "interior",
    nome: "Cidade do interior",
    descricao: "Custo de vida baixo, causas menores, concorrência tranquila.",
    qualidade: 0.85,
    custoMudanca: 0,
  },
  {
    id: "media",
    nome: "Cidade média",
    descricao: "Mais indústria e comércio — causas trabalhistas e cíveis de bom porte.",
    qualidade: 1.1,
    custoMudanca: 6000,
  },
  {
    id: "capital",
    nome: "Capital",
    descricao: "Volume alto de casos e honorários maiores. Concorrência feroz.",
    qualidade: 1.4,
    custoMudanca: 25000,
  },
  {
    id: "sp",
    nome: "São Paulo",
    descricao: "O maior mercado jurídico do país. Causas milionárias circulando.",
    qualidade: 1.8,
    custoMudanca: 90000,
  },
];

// --- Treinamentos (evolução do personagem) ---
export interface Treino {
  id: string;
  nome: string;
  descricao: string;
  atributo: "carisma" | "tecnica";
  ganho: number;
  custo: number;
  energia: number;
}

export const TREINOS: Treino[] = [
  {
    id: "oratoria",
    nome: "Curso de oratória e negociação",
    descricao: "Fecha mais contratos e convence o cliente a aceitar honorários maiores.",
    atributo: "carisma",
    ganho: 6,
    custo: 1200,
    energia: 1,
  },
  {
    id: "pos",
    nome: "Pós-graduação / especialização",
    descricao: "Mais técnica: aumenta a chance de ganhar casos e de ler bem uma causa.",
    atributo: "tecnica",
    ganho: 6,
    custo: 2500,
    energia: 1,
  },
  {
    id: "networking",
    nome: "Evento de networking",
    descricao: "Um empurrão no carisma e nas relações. Barato e rápido.",
    atributo: "carisma",
    ganho: 3,
    custo: 500,
    energia: 1,
  },
  {
    id: "jurisprudencia",
    nome: "Imersão em jurisprudência",
    descricao: "Fim de semana estudando os tribunais. Técnica afiada.",
    atributo: "tecnica",
    ganho: 3,
    custo: 800,
    energia: 1,
  },
];

// --- Nomes para gerar clientes ---
export const NOMES = [
  "Cristiane Alves", "Rogério Pinto", "Marcos Vinícius", "Fernanda Lima", "João Batista",
  "Aparecida Souza", "Ricardo Menezes", "Patrícia Gomes", "Sebastião Rocha", "Juliana Prado",
  "Wellington Dias", "Cláudia Ferreira", "Anderson Melo", "Beatriz Nunes", "Otávio Camargo",
  "Vera Lúcia", "Diego Ramos", "Sandra Regina", "Thiago Barros", "Mônica Teixeira",
  "Gilberto Antunes", "Renata Cardoso", "Paulo Sérgio", "Débora Farias", "Edson Moreira",
];
