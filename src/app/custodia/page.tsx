import type { Metadata } from "next";

/* -------------------------------------------------------------------------
   Landing page de captação — Audiência de Custódia em Itapetininga e região.
   Página pública (fora do login e do menu do sistema), pensada para campanha
   de Google Ads e busca orgânica. Publicidade em conformidade com o
   Provimento OAB 205/2021: informativa, sóbria, sem promessa de resultado e
   sem gatilhos de escassez falsa. A urgência é real (art. 310 do CPP: o preso
   deve ser apresentado ao juiz em até 24 horas).
   ------------------------------------------------------------------------- */

const WHATS_NUM = "5515996055581";
const WHATS_MSG =
  "Olá, Dr. Gustavo. Preciso de ajuda com uma audiência de custódia em Itapetininga e região.";
const WHATS_LINK = `https://wa.me/${WHATS_NUM}?text=${encodeURIComponent(WHATS_MSG)}`;
const TEL_CEL = "+5515996055581";
const TEL_FIXO = "+551532723072";
const EMAIL = "gustavocamargo@adv.oabsp.org.br";
// Perfil do Google Business do escritório (avaliações + mapa).
const GOOGLE_LINK = "https://share.google/bS1dIETXyDOdjrZkA";
const MAPS_LINK = GOOGLE_LINK;
const FOTO_ADVOGADO = "/advogado-gustavo-camargo.jpg";

const REGIAO = [
  "Itapetininga",
  "Tatuí",
  "Cerquilho",
  "Cesário Lange",
  "Boituva",
  "Angatuba",
  "Guareí",
  "Sarapuí",
  "Alambari",
  "São Miguel Arcanjo",
  "Capão Bonito",
  "Buri",
  "Itapeva",
  "Porangaba",
  "Bofete",
];

export const metadata: Metadata = {
  title:
    "Advogado de Audiência de Custódia em Itapetininga-SP | Gustavo Camargo — Plantão Criminal 24h",
  description:
    "Preso em flagrante em Itapetininga ou região? A audiência de custódia acontece em até 24 horas. Advocacia criminal com atendimento imediato para buscar o relaxamento da prisão ou a liberdade provisória. Fale agora no WhatsApp. Gustavo Roberto de Camargo — OAB/SP 431.515.",
  keywords: [
    "advogado audiência de custódia Itapetininga",
    "advogado criminal Itapetininga",
    "audiência de custódia Itapetininga",
    "prisão em flagrante Itapetininga",
    "advogado plantão criminal Itapetininga",
    "liberdade provisória Itapetininga",
    "relaxamento de prisão Itapetininga",
    "advogado criminalista Itapetininga e região",
  ],
  alternates: { canonical: "/custodia" },
  robots: { index: true, follow: true },
  openGraph: {
    title:
      "Audiência de Custódia em Itapetininga — Defesa Criminal Imediata | Gustavo Camargo Advocacia",
    description:
      "A audiência de custódia acontece em até 24 horas após a prisão. Atendimento imediato para buscar a liberdade. Fale agora no WhatsApp.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/logo-camargo.png" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Attorney",
  name: "Gustavo Camargo Advocacia — Direito Criminal",
  description:
    "Advocacia criminal em Itapetininga-SP com atendimento imediato para audiência de custódia, prisão em flagrante, relaxamento de prisão e liberdade provisória.",
  founder: "Gustavo Roberto de Camargo",
  telephone: TEL_CEL,
  email: EMAIL,
  image: "/logo-camargo.png",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Monsenhor Soares, 647, Centro",
    addressLocality: "Itapetininga",
    addressRegion: "SP",
    postalCode: "18200-009",
    addressCountry: "BR",
  },
  areaServed: REGIAO.map((c) => ({ "@type": "City", name: `${c} - SP` })),
  knowsAbout: [
    "Audiência de custódia",
    "Prisão em flagrante",
    "Liberdade provisória",
    "Relaxamento de prisão",
    "Direito penal",
    "Processo penal",
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "00:00",
    closes: "23:59",
  },
};

