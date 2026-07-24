import type {
  CasoAtivo,
  CasoOferta,
  Estado,
  FaixaPreco,
  ItemFeed,
  OportunidadeCrime,
  TipoFeed,
} from "./tipos";
import {
  ARQUETIPOS,
  ARQUETIPOS_BUXA,
  CIDADES,
  CRIMES,
  ESCRITORIOS,
  NOMES,
  TREINOS,
  type Arquetipo,
} from "./conteudo";

export const CHAVE_SALVE = "jogo-advogado-v1";
const VERSAO = 2;

// ------------------------------ RNG / utilidades ------------------------------

let semente = Math.floor(Math.random() * 1e9);
function rand(): number {
  // xorshift simples — determinístico o suficiente e sem dependências.
  semente ^= semente << 13;
  semente ^= semente >>> 17;
  semente ^= semente << 5;
  return ((semente >>> 0) % 1_000_000) / 1_000_000;
}
export function chance(p: number): boolean {
  return rand() < p;
}
export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}
function escolher<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function embaralhar<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function id(): string {
  return Math.random().toString(36).slice(2, 10);
}
function jitter(base: number, pct = 0.25): number {
  const f = 1 + (rand() * 2 - 1) * pct;
  return Math.round((base * f) / 10) * 10;
}

// ------------------------------ Estado inicial ------------------------------

export function estadoInicial(): Estado {
  const base: Estado = {
    versao: VERSAO,
    dia: 1,
    dinheiro: 2000,
    reputacao: 8,
    carisma: 15,
    tecnica: 18,
    energia: 4,
    energiaMax: 4,
    nivel: 1,
    xp: 0,
    escritorioNivel: 0,
    cidadeId: "interior",
    estagiarios: 0,
    ofertas: [],
    ativos: [],
    crime: null,
    ultimosTitulos: [],
    ultimoCrime: "",
    preso: 0,
    feed: [],
    vitorias: 0,
    derrotas: 0,
    encerrado: false,
  };
  base.ofertas = gerarOfertas(base, 3);
  base.crime = chance(0.4) ? gerarCrime(base) : null;
  return registrar(base, "Você abriu seu escritório. Boa sorte, doutor(a)! ⚖️", "neutro");
}

// ------------------------------ Persistência ------------------------------

export function carregar(): Estado | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = localStorage.getItem(CHAVE_SALVE);
    if (!bruto) return null;
    const e = JSON.parse(bruto) as Estado;
    if (e.versao !== VERSAO) return null;
    return e;
  } catch {
    return null;
  }
}
export function salvar(e: Estado): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_SALVE, JSON.stringify(e));
  } catch {
    /* ignora quota */
  }
}
export function apagarSalve(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAVE_SALVE);
}

// ------------------------------ Feed ------------------------------

function registrar(e: Estado, texto: string, tipo: TipoFeed): Estado {
  const item: ItemFeed = { id: id(), dia: e.dia, texto, tipo };
  return { ...e, feed: [item, ...e.feed].slice(0, 60) };
}

// ------------------------------ Geração de casos ------------------------------

function indiceCidade(e: Estado): number {
  const i = CIDADES.findIndex((c) => c.id === e.cidadeId);
  return i < 0 ? 0 : i;
}

/** Faixa de "tier" de casos liberada pela evolução (escritório + cidade). */
function faixaTier(e: Estado): { min: number; max: number } {
  const nm = e.escritorioNivel + indiceCidade(e); // 0 a 7
  const max = nm >= 4 ? 3 : nm >= 2 ? 2 : 1;
  const min = max === 3 ? 2 : 1; // vai aposentando as causas mais miúdas
  return { min, max };
}

function multiplicadorQualidade(e: Estado): number {
  const esc = ESCRITORIOS[e.escritorioNivel].qualidade;
  const cid = CIDADES.find((c) => c.id === e.cidadeId)?.qualidade ?? 1;
  return esc * cid;
}

function ofertaDeArquetipo(a: Arquetipo, buxa: boolean, mult: number): CasoOferta {
  return {
    id: id(),
    cliente: escolher(NOMES),
    area: a.area,
    titulo: a.titulo,
    resumo: a.resumo,
    complexidade: a.complexidade,
    valorBase: Math.max(400, jitter(a.valorBase * mult)),
    buxa,
    sinal: a.sinal,
    aceitaEntrada: !buxa || chance(0.15),
    // Embaralha as teses para que a ordem não entregue quais são as certas.
    teses: embaralhar(a.teses.map((t) => ({ id: id(), texto: t.texto, correta: t.correta }))),
    analisado: false,
  };
}

