import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { gerarICS, type EventoICS } from "@/lib/ics";

// Feed iCalendar (.ics) da agenda, para o Google Calendar assinar.
// Protegido por um token secreto na URL (?token=...), definido em
// CALENDAR_FEED_TOKEN — só quem tem o link vê os eventos.
//
// URL: https://SEU-SITE/api/calendar/feed?token=SEU_TOKEN
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const esperado = process.env.CALENDAR_FEED_TOKEN;

  if (!esperado) {
    return NextResponse.json({ erro: "CALENDAR_FEED_TOKEN não configurado no servidor." }, { status: 501 });
  }
  if (token !== esperado) {
    return NextResponse.json({ erro: "token inválido" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ erro: "Supabase não configurado no servidor." }, { status: 501 });
  }

  const sb = createClient(url, serviceKey);
  const { data, error } = await sb
    .from("eventos_agenda")
    .select("id, titulo, inicio, fim, local, notas")
    .order("inicio", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const eventos: EventoICS[] = (data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    inicio: e.inicio,
    fim: e.fim ?? undefined,
    local: e.local ?? undefined,
    notas: e.notas ?? undefined,
  }));

  return new NextResponse(gerarICS(eventos), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="camargo-agenda.ics"',
      "Cache-Control": "public, max-age=600",
    },
  });
}
