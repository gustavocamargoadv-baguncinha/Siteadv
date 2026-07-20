import { NextResponse } from "next/server";
import { registrarMonitoramentoOAB } from "@/lib/tribunais";

// Aciona o monitoramento de TODOS os processos do advogado pela OAB.
// Chame uma vez após configurar as variáveis do provedor (Escavador/Judit).
// Sem provedor configurado, responde { simulated: true }.
export async function POST() {
  const resultado = await registrarMonitoramentoOAB();
  return NextResponse.json(resultado);
}