export function gerarOfertas(e: Estado, n: number): CasoOferta[] {
  const mult = multiplicadorQualidade(e);
  const { min, max } = faixaTier(e);
  const reais = ARQUETIPOS.filter((a) => a.tier >= min && a.tier <= max);
  const evitar = new Set(e.ultimosTitulos);
  const usados = new Set<string>();
  const lista: CasoOferta[] = [];
  for (let i = 0; i < n; i++) {
    // ~28% de chance de ser um caso "buxa".
    const buxa = chance(0.28);
    let arq: Arquetipo;
    if (buxa) {
      const bxPool = ARQUETIPOS_BUXA.filter((a) => a.tier <= max && !usados.has(a.titulo));
      arq = escolher(bxPool.length ? bxPool : ARQUETIPOS_BUXA);
    } else {
      // Evita repetir casos da rodada anterior e dentro da mesma rodada.
      let cand = reais.filter((a) => !usados.has(a.titulo) && !evitar.has(a.titulo));
      if (cand.length === 0) cand = reais.filter((a) => !usados.has(a.titulo));
      if (cand.length === 0) cand = reais;
      arq = escolher(cand);
    }
    usados.add(arq.titulo);
    lista.push(ofertaDeArquetipo(arq, buxa, mult));
  }
  // Guarda os títulos desta rodada para a próxima não repetir.
  e.ultimosTitulos = lista.map((o) => o.titulo);
  return lista;
}

export function gerarCrime(e: Estado): OportunidadeCrime {
  const { max } = faixaTier(e);
  let pool = CRIMES.filter((c) => c.tier <= max && c.titulo !== e.ultimoCrime);
  if (pool.length === 0) pool = CRIMES.filter((c) => c.tier <= max);
  if (pool.length === 0) pool = CRIMES.slice();
  const c = escolher(pool);
  e.ultimoCrime = c.titulo;
  return {
    id: id(),
    titulo: c.titulo,
    descricao: c.descricao,
    ganho: jitter(c.ganho, 0.2),
    chanceBase: c.chanceBase,
    penaDias: c.penaDias,
    multa: c.multa,
    perdaReputacao: c.perdaReputacao,
  };
}

// ------------------------------ Probabilidades ------------------------------

const MULT_FAIXA: Record<FaixaPreco, number> = {
  conservador: 0.7,
  justo: 1.0,
  ousado: 1.5,
  abusivo: 2.2,
};
const ACEITE_BASE: Record<FaixaPreco, number> = {
  conservador: 0.92,
  justo: 0.75,
  ousado: 0.5,
  abusivo: 0.28,
};

export function honorarioDe(oferta: CasoOferta, faixa: FaixaPreco): number {
  return Math.round((oferta.valorBase * MULT_FAIXA[faixa]) / 10) * 10;
}

export function chanceAceite(e: Estado, oferta: CasoOferta, faixa: FaixaPreco): number {
  let p = ACEITE_BASE[faixa];
  p += (e.carisma / 100) * 0.25;
  p += (e.reputacao / 100) * 0.15;
  p -= (oferta.complexidade - 2) * 0.03;
  // Cliente "buxa" topa fácil (quer fisgar o advogado).
  if (oferta.buxa) p += 0.2;
  return clamp(p, 0.05, 0.98) as number;
}

/** Chance de vitória do caso, dadas as teses escolhidas. */
export function chanceVitoria(e: Estado, caso: CasoOferta, tesesIds: string[]): number {
  let p = 0.32;
  const tecnicaEfetiva = clamp(e.tecnica + e.estagiarios * 6);
  p += (tecnicaEfetiva / 100) * 0.28;
  p += (e.carisma / 100) * 0.08;
  p += (e.reputacao / 100) * 0.1;
  p -= (caso.complexidade - 2) * 0.05;

  const corretasTotais = caso.teses.filter((t) => t.correta).length;
  let acertos = 0;
  for (const tid of tesesIds) {
    const t = caso.teses.find((x) => x.id === tid);
    if (!t) continue;
    if (t.correta) {
      p += 0.13;
      acertos++;
    } else {
      p -= 0.1;
    }
  }
  // Penaliza deixar de fora as teses vencedoras principais.
  if (corretasTotais > 0) p -= (corretasTotais - acertos) * 0.04;

  if (caso.buxa) p = Math.min(p, 0.12); // caso perdido/armadilha
  return clamp(p, 0.03, 0.97) as number;
}

