import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { gerarICS, type EventoICS } from "@/lib/ics";

// Feed iCalendar (.ics) da agenda, para o Google Calendar assinar.
// Protegido por um token secreto na URL (?token=...), definido em
// CALENDAR_FEED_TOKEN — só quem tem o link vê os eventos.
//
// URL: https://SEU-SITE/api/calendar/feed?token=SEU_TOKEN
export async function GET(req: NextRequest) {
  // .trim() tolera espaços/quebras de linha coladas por engano no valor da
  // variável de ambiente ou na URL — evita "token inválido" por um espacinho.
  const token = req.nextUrl.searchParams.get("token")?.trim();
  const esperado = process.env.CALENDAR_FEED_TOKEN?.trim();

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
  const [{ data, error }, { data: prazos, error: erroPrazos }] = await Promise.all([
    sb.from("eventos_agenda").select("id, titulo, inicio, fim, local, notas, link_virtual").order("inicio", { ascending: true }),
    // Prazos pendentes entram no mesmo calendário: é o que faz o alarme do
    // Google tocar no celular sem depender de notificação do app.
    sb.from("prazos").select("id, titulo, tipo, data_limite, data_interna, notas, status").eq("status", "pendente"),
  ]);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  if (erroPrazos) {
    return NextResponse.json({ erro: erroPrazos.message }, { status: 500 });
  }

  const eventos: EventoICS[] = (data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    inicio: e.inicio,
    fim: e.fim ?? undefined,
    local: e.local ?? undefined,
    notas: e.notas ?? undefined,
    link: e.link_virtual ?? undefined,
  }));

  for (const p of prazos ?? []) {
    if (!p.data_limite) continue;
    const tipo = p.tipo ? ` (${p.tipo})` : "";
    // O prazo fatal sempre entra. Quando há meta interna antes dele, entra um
    // segundo lembrete — assim o aviso chega com folga para trabalhar, e o dia
    // do vencimento não é a primeira notícia.
    eventos.push({
      id: `prazo-${p.id}`,
      titulo: `⚖️ PRAZO FATAL: ${p.titulo}${tipo}`,
      inicio: p.data_limite,
      notas: p.notas ?? undefined,
      diaInteiro: true,
    });
    if (p.data_interna && p.data_interna < p.data_limite) {
      eventos.push({
        id: `prazo-interno-${p.id}`,
        titulo: `📌 Preparar: ${p.titulo}${tipo}`,
        inicio: p.data_interna,
        notas: `Meta interna. O prazo fatal é ${p.data_limite.slice(0, 10).split("-").reverse().join("/")}.`,
        diaInteiro: true,
      });
    }
  }

  return new NextResponse(gerarICS(eventos), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="camargo-agenda.ics"',
      "Cache-Control": "public, max-age=600",
    },
  });
}
