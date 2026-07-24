// Coleta de pautas nas fontes oficiais (server-side).
//
// Objetivo: garimpar automaticamente assuntos relevantes de DIREITO PENAL para
// alimentar a caixa de pautas do blog — SEM publicar nada sozinho. Cada fonte é
// independente: se uma falhar ou mudar de endereço, as outras seguem.
//
// Fontes:
//   • Câmara dos Deputados — API de Dados Abertos (JSON, robusta)
//   • Senado Federal       — API de Dados Abertos (JSON)
//   • STF                  — feed de notícias (RSS)
//   • STJ                  — feed de notícias (RSS)
//
// Os endereços de RSS do STF/STJ podem mudar; ficam em constantes (com override
// por variável de ambiente) justamente para ajustar sem reprogramar.

import type { FontePauta } from "./types";

export interface PautaCandidata {
  fonte: FontePauta;
  externo_id: string;
  titulo: string;
  resumo?: string;
  url: string;
  data_fonte?: string; // ISO date
  tema?: string;
}

// Termos que caracterizam interesse penal. O primeiro que casar vira o "tema".
const TERMOS_PENAIS = [
  "processo penal", "execução penal", "habeas corpus", "dosimetria", "prescrição",
  "tribunal do júri", "tráfico", "lavagem de dinheiro", "organização criminosa",
  "prisão preventiva", "prisão temporária", "flagrante", "reincidência",
  "progressão de regime", "livramento condicional", "remição", "colaboração premiada",
  "delação", "interceptação telefônica", "foro por prerrogativa", "violência doméstica",
  "maria da penha", "estupro", "homicídio", "latrocínio", "estelionato", "roubo",
  "furto", "porte de arma", "penal", "criminal", "crime", "pena",
];

function detectarTema(texto: string): string | undefined {
  const t = texto.toLowerCase();
  return TERMOS_PENAIS.find((termo) => t.includes(termo));
}

/** Mantém só o que tem cara de matéria penal. */
function ehPenal(titulo: string, resumo?: string): string | undefined {
  return detectarTema(`${titulo} ${resumo ?? ""}`);
}

function limpar(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function buscarJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // não guarda cache do provedor: sempre queremos o mais novo
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  return res.json();
}

async function buscarTexto(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  return res.text();
}