/** Leitura técnica do caso — mais precisa quanto maior a técnica. */
export function leituraTecnica(e: Estado, oferta: CasoOferta): {
  visivel: boolean;
  buxaRevelada: boolean;
  chanceEstim: number;
} {
  const nitidez = clamp(e.tecnica + e.estagiarios * 5) / 100; // 0–1
  // Estimativa "honesta" da vitória usando as teses corretas.
  const ideais = oferta.teses.filter((t) => t.correta).map((t) => t.id);
  const real = chanceVitoria(e, oferta, ideais);
  // Ruído inversamente proporcional à técnica.
  const ruido = (rand() * 2 - 1) * (1 - nitidez) * 0.35;
  const chanceEstim = clamp(real + ruido, 0.02, 0.98) as number;
  // A "buxa" só é claramente revelada com técnica razoável.
  const buxaRevelada = oferta.buxa && nitidez > 0.35;
  return { visivel: true, buxaRevelada, chanceEstim };
}

// ------------------------------ XP / nível ------------------------------

function ganharXp(e: Estado, xp: number): Estado {
  let total = e.xp + xp;
  let nivel = e.nivel;
  let energiaMax = e.energiaMax;
  while (total >= nivel * 100) {
    total -= nivel * 100;
    nivel++;
    energiaMax += 1;
  }
  return { ...e, xp: total, nivel, energiaMax };
}

// ------------------------------ Ações (reducer) ------------------------------

export type Acao =
  | { tipo: "carregar"; estado: Estado }
  | { tipo: "analisar"; ofertaId: string }
  | { tipo: "aceitar"; ofertaId: string; faixa: FaixaPreco }
  | { tipo: "recusar"; ofertaId: string }
  | { tipo: "protocolar"; casoId: string; tesesIds: string[] }
  | { tipo: "crime-aceitar" }
  | { tipo: "crime-recusar" }
  | { tipo: "treinar"; treinoId: string }
  | { tipo: "contratar-estagiario" }
  | { tipo: "demitir-estagiario" }
  | { tipo: "upgrade-escritorio" }
  | { tipo: "mudar-cidade"; cidadeId: string }
  | { tipo: "encerrar-dia" }
  | { tipo: "reiniciar" };

const CUSTO_ESTAGIARIO = 3000; // contratação
const SALARIO_ESTAGIARIO = 40; // por dia

