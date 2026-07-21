// Gera um calendário no formato iCalendar (.ics) a partir dos eventos da agenda.
// O Google Calendar (e Apple/Outlook) "assina" a URL desse feed e mostra os
// eventos automaticamente, com alarme. Fonte da verdade continua sendo o sistema.

export interface EventoICS {
  id: string;
  titulo: string;
  inicio: string; // ISO (com ou sem fuso; sem fuso = horário de Brasília)
  fim?: string;
  local?: string;
  notas?: string;
}

// Horário de Brasília é fixo em UTC-3 (o Brasil não tem mais horário de verão).
function paraUTCCompacto(iso: string): string {
  const temFuso = /Z$|[+-]\d\d:?\d\d$/.test(iso);
  const d = new Date(temFuso ? iso : `${iso}-03:00`);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string | undefined): string {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Quebra linhas com mais de 75 octetos, como manda o padrão iCalendar.
function dobrar(linha: string): string {
  if (linha.length <= 73) return linha;
  const partes: string[] = [];
  let resto = linha;
  partes.push(resto.slice(0, 73));
  resto = resto.slice(73);
  while (resto.length > 72) {
    partes.push(" " + resto.slice(0, 72));
    resto = resto.slice(72);
  }
  partes.push(" " + resto);
  return partes.join("\r\n");
}

export function gerarICS(eventos: EventoICS[], nomeCalendario = "Camargo — Agenda"): string {
  const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Camargo Advocacia//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(nomeCalendario)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const e of eventos) {
    if (!e.inicio) continue;
    const inicio = paraUTCCompacto(e.inicio);
    const fim = paraUTCCompacto(e.fim ?? new Date(new Date(e.inicio.length > 19 ? e.inicio : e.inicio + "-03:00").getTime() + 3600000).toISOString());
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.id)}@camargo-adv`,
      `DTSTAMP:${agora}`,
      `DTSTART:${inicio}`,
      `DTEND:${fim}`,
      dobrar(`SUMMARY:${esc(e.titulo)}`),
      ...(e.local ? [dobrar(`LOCATION:${esc(e.local)}`)] : []),
      ...(e.notas ? [dobrar(`DESCRIPTION:${esc(e.notas)}`)] : []),
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      dobrar(`DESCRIPTION:${esc(e.titulo)}`),
      "END:VALARM",
      "END:VEVENT"
    );
  }

  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n") + "\r\n";
}
