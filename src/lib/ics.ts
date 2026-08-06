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
  link?: string; // link de videochamada (Teams/Meet/Zoom)
  /** Prazo processual: vira evento de DIA INTEIRO (o prazo não tem hora) e o
   *  alarme toca na véspera, não 2h antes — de nada adianta avisar às 22h que o
   *  prazo vence naquele mesmo dia. */
  diaInteiro?: boolean;
  /** Antecedência do alarme, em horas. Padrão: 2h (compromissos). */
  alarmeHorasAntes?: number;
}

/** Data ISO (YYYY-MM-DD) no formato compacto de data pura do iCalendar. */
function paraDataCompacta(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Dia seguinte — o DTEND de um evento de dia inteiro é exclusivo no iCalendar. */
function diaSeguinte(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
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
    // Descrição: o link da videochamada primeiro (o Google Agenda o torna
    // clicável), seguido das notas.
    const descricao = [e.link ? `Entrar na reunião: ${e.link}` : "", e.notas ?? ""]
      .filter(Boolean)
      .join("\n\n");

    // Datas: prazo é dia inteiro (DTSTART;VALUE=DATE, DTEND exclusivo no dia
    // seguinte); compromisso tem hora.
    const linhasData = e.diaInteiro
      ? [`DTSTART;VALUE=DATE:${paraDataCompacta(e.inicio)}`, `DTEND;VALUE=DATE:${diaSeguinte(e.inicio)}`]
      : [
          `DTSTART:${paraUTCCompacto(e.inicio)}`,
          `DTEND:${paraUTCCompacto(
            e.fim ??
              new Date(new Date(e.inicio.length > 19 ? e.inicio : e.inicio + "-03:00").getTime() + 3600000).toISOString()
          )}`,
        ];

    // Alarme: num prazo o padrão é a véspera (24h); num compromisso, 2h antes.
    const horas = e.alarmeHorasAntes ?? (e.diaInteiro ? 24 : 2);

    linhas.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.id)}@camargo-adv`,
      `DTSTAMP:${agora}`,
      ...linhasData,
      dobrar(`SUMMARY:${esc(e.titulo)}`),
      // sem local físico numa reunião por vídeo, o link vira o "local"
      ...(e.local || e.link ? [dobrar(`LOCATION:${esc(e.local || e.link!)}`)] : []),
      ...(descricao ? [dobrar(`DESCRIPTION:${esc(descricao)}`)] : []),
      ...(e.link ? [dobrar(`URL:${e.link}`)] : []),
      "BEGIN:VALARM",
      `TRIGGER:-PT${horas}H`,
      "ACTION:DISPLAY",
      dobrar(`DESCRIPTION:${esc(e.titulo)}`),
      "END:VALARM",
      "END:VEVENT"
    );
  }

  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n") + "\r\n";
}