export function reduzir(e: Estado, acao: Acao): Estado {
  if (e.encerrado && acao.tipo !== "reiniciar") return e;

  switch (acao.tipo) {
    case "carregar":
      return acao.estado;

    case "reiniciar":
      return estadoInicial();

    case "analisar": {
      if (e.energia < 1) return registrar(e, "Sem energia para analisar. Encerre o dia para descansar.", "ruim");
      const ofertas = e.ofertas.map((o) => (o.id === acao.ofertaId ? { ...o, analisado: true } : o));
      return { ...e, energia: e.energia - 1, ofertas };
    }

    case "recusar": {
      const oferta = e.ofertas.find((o) => o.id === acao.ofertaId);
      const ofertas = e.ofertas.filter((o) => o.id !== acao.ofertaId);
      let ns = { ...e, ofertas };
      if (oferta?.buxa) {
        ns = registrar(ns, `Você dispensou "${oferta.titulo}". Faro afiado — era roubada.`, "bom");
        ns = { ...ns, reputacao: clamp(ns.reputacao + 1) };
      } else if (oferta) {
        ns = registrar(ns, `Você recusou "${oferta.titulo}". O cliente procurou outro.`, "neutro");
      }
      return ns;
    }

    case "aceitar": {
      const oferta = e.ofertas.find((o) => o.id === acao.ofertaId);
      if (!oferta) return e;
      if (e.energia < 1) return registrar(e, "Sem energia para negociar. Encerre o dia.", "ruim");
      const slots = ESCRITORIOS[e.escritorioNivel].slots;
      if (e.ativos.length >= slots)
        return registrar(e, "Sem vaga para novos casos. Resolva casos ou amplie o escritório.", "ruim");

      const p = chanceAceite(e, oferta, acao.faixa);
      let ns = { ...e, energia: e.energia - 1, ofertas: e.ofertas.filter((o) => o.id !== oferta.id) };
      const honorario = honorarioDe(oferta, acao.faixa);

      if (!chance(p)) {
        ns = registrar(ns, `${oferta.cliente} achou ${brlCurto(honorario)} caro e não fechou. 🙁`, "ruim");
        return ns;
      }

      const entrada = oferta.aceitaEntrada ? Math.round(honorario * 0.25) : 0;
      const ativo: CasoAtivo = {
        ...oferta,
        honorario,
        entrada,
        faixa: acao.faixa,
        tesesEscolhidas: [],
        diaLimite: e.dia + 6,
      };
      ns = {
        ...ns,
        dinheiro: ns.dinheiro + entrada,
        ativos: [...ns.ativos, ativo],
      };
      ns = ganharXp(ns, 10);
      const txtEntrada = entrada > 0 ? ` Entrada de ${brlCurto(entrada)} no caixa.` : " Sem entrada (cuidado).";
      ns = registrar(ns, `Fechou "${oferta.titulo}" por ${brlCurto(honorario)}.${txtEntrada}`, entrada > 0 ? "bom" : "neutro");
      return ns;
    }

    case "protocolar": {
      const caso = e.ativos.find((c) => c.id === acao.casoId);
      if (!caso) return e;
      if (e.energia < 2) return registrar(e, "Protocolar exige 2 de energia. Encerre o dia.", "ruim");

      const p = chanceVitoria(e, caso, acao.tesesIds);
      const venceu = chance(p);
      let ns = { ...e, energia: e.energia - 2, ativos: e.ativos.filter((c) => c.id !== caso.id) };
      const restante = Math.max(0, caso.honorario - caso.entrada);

      if (venceu) {
        ns = {
          ...ns,
          dinheiro: ns.dinheiro + restante,
          reputacao: clamp(ns.reputacao + 3 + Math.round(caso.complexidade)),
          tecnica: clamp(ns.tecnica + 1),
          vitorias: ns.vitorias + 1,
        };
        ns = ganharXp(ns, 25 + caso.complexidade * 5);
        ns = registrar(ns, `🏆 Ganhou "${caso.titulo}"! Recebeu ${brlCurto(restante)} e ganhou reputação.`, "bom");
      } else {
        ns = {
          ...ns,
          reputacao: clamp(ns.reputacao - (caso.buxa ? 2 : 4)),
          derrotas: ns.derrotas + 1,
        };
        ns = ganharXp(ns, 6);
        const nota = caso.buxa
          ? "Era um caso buxa — perdeu tempo e um pouco de reputação."
          : "Perdeu o caso. A reputação sofreu.";
        ns = registrar(ns, `❌ Perdeu "${caso.titulo}". ${nota}`, "ruim");
      }
      return ns;
    }

    case "crime-aceitar": {
      if (!e.crime) return e;
      if (e.energia < 2) return registrar(e, "Sem energia para essa 'empreitada'.", "ruim");
      const c = e.crime;
      // Reputação alta chama atenção; técnica ajuda a não deixar rastro.
      const p = clamp(c.chanceBase + (e.tecnica / 100) * 0.15 - (e.reputacao / 100) * 0.1, 0.1, 0.9) as number;
      let ns: Estado = { ...e, energia: e.energia - 2, crime: null };
      if (chance(p)) {
        ns = { ...ns, dinheiro: ns.dinheiro + c.ganho, reputacao: clamp(ns.reputacao - 3) };
        ns = registrar(ns, `🤫 Deu certo. ${brlCurto(c.ganho)} no bolso, sem rastros... por enquanto.`, "crime");
      } else {
        ns = {
          ...ns,
          dinheiro: ns.dinheiro - c.multa,
          reputacao: clamp(ns.reputacao - c.perdaReputacao),
          preso: c.penaDias,
        };
        ns = registrar(
          ns,
          `🚔 Você foi pego! Multa de ${brlCurto(c.multa)}, ${c.penaDias} dias preso e a reputação em frangalhos.`,
          "crime",
        );
      }
      return ns;
    }

    case "crime-recusar":
      return registrar({ ...e, crime: null }, "Você recusou a proposta suja. Ficha limpa.", "neutro");

    case "treinar": {
      const t = TREINOS.find((x) => x.id === acao.treinoId);
      if (!t) return e;
      if (e.dinheiro < t.custo) return registrar(e, "Dinheiro insuficiente para esse treino.", "ruim");
      if (e.energia < t.energia) return registrar(e, "Sem energia para treinar hoje.", "ruim");
      let ns = { ...e, dinheiro: e.dinheiro - t.custo, energia: e.energia - t.energia };
      ns = { ...ns, [t.atributo]: clamp((ns[t.atributo] as number) + t.ganho) } as Estado;
      return registrar(ns, `📚 ${t.nome}: +${t.ganho} de ${t.atributo}.`, "bom");
    }

    case "contratar-estagiario": {
      const esc = ESCRITORIOS[e.escritorioNivel];
      if (e.estagiarios >= esc.maxEstagiarios)
        return registrar(e, "Seu escritório não comporta mais estagiários. Amplie primeiro.", "ruim");
      if (e.dinheiro < CUSTO_ESTAGIARIO) return registrar(e, "Sem caixa para contratar agora.", "ruim");
      const ns = { ...e, dinheiro: e.dinheiro - CUSTO_ESTAGIARIO, estagiarios: e.estagiarios + 1 };
      return registrar(ns, "🧑‍🎓 Novo estagiário contratado. Mais técnica na equipe.", "bom");
    }

    case "demitir-estagiario": {
      if (e.estagiarios <= 0) return e;
      const ns = { ...e, estagiarios: e.estagiarios - 1 };
      return registrar(ns, "Estagiário dispensado. Menos salário a pagar.", "neutro");
    }

    case "upgrade-escritorio": {
      const prox = ESCRITORIOS[e.escritorioNivel + 1];
      if (!prox) return registrar(e, "Você já está no topo. 🏛️", "neutro");
      if (e.dinheiro < prox.custoUpgrade) return registrar(e, "Falta caixa para essa mudança de sede.", "ruim");
      let ns = {
        ...e,
        dinheiro: e.dinheiro - prox.custoUpgrade,
        escritorioNivel: e.escritorioNivel + 1,
        energiaMax: e.energiaMax + prox.energiaBonus,
      };
      ns = { ...ns, reputacao: clamp(ns.reputacao + 5) };
      return registrar(ns, `🏢 Novo escritório: ${prox.nome}! Mais vagas, melhores casos.`, "bom");
    }

    case "mudar-cidade": {
      const cid = CIDADES.find((c) => c.id === acao.cidadeId);
      if (!cid || cid.id === e.cidadeId) return e;
      if (e.dinheiro < cid.custoMudanca) return registrar(e, "Mudar de cidade custa mais do que você tem agora.", "ruim");
      const ns = { ...e, dinheiro: e.dinheiro - cid.custoMudanca, cidadeId: cid.id };
      return registrar(ns, `📍 Escritório transferido para ${cid.nome}. Novos horizontes.`, "bom");
    }

    case "encerrar-dia":
      return encerrarDia(e);
  }
}

