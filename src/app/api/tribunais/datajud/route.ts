import { NextRequest, NextResponse } from "next/server";
import { buscarMovimentosDataJud, type MovDataJud } from "@/lib/datajud";

// Consulta as movimentações de vários processos no DataJud (CNJ).
// Recebe { numeros: ["0000000-00.0000.0.00.0000", ...] } e devolve, por CNJ
// (só dígitos), a lista de movimentações. Roda no servidor (sem CORS).

// Permite até 60s de execução na Vercel (o padrão de 10s estoura com muitos processos).
export const maxDuration = 60;

/** Executa `fn` sobre os itens com no máximo `limite` chamadas simultâneas. */
async function comLimite<T, R>(itens: T[], limite: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const numeros: string[] = Array.isArray(body?.numeros) ? body.numeros : [];
  if (!numeros.length) {
    return NextResponse.json({ erro: "informe numeros[]" }, { status: 400 });
  }

  const resultado: Record<string, MovDataJud[]> = {};
  const erros: Record<string, string> = {};

  // consultas em paralelo (com limite), cada uma com timeout próprio
  await comLimite(numeros, 6, async (n) => {
    const d = (n ?? "").replace(/\D/g, "");
    if (d.length !== 20) {
      erros[n] = "número CNJ inválido";
      return;
    }
    try {
      resultado[d] = await buscarMovimentosDataJud(d);
    } catch (e) {
      erros[n] = e instanceof Error ? e.message : "falha ao consultar";
    }
  });

  return NextResponse.json({ resultado, erros });
}
