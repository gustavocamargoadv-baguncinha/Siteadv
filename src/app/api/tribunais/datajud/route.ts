import { NextRequest, NextResponse } from "next/server";
import { buscarMovimentosDataJud, type MovDataJud } from "@/lib/datajud";

// Consulta as movimentações de vários processos no DataJud (CNJ).
// Recebe { numeros: ["0000000-00.0000.0.00.0000", ...] } e devolve, por CNJ
// (só dígitos), a lista de movimentações. Roda no servidor (sem CORS).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const numeros: string[] = Array.isArray(body?.numeros) ? body.numeros : [];
  if (!numeros.length) {
    return NextResponse.json({ erro: "informe numeros[]" }, { status: 400 });
  }

  const resultado: Record<string, MovDataJud[]> = {};
  const erros: Record<string, string> = {};

  for (const n of numeros) {
    const d = (n ?? "").replace(/\D/g, "");
    if (d.length !== 20) {
      erros[n] = "número CNJ inválido";
      continue;
    }
    try {
      resultado[d] = await buscarMovimentosDataJud(d);
    } catch (e) {
      erros[n] = e instanceof Error ? e.message : "falha ao consultar";
    }
  }

  return NextResponse.json({ resultado, erros });
}