function encerrarDia(e: Estado): Estado {
  const esc = ESCRITORIOS[e.escritorioNivel];
  let ns = { ...e };

  // Custos fixos.
  const custoFixo = esc.aluguel + e.estagiarios * SALARIO_ESTAGIARIO;
  ns.dinheiro -= custoFixo;

  // Casos que expiram (não protocolados a tempo).
  const expirados = ns.ativos.filter((c) => c.diaLimite <= ns.dia + 1);
  ns.ativos = ns.ativos.filter((c) => c.diaLimite > ns.dia + 1);

  // Avança o dia.
  ns.dia += 1;
  ns.energia = ns.energiaMax + esc.energiaBonus;

  // Prisão.
  if (ns.preso > 0) {
    ns.preso -= 1;
  }

  // Novos casos e talvez uma proposta do submundo (só quando livre).
  if (ns.preso <= 0) {
    ns.ofertas = gerarOfertas(ns, 3);
    ns.crime = chance(0.35) ? gerarCrime(ns) : null;
  } else {
    ns.ofertas = [];
    ns.crime = null;
  }

  ns = registrar(ns, `— Dia ${ns.dia} — Custos do dia: ${brlCurto(custoFixo)}.`, "neutro");
  for (const c of expirados) {
    ns = { ...ns, reputacao: clamp(ns.reputacao - 3) };
    ns = registrar(ns, `⏰ "${c.titulo}" expirou sem protocolo. Cliente insatisfeito.`, "ruim");
  }
  if (e.preso > 0 && ns.preso <= 0) ns = registrar(ns, "🔓 Você saiu da prisão. Hora de reconstruir a carreira.", "neutro");
  else if (ns.preso > 0) ns = registrar(ns, `🔒 Ainda preso: faltam ${ns.preso} dia(s).`, "ruim");

  // Falência.
  if (ns.dinheiro <= -3000) {
    ns.encerrado = true;
    ns = registrar(ns, "💥 Falência! As dívidas te afundaram. Fim de jogo — reinicie para tentar de novo.", "ruim");
  }
  return ns;
}

// ------------------------------ Formatação ------------------------------

export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
export function brlCurto(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${v < 0 ? "-" : ""}R$ ${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`;
  return brl(v);
}
