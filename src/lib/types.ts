// Entidades do sistema. Os nomes de campos espelham as colunas do schema SQL
// em supabase/migrations, para que a mesma camada de dados sirva aos dois backends.

export type Papel = "admin" | "advogado" | "estagiario" | "secretaria";

export interface Membro {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  oab?: string;
  telefone?: string;
  ativo: boolean;
  created_at?: string;
}

export interface Cliente {
  id: string;
  tipo: "pf" | "pj";
  nome: string;
  cpf_cnpj?: string;
  rg?: string;
  nacionalidade?: string; // como deve sair no documento: "brasileiro", "brasileira"…
  estado_civil?: string; // idem: "solteiro", "casada"…
  profissao?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  notas?: string;
  created_at?: string;
}

export type AreaProcesso =
  | "criminal"
  | "execucao_penal"
  | "civel"
  | "familia"
  | "trabalhista"
  | "tributario"
  | "outra";

export type StatusProcesso = "ativo" | "suspenso" | "arquivado" | "encerrado";

// Fase do caso no fluxo real do escritório — marcada em 1 toque e refletida
// no portal do cliente ("em que fase está meu caso").
export type SituacaoCaso =
  | "precisa_agir"
  | "aguardando_tramite"
  | "aguardando_cliente"
  | "encerrado"
  | "encerrado_quitado";

export interface Processo {
  id: string;
  numero_cnj?: string;
  cliente_id: string;
  area: AreaProcesso;
  tribunal?: string;
  vara?: string;
  comarca?: string;
  fase?: string;
  situacao?: SituacaoCaso;
  status: StatusProcesso;
  parte_contraria?: string;
  objeto?: string;
  valor_causa?: number;
  responsavel_id?: string;
  monitorado: boolean;
  created_at?: string;
}

export interface Andamento {
  id: string;
  processo_id: string;
  data: string; // ISO date
  descricao: string;
  origem: "manual" | "tribunal";
  created_at?: string;
}

export interface Prazo {
  id: string;
  processo_id?: string;
  titulo: string;
  tipo?: string; // apelação, RESE, alegações finais, contestação…
  data_limite: string; // ISO date — prazo fatal
  data_interna?: string; // ISO date — meta interna do escritório
  status: "pendente" | "concluido";
  responsavel_id?: string;
  notas?: string;
  concluido_em?: string;
  created_at?: string;
}

export type TipoEvento = "audiencia" | "reuniao" | "sustentacao" | "atendimento" | "video" | "outro";

export interface EventoAgenda {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  processo_id?: string;
  cliente_id?: string;
  inicio: string; // ISO datetime
  fim?: string;
  local?: string;
  link_virtual?: string;
  notas?: string;
  created_at?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  processo_id?: string;
  responsavel_id?: string;
  data_limite?: string;
  prioridade: "alta" | "media" | "baixa";
  status: "pendente" | "fazendo" | "concluida";
  created_at?: string;
}

export interface Documento {
  id: string;
  nome: string;
  processo_id?: string;
  cliente_id?: string;
  tipo?: string; // mime ou rótulo (petição, sentença, contrato…)
  tamanho?: number;
  storage_path?: string; // caminho no Supabase Storage quando configurado
  visivel_cliente: boolean;
  enviado_por?: string;
  created_at?: string;
}

export type TipoHonorarios = "fixo" | "exito" | "hora" | "misto" | "pro_bono";

export interface ContratoHonorarios {
  id: string;
  cliente_id: string;
  processo_id?: string;
  tipo: TipoHonorarios;
  valor_fixo?: number;
  percentual_exito?: number;
  valor_hora?: number;
  descricao?: string;
  status: "ativo" | "encerrado";
  created_at?: string;
}

export interface Lancamento {
  id: string;
  tipo: "receita" | "despesa";
  categoria: string; // honorários, custas, aluguel, salários…
  cliente_id?: string;
  processo_id?: string;
  descricao: string;
  valor: number;
  vencimento: string; // ISO date
  pago_em?: string;
  forma_pagamento?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Blog jurídico ("Radar Penal") — parte pública do sistema em /blog.
// ---------------------------------------------------------------------------

// Origem de uma pauta captada pelo monitoramento.
export type FontePauta = "stf" | "stj" | "camara" | "senado";

// Situação de uma pauta na caixa de entrada da redação.
export type StatusPauta = "nova" | "arquivada" | "usada";

// Uma "pauta" é uma sugestão de assunto captada automaticamente das fontes
// oficiais (julgados dos tribunais superiores, projetos de lei penais). O
// advogado revisa a caixa de pautas e decide o que vira post — nada é
// publicado sozinho.
export interface Pauta {
  id: string;
  fonte: FontePauta;
  externo_id: string; // id/URL na origem — usado para não duplicar
  titulo: string;
  resumo?: string;
  url: string; // link para a fonte oficial
  data_fonte?: string; // ISO date — quando saiu na origem
  tema?: string; // termo penal que casou (tráfico, dosimetria, HC…)
  status: StatusPauta;
  created_at?: string;
}

export type StatusPost = "rascunho" | "publicado";

// Um post do blog. Escrito e revisado por uma pessoa; só aparece em /blog
// quando status = "publicado".
export interface Post {
  id: string;
  titulo: string;
  slug: string; // parte do endereço: /blog/{slug}
  resumo?: string; // chamada que aparece na listagem e nos buscadores
  conteudo: string; // corpo do texto (Markdown simples)
  autor?: string;
  fonte_url?: string; // link para a decisão/PL de origem, quando houver
  status: StatusPost;
  publicado_em?: string; // ISO datetime
  pauta_id?: string; // pauta que originou o post, quando aplicável
  created_at?: string;
}

export type TableName =
  | "membros"
  | "clientes"
  | "processos"
  | "andamentos"
  | "prazos"
  | "eventos_agenda"
  | "tarefas"
  | "documentos"
  | "contratos_honorarios"
  | "lancamentos"
  | "pautas"
  | "posts";

export const TABLES: TableName[] = [
  "membros",
  "clientes",
  "processos",
  "andamentos",
  "prazos",
  "eventos_agenda",
  "tarefas",
  "documentos",
  "contratos_honorarios",
  "lancamentos",
  "pautas",
  "posts",
];