/* --------------------------------- ícones -------------------------------- */
function IconWhats({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}
function IconPhone({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconClock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconShield({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconScale({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v18M7 21h10M12 3l7 4M12 3L5 7M5 7l-3 6a4 4 0 0 0 6 0L5 7zM19 7l-3 6a4 4 0 0 0 6 0l-3-6z" />
    </svg>
  );
}
function IconPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconMail({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
    </svg>
  );
}
function IconStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
    </svg>
  );
}

/* --------------------------------- página -------------------------------- */
export default function CustodiaLanding() {
  return (
    <div className="min-h-dvh scroll-smooth bg-[#0a1120] text-slate-100 antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1120]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
              <IconScale className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">Gustavo Camargo</p>
              <p className="text-[11px] text-brand-300/90">Advocacia Criminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={TEL_CEL.replace("+", "tel:+")}
              className="hidden items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5 sm:flex"
            >
              <IconPhone className="h-4 w-4 text-brand-400" /> (15) 99605-5581
            </a>
            <a
              href={WHATS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2 text-sm font-bold text-[#0a1120] shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
            >
              <IconWhats className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(217,154,38,0.16),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
              <IconClock className="h-3.5 w-3.5" /> Atendimento imediato • 24 horas
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Prisão em flagrante em Itapetininga?
              <span className="mt-2 block text-brand-400">
                A audiência de custódia acontece em até 24 horas.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Cada hora conta. Nas primeiras horas após a prisão, uma defesa técnica
              presente pode ser decisiva para requerer o <strong className="text-white">relaxamento
              da prisão</strong> ou a <strong className="text-white">liberdade provisória</strong>.
              Atuação em Itapetininga e toda a região.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={WHATS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-4 text-base font-extrabold text-[#0a1120] shadow-xl shadow-emerald-500/25 transition hover:brightness-105 sm:w-auto"
              >
                <IconWhats className="h-5 w-5" /> Falar agora no WhatsApp
              </a>
              <a
                href={TEL_CEL.replace("+", "tel:+")}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 px-6 py-4 text-base font-bold text-white transition hover:bg-white/5 sm:w-auto"
              >
                <IconPhone className="h-5 w-5 text-brand-400" /> Ligar: (15) 99605-5581
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5"><IconShield className="h-4 w-4 text-brand-400" /> Gustavo Roberto de Camargo — OAB/SP 431.515</span>
              <span className="inline-flex items-center gap-1.5"><IconPin className="h-4 w-4 text-brand-400" /> Escritório no Centro de Itapetininga</span>
            </div>
          </div>
        </div>
      </section>

      {/* URGÊNCIA / EDUCATIVO */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Por que agir nas primeiras horas?</h2>
            <p className="mt-3 text-slate-300">
              A audiência de custódia é o momento em que o preso é apresentado a um juiz,
              logo após a prisão. É ali que se discute se a prisão foi legal e se a pessoa
              pode responder em liberdade.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: <IconClock className="h-6 w-6" />,
                titulo: "Prazo de 24 horas",
                texto:
                  "Por lei (art. 310 do CPP), quem é preso em flagrante deve ser apresentado ao juiz em até 24 horas. O tempo de reação é curto.",
              },
              {
                icon: <IconScale className="h-6 w-6" />,
                titulo: "É onde se decide a liberdade",
                texto:
                  "Na audiência o juiz pode relaxar a prisão ilegal, conceder liberdade provisória ou aplicar medidas cautelares no lugar da prisão.",
              },
              {
                icon: <IconShield className="h-6 w-6" />,
                titulo: "Defesa presente faz diferença",
                texto:
                  "Contar com um advogado atuando desde o início permite reunir informações, requerer direitos e sustentar a defesa no momento certo.",
              },
            ].map((c) => (
              <div key={c.titulo} className="rounded-2xl border border-white/10 bg-[#0d1526] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                  {c.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{c.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO PODEMOS AJUDAR */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Como podemos atuar no seu caso</h2>
          <p className="mt-3 text-slate-300">
            Atuação técnica e humana em Direito Criminal, com foco na audiência de custódia
            e nas fases seguintes do processo.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {[
            "Acompanhamento na audiência de custódia em Itapetininga e região",
            "Pedido de relaxamento da prisão em caso de ilegalidade",
            "Requerimento de liberdade provisória, com ou sem fiança",
            "Sustentação por medidas cautelares diversas da prisão",
            "Orientação imediata à família sobre o que fazer",
            "Defesa nas demais fases do processo criminal",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0d1526] p-4">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-400">
                <IconCheck className="h-4 w-4" />
              </span>
              <p className="text-sm leading-relaxed text-slate-200">{t}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          O resultado de cada caso depende das circunstâncias concretas e da decisão do
          Poder Judiciário. Este conteúdo tem caráter meramente informativo e não representa
          promessa de resultado.
        </p>
      </section>

      {/* O ADVOGADO */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="mx-auto w-full max-w-sm">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FOTO_ADVOGADO}
                alt="Gustavo Roberto de Camargo, advogado criminalista em Itapetininga-SP (OAB/SP 431.515)"
                width={720}
                height={960}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1120] via-[#0a1120]/40 to-transparent p-5 pt-16">
                <p className="text-lg font-bold text-white">Gustavo Roberto de Camargo</p>
                <p className="text-sm text-brand-300">Advogado Criminalista · OAB/SP 431.515</p>
              </div>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
              <IconShield className="h-3.5 w-3.5" /> Quem vai cuidar do seu caso
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Atendimento próximo, técnico e reservado</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              Advocacia dedicada ao Direito Criminal, com atuação em Itapetininga e nas
              comarcas da região. O foco é acompanhar de perto cada etapa — desde a audiência
              de custódia — buscando o relaxamento da prisão ilegal, a liberdade provisória ou
              as medidas cautelares mais adequadas ao caso.
            </p>
            <p className="mt-3 leading-relaxed text-slate-300">
              Você fala diretamente com o advogado, com clareza sobre o que está acontecendo e
              total sigilo do início ao fim.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {["OAB/SP 431.515", "Itapetininga e região", "Foco em Direito Criminal", "Atendimento 24h"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0d1526] px-3.5 py-1.5 text-sm text-slate-200">
                  <IconCheck className="h-3.5 w-3.5 text-brand-400" /> {t}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-base font-extrabold text-[#0a1120] shadow-xl shadow-emerald-500/25 transition hover:brightness-105"
              >
                <IconWhats className="h-5 w-5" /> Falar no WhatsApp
              </a>
              <a
                href={GOOGLE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-xl border border-white/20 px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/5"
              >
                <IconStar className="h-5 w-5 text-brand-400" /> Ver avaliações no Google
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PASSO A PASSO */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">O que fazer agora</h2>
            <p className="mt-3 text-slate-300">Três passos simples para falar com o advogado.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", t: "Chame no WhatsApp", d: "Toque no botão e envie uma mensagem. O atendimento é direto e sigiloso." },
              { n: "2", t: "Conte o que aconteceu", d: "Explique a situação: quem foi preso, quando e onde. Cada detalhe ajuda." },
              { n: "3", t: "Atuação imediata", d: "Recebendo os dados, o escritório orienta os próximos passos com agilidade." },
            ].map((p) => (
              <div key={p.n} className="relative rounded-2xl border border-white/10 bg-[#0d1526] p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-lg font-extrabold text-[#0a1120]">
                  {p.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href={WHATS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-7 py-4 text-base font-extrabold text-[#0a1120] shadow-xl shadow-emerald-500/25 transition hover:brightness-105"
            >
              <IconWhats className="h-5 w-5" /> Falar com o advogado agora
            </a>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <IconClock className="h-6 w-6" />, t: "Resposta rápida", d: "Atendimento imediato, inclusive fora do horário comercial, quando o tempo é curto." },
            { icon: <IconPin className="h-6 w-6" />, t: "Atuação local", d: "Escritório em Itapetininga, com atuação nas comarcas da região." },
            { icon: <IconScale className="h-6 w-6" />, t: "Foco em criminal", d: "Dedicação ao Direito Penal e ao Processo Penal." },
            { icon: <IconShield className="h-6 w-6" />, t: "Contato direto", d: "Comunicação clara e reservada, diretamente com o advogado." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-[#0d1526] p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-400">{c.icon}</span>
              <h3 className="mt-4 text-base font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REGIÃO ATENDIDA */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Itapetininga e região</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Atendimento à cidade de Itapetininga e às comarcas vizinhas. Se você não vê sua
            cidade na lista, fale conosco mesmo assim.
          </p>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {REGIAO.map((c) => (
              <span key={c} className="rounded-full border border-white/10 bg-[#0d1526] px-4 py-2 text-sm text-slate-200">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {[
            {
              q: "O que é a audiência de custódia?",
              a: "É a apresentação da pessoa presa a um juiz, logo após a prisão, para que se avalie a legalidade da prisão e se a pessoa responderá presa ou em liberdade, com ou sem medidas cautelares.",
            },
            {
              q: "Em quanto tempo ela acontece?",
              a: "Em regra, em até 24 horas após a prisão em flagrante, conforme o art. 310 do Código de Processo Penal. Por isso a agilidade é importante.",
            },
            {
              q: "Vocês atendem fim de semana e feriado?",
              a: "A prisão pode ocorrer a qualquer momento. Envie sua mensagem pelo WhatsApp e o escritório responderá com a maior brevidade possível.",
            },
            {
              q: "Preciso ir até o escritório para começar?",
              a: "Não necessariamente. O primeiro contato pode ser feito pelo WhatsApp ou por telefone. A partir daí, o advogado orienta os próximos passos.",
            },
            {
              q: "Qual o valor dos honorários?",
              a: "Cada caso é único. Os honorários são informados de forma reservada, após entender a situação. Fale pelo WhatsApp para uma orientação inicial.",
            },
            {
              q: "O atendimento é sigiloso?",
              a: "Sim. A relação entre cliente e advogado é protegida pelo sigilo profissional. Tudo o que você contar é tratado com total reserva.",
            },
          ].map((f) => (
            <details key={f.q} className="group rounded-xl border border-white/10 bg-[#0d1526] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                {f.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/20 text-brand-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CONTATO / CTA FINAL */}
      <section id="contato" className="border-t border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl border border-brand-400/20 bg-[#0d1526] p-8 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Fale agora com o <span className="text-brand-400">advogado</span>
                </h2>
                <p className="mt-3 text-slate-300">
                  Se alguém foi preso em Itapetininga ou na região, não espere. Envie uma
                  mensagem e receba orientação imediata.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={WHATS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-4 text-base font-extrabold text-[#0a1120] shadow-xl shadow-emerald-500/25 transition hover:brightness-105"
                  >
                    <IconWhats className="h-5 w-5" /> Chamar no WhatsApp
                  </a>
                  <a
                    href={TEL_CEL.replace("+", "tel:+")}
                    className="flex items-center justify-center gap-2.5 rounded-xl border border-white/20 px-6 py-4 text-base font-bold text-white transition hover:bg-white/5"
                  >
                    <IconPhone className="h-5 w-5 text-brand-400" /> Ligar agora
                  </a>
                </div>
              </div>
              <div className="space-y-4 lg:border-l lg:border-white/10 lg:pl-10">
                <a href={WHATS_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconWhats className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">WhatsApp / Celular</span>(15) 99605-5581</span>
                </a>
                <a href={TEL_FIXO.replace("+", "tel:+")} className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconPhone className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">Telefone fixo</span>(15) 3272-3072</span>
                </a>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconMail className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">E-mail</span>{EMAIL}</span>
                </a>
                <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconPin className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">Escritório</span>Rua Monsenhor Soares, 647 — Centro, Itapetininga/SP</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-white/10 bg-[#080e1a]">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
              <IconScale className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold">Gustavo Roberto de Camargo — Advocacia Criminal</p>
            <p className="text-xs text-slate-400">
              OAB/SP 431.515 • Rua Monsenhor Soares, 647, Centro — Itapetininga/SP — CEP 18.200-009
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-[11px] leading-relaxed text-slate-500">
              Conteúdo de caráter informativo, em conformidade com o Código de Ética e Disciplina
              da OAB e o Provimento nº 205/2021. Não constitui oferta, captação de clientela ou
              promessa de resultado. Os resultados dependem das particularidades de cada caso e da
              decisão do Poder Judiciário.
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              © {new Date().getFullYear()} Gustavo Camargo Advocacia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Botão flutuante de WhatsApp */}
      <a
        href={WHATS_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 font-bold text-[#0a1120] shadow-2xl shadow-emerald-500/40 transition hover:brightness-105"
      >
        <IconWhats className="h-6 w-6" />
        <span className="hidden sm:inline">Fale conosco</span>
      </a>
    </div>
  );
}
