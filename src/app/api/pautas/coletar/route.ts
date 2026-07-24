import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { coletarTodas } from "@/lib/fontes";

export const runtime = "nodejs";
// Coleta pode demorar (4 fontes externas); evita cache da plataforma.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dispara a garimpagem de pautas nas fontes oficiais (STF, STJ, Câmara, Senado).
//
//  • Em produção (Supabase com SUPABASE_SERVICE_ROLE_KEY): grava as pautas novas
//    na tabela `pautas`, sem duplicar (chave única fonte+externo_id).
//  • Sem Supabase no servidor (modo demo): apenas devolve as candidatas para o
//    app salvar localmente.
//
// Protegido opcionalmente por CRON_SECRET (cabeçalho Authorization: Bearer …),
// para o agendador da Vercel poder chamar com segurança.
async function coletar(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  }

  const { candidatas, porFonte, erros } = await coletarTodas();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Modo demo (sem Supabase no servidor): devolve as candidatas para o cliente.
  if (!url || !serviceKey) {
    return NextResponse.json({
      persisted: false,
      total: candidatas.length,
      porFonte,
      erros,
      candidatas,
    });
  }

  const sb = createClient(url, serviceKey);
  const linhas = candidatas.map((c) => ({
    fonte: c.fonte,
    externo_id: c.externo_id,
    titulo: c.titulo,
    resumo: c.resumo ?? null,
    url: c.url,
    data_fonte: c.data_fonte ?? null,
    tema: c.tema ?? null,
    status: "nova",
  }));

  let inseridas = 0;
  if (linhas.length) {
    // upsert ignora as que já existem (mesma fonte+externo_id) sem sobrescrever
    // o status que o advogado já tenha definido.
    const { data, error } = await sb
      .from("pautas")
      .upsert(linhas, { onConflict: "fonte,externo_id", ignoreDuplicates: true })
      .select("id");
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    inseridas = data?.length ?? 0;
  }

  return NextResponse.json({ persisted: true, total: candidatas.length, inseridas, porFonte, erros });
}

export async function GET(req: NextRequest) {
  return coletar(req);
}

export async function POST(req: NextRequest) {
  return coletar(req);
}