// --------------------------------------------------------------------------
// RSS genérico (STF e STJ publicam notícias em RSS)
// --------------------------------------------------------------------------
function parseRSS(xml: string): { titulo: string; url: string; resumo: string; data?: string }[] {
  const itens: { titulo: string; url: string; resumo: string; data?: string }[] = [];
  const blocos = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const bloco of blocos) {
    const titulo = limpar(bloco.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const url = limpar(bloco.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    const resumo = limpar(bloco.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "");
    const pub = bloco.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    const data = pub ? new Date(pub.trim()).toISOString().slice(0, 10) : undefined;
    if (titulo && url) itens.push({ titulo, url, resumo, data });
  }
  return itens;
}

async function coletarRSS(fonte: FontePauta, url: string): Promise<PautaCandidata[]> {
  const xml = await buscarTexto(url);
  return parseRSS(xml).flatMap<PautaCandidata>((it) => {
    const tema = ehPenal(it.titulo, it.resumo);
    if (!tema) return [];
    return [
      {
        fonte,
        externo_id: it.url,
        titulo: it.titulo,
        resumo: it.resumo?.slice(0, 400) || undefined,
        url: it.url,
        data_fonte: it.data,
        tema,
      },
    ];
  });
}

const STF_RSS = process.env.STF_RSS_URL ?? "https://portal.stf.jus.br/rss/noticias.asp";
const STJ_RSS =
  process.env.STJ_RSS_URL ??
  "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/rss.aspx";

export async function coletarSTF(): Promise<PautaCandidata[]> {
  return coletarRSS("stf", STF_RSS);
}

export async function coletarSTJ(): Promise<PautaCandidata[]> {
  return coletarRSS("stj", STJ_RSS);
}

// --------------------------------------------------------------------------
// Câmara dos Deputados — proposições recentes com tema penal
// --------------------------------------------------------------------------
interface ProposicaoCamara {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
  dataApresentacao?: string;
}

export async function coletarCamara(): Promise<PautaCandidata[]> {
  // Puxa as proposições mais recentes que mencionam "penal" na palavra-chave e
  // reconfirma o interesse penal na ementa.
  const url =
    "https://dadosabertos.camara.leg.br/api/v2/proposicoes" +
    "?keywords=penal&ordem=DESC&ordenarPor=id&itens=40";
  const json = (await buscarJSON(url)) as { dados?: ProposicaoCamara[] };
  const dados = json.dados ?? [];
  return dados.flatMap<PautaCandidata>((p) => {
    const titulo = `${p.siglaTipo} ${p.numero}/${p.ano}`;
    const ementa = limpar(p.ementa ?? "");
    const tema = ehPenal(titulo, ementa);
    if (!tema) return [];
    return [
      {
        fonte: "camara",
        externo_id: String(p.id),
        titulo: `${titulo} — ${ementa.slice(0, 120)}`,
        resumo: ementa.slice(0, 400) || undefined,
        url: `https://www.camara.leg.br/propostas-legislativas/${p.id}`,
        data_fonte: p.dataApresentacao?.slice(0, 10),
        tema,
      },
    ];
  });
}

// --------------------------------------------------------------------------
// Senado Federal — matérias com tema penal
// --------------------------------------------------------------------------
export async function coletarSenado(): Promise<PautaCandidata[]> {
  const url =
    "https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?palavraChave=penal";
  const json = (await buscarJSON(url)) as {
    PesquisaBasicaMateria?: { Materias?: { Materia?: unknown } };
  };
  const bruto = json.PesquisaBasicaMateria?.Materias?.Materia;
  const lista: Record<string, unknown>[] = Array.isArray(bruto)
    ? (bruto as Record<string, unknown>[])
    : bruto
    ? [bruto as Record<string, unknown>]
    : [];

  return lista.flatMap<PautaCandidata>((m) => {
    const ident = (m.IdentificacaoMateria ?? {}) as Record<string, string>;
    const dados = (m.DadosBasicosMateria ?? {}) as Record<string, string>;
    const codigo = ident.CodigoMateria;
    if (!codigo) return [];
    const sigla = `${ident.SiglaSubtipoMateria ?? ""} ${ident.NumeroMateria ?? ""}/${ident.AnoMateria ?? ""}`.trim();
    const ementa = limpar(dados.EmentaMateria ?? "");
    const tema = ehPenal(sigla, ementa);
    if (!tema) return [];
    return [
      {
        fonte: "senado",
        externo_id: String(codigo),
        titulo: `${sigla} — ${ementa.slice(0, 120)}`,
        resumo: ementa.slice(0, 400) || undefined,
        url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${codigo}`,
        data_fonte: (dados.DataApresentacao ?? "").slice(0, 10) || undefined,
        tema,
      },
    ];
  });
}

export interface ResultadoColeta {
  candidatas: PautaCandidata[];
  porFonte: Record<FontePauta, number>;
  erros: { fonte: FontePauta; erro: string }[];
}

// Roda as 4 fontes em paralelo, tolerante a falhas: uma fonte fora do ar não
// derruba as demais.
export async function coletarTodas(): Promise<ResultadoColeta> {
  const fontes: [FontePauta, () => Promise<PautaCandidata[]>][] = [
    ["stf", coletarSTF],
    ["stj", coletarSTJ],
    ["camara", coletarCamara],
    ["senado", coletarSenado],
  ];

  const candidatas: PautaCandidata[] = [];
  const porFonte = { stf: 0, stj: 0, camara: 0, senado: 0 } as Record<FontePauta, number>;
  const erros: { fonte: FontePauta; erro: string }[] = [];

  const resultados = await Promise.allSettled(fontes.map(([, fn]) => fn()));
  resultados.forEach((r, i) => {
    const fonte = fontes[i][0];
    if (r.status === "fulfilled") {
      porFonte[fonte] = r.value.length;
      candidatas.push(...r.value);
    } else {
      erros.push({ fonte, erro: r.reason instanceof Error ? r.reason.message : String(r.reason) });
    }
  });

  return { candidatas, porFonte, erros };
}
