// Tipos do jogo "Vida de Advogado" — um jogo de gestão/probabilidade inspirado
// em The Crims, porém ambientado na carreira de um advogado montando seu escritório.
// Tudo aqui é ISOLADO do sistema real (não usa Supabase nem dados do escritório).

export type Area =
  | "trabalhista"
  | "civel"
  | "consumidor"
  | "familia"
  | "criminal"
  | "empresarial";

export type FaixaPreco = "conservador" | "justo" | "ousado" | "abusivo";

/** Uma tese jurídica que pode ser escolhida ao trabalhar um caso. */
export interface Tese {
  id: string;
  texto: string;
  correta: boolean;
}

/** Caso oferecido ao escritório (ainda não aceito). */
export interface CasoOferta {
  id: string;
  cliente: string;
  area: Area;
  titulo: string;
  resumo: string;
  /** 1 (simples) a 5 (complexo). */
  complexidade: number;
  /** Honorário "justo" estimado para a causa. */
  valorBase: number;
  /** Caso "buxa": armadilha (calote, causa perdida, antiético...). */
  buxa: boolean;
  /** Pista textual do problema — sempre presente, mas mais explícita com técnica. */
  sinal: string;
  /** Se o cliente topa pagar entrada (sinal de bom pagador). */
  aceitaEntrada: boolean;
  teses: Tese[];
  /** Já foi analisado pelo jogador nesta rodada? */
  analisado?: boolean;
}

/** Caso já aceito e em andamento. */
export interface CasoAtivo extends CasoOferta {
  honorario: number;
  entrada: number;
  faixa: FaixaPreco;
  tesesEscolhidas: string[];
  /** Dia do jogo em que o caso expira se não for protocolado. */
  diaLimite: number;
}

/** Proposta do "submundo" — alto ganho, risco de cadeia. */
export interface OportunidadeCrime {
  id: string;
  titulo: string;
  descricao: string;
  ganho: number;
  /** Chance-base de dar certo sem ser pego (0–1). */
  chanceBase: number;
  /** Dias preso se for pego. */
  penaDias: number;
  multa: number;
  perdaReputacao: number;
}

export type TipoFeed = "bom" | "ruim" | "neutro" | "crime";

export interface ItemFeed {
  id: string;
  dia: number;
  texto: string;
  tipo: TipoFeed;
}

export interface Estado {
  versao: number;
  dia: number;
  dinheiro: number;
  reputacao: number; // 0–100
  carisma: number; // 0–100
  tecnica: number; // 0–100
  energia: number;
  energiaMax: number;
  nivel: number;
  xp: number;
  escritorioNivel: number; // índice em ESCRITORIOS
  cidadeId: string;
  estagiarios: number;
  ofertas: CasoOferta[];
  ativos: CasoAtivo[];
  crime: OportunidadeCrime | null;
  /** Dias restantes de prisão (0 = livre). */
  preso: number;
  feed: ItemFeed[];
  vitorias: number;
  derrotas: number;
  /** Marca falência / fim de jogo. */
  encerrado: boolean;
}
