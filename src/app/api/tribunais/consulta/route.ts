import { NextRequest, NextResponse } from "next/server";
import { buscarDadosProcessoDataJud } from "@/lib/datajud";

// Consulta os DADOS cadastrais de um processo no DataJud (CNJ), para o
// auto-preenchimento do cadastro. Recebe { numero: "..." }. Roda no servidor.

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const numero: string = typeof body?.numero === "string" ? body.numero : "";
  const d = numero.replace(/\D/g, "");
  if (d.length !== 20) {
    return NextResponse.json({ erro: "número CNJ inválido" }, { status: 400 });
  }
  try {
    const dados = await buscarDadosProcessoDataJud(d);
    return NextResponse.json({ dados });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "falha ao consultar" },
      { status: 502 }
    );
  }
}
