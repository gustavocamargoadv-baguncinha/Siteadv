import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook chamado pelo provedor de monitoramento (Escavador/Judit) quando um
// processo monitorado recebe nova movimentação. Grava o andamento no Supabase.
//
// Segurança: defina TRIBUNAL_WEBHOOK_SECRET e configure o provedor para enviar
// o mesmo valor no cabeçalho "x-webhook-secret".
//
// Payload aceito (normalizado):
// { "numero_cnj": "0000000-00.0000.0.00.0000",
//   "movimentacoes": [{ "data": "2026-07-18", "descricao": "..." }] }

export async function POST(req: NextRequest) {
  const secret = process.env.TRIBUNAL_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { erro: "Supabase não configurado no servidor (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  const numero = typeof body?.numero_cnj === "string" ? body.numero_cnj.replace(/\D/g, "") : "";
  const movimentacoes: { data?: string; descricao?: string }[] = Array.isArray(body?.movimentacoes) ? body.movimentacoes : [];

  if (!numero || movimentacoes.length === 0) {
    return NextResponse.json({ erro: "payload inválido: informe numero_cnj e movimentacoes[]" }, { status: 400 });
  }

  const supabase = createClient(url, serviceKey);

  const { data: processos, error: erroBusca } = await supabase.from("processos").select("id, numero_cnj");
  if (erroBusca) {
    return NextResponse.json({ erro: erroBusca.message }, { status: 500 });
  }

  const processo = (processos ?? []).find((p) => (p.numero_cnj ?? "").replace(/\D/g, "") === numero);
  if (!processo) {
    return NextResponse.json({ erro: "processo não encontrado para este número CNJ" }, { status: 404 });
  }

  const linhas = movimentacoes
    .filter((m) => m.descricao)
    .map((m) => ({
      processo_id: processo.id,
      data: m.data ?? new Date().toISOString().slice(0, 10),
      descricao: m.descricao!,
      origem: "tribunal" as const,
    }));

  const { error: erroInsert } = await supabase.from("andamentos").insert(linhas);
  if (erroInsert) {
    return NextResponse.json({ erro: erroInsert.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inseridos: linhas.length });
}
