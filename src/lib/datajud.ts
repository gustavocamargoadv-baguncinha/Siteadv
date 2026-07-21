// Integração com a API Pública do DataJud (CNJ) — gratuita e sem cadastro.
// https://datajud-wiki.cnj.jus.br/api-publica
//
// A chave é pública (a mesma para todos, publicada pelo CNJ). Se um dia mudar,
// basta atualizar DATAJUD_API_KEY no ambiente com o valor novo do site do CNJ.
// Roda no servidor (rota /api/tribunais/datajud) para evitar bloqueio de CORS.

const CHAVE_PUBLICA =
  process.env.DATAJUD_API_KEY ||
  "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

// Código TR (posições 15-16 do número CNJ) → UF, para a Justiça Estadual (J = 8).
const TR_ESTADUAL: Record<string, string> = {
  "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba", "06": "ce",
  "07": "df", "08": "es", "09": "go", "10": "ma", "11": "mt", "12": "ms",
  "13": "mg", "14": "pa", "15": "pb", "16": "pr", "17": "pe", "18": "pi",
  "19": "rj", "20": "rn", "21": "rs", "22": "ro", "23": "rr", "24": "sc",
  "25": "se", "26": "sp", "27": "to",
};

/** Escolhe o índice (tribunal) do DataJud a partir do número CNJ. Cobre a
 *  Justiça Estadual (a dos processos criminais do escritório); demais ramos
 *  caem no padrão TJSP. */
export function aliasTribunal(cnjDigitos: string): string {
  const d = cnjDigitos.replace(/\D/g, "");
  if (d.length !== 20) return "tjsp";
  const justica = d[13];
  const tr = d.slice(14, 16);
  if (justica === "8") return "tj" + (TR_ESTADUAL[tr] ?? "sp");
  return "tjsp";
}

export interface MovDataJud {
  data: string; // ISO date (YYYY-MM-DD)
  descricao: string;
}

/** Busca as movimentações de um processo na API Pública do DataJud.
 *  Com timeout: se o tribunal demorar, aborta para não travar a requisição. */
export async function buscarMovimentosDataJud(cnjDigitos: string, timeoutMs = 7000): Promise<MovDataJud[]> {
  const alias = aliasTribunal(cnjDigitos);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_${alias}/_search`, {
      method: "POST",
      headers: { Authorization: `APIKey ${CHAVE_PUBLICA}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { match: { numeroProcesso: cnjDigitos } }, size: 1 }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`DataJud (${alias}) respondeu ${res.status}`);
  const json = await res.json();
  const fonte = json?.hits?.hits?.[0]?._source;
  const movimentos: unknown[] = Array.isArray(fonte?.movimentos) ? fonte.movimentos : [];
  return movimentos
    .map((m) => {
      const mov = m as { dataHora?: string; nome?: string };
      return { data: (mov.dataHora ?? "").slice(0, 10), descricao: mov.nome ?? "(movimento sem descrição)" };
    })
    .filter((m) => m.data)
    .sort((a, b) => b.data.localeCompare(a.data));
}
