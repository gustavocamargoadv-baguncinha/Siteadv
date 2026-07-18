import { NextRequest, NextResponse } from "next/server";
import { registrarMonitoramento } from "@/lib/tribunais";

// Registra um processo para monitoramento automático junto ao provedor
// configurado (Escavador, Judit…). Sem provedor configurado, responde
// { simulated: true } e o app segue em modo demonstração.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const numero = typeof body?.numero_cnj === "string" ? body.numero_cnj : undefined;

  if (!numero) {
    return NextResponse.json({ simulated: true, motivo: "processo sem número CNJ" });
  }

  const resultado = await registrarMonitoramento(numero);
  return NextResponse.json(resultado);
}
