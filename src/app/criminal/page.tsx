import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import {
  ADVOGADO,
  EMAIL,
  ENDERECO,
  FOTO_ADVOGADO,
  GOOGLE_LINK,
  IconAlert,
  IconCar,
  IconCheck,
  IconClock,
  IconFile,
  IconGavel,
  IconLock,
  IconMail,
  IconPhone,
  IconPin,
  IconScale,
  IconShield,
  IconStar,
  IconUsers,
  IconWhats,
  MAPS_LINK,
  OAB,
  REGIAO,
  SITE_URL,
  TEL_CEL,
  whatsLink,
} from "../_landing/comum";

/* -------------------------------------------------------------------------
   Landing page de captação — Advogado Criminalista (geral) em Itapetininga.
   Destino das buscas amplas ("advogado criminal", "advogado criminalista"),
   que têm intenção mais variada que a audiência de custódia. Quem chega com
   urgência de prisão é encaminhado para a landing de custódia.
   Publicidade conforme o Provimento OAB 205/2021: informativa, sóbria, sem
   promessa de resultado.
   ------------------------------------------------------------------------- */

// Mensagem própria desta página — assim dá para saber de onde veio o contato.
const WHATS_LINK = whatsLink(
  "Olá, Dr. Gustavo. Vim pelo site e preciso de um advogado criminalista em Itapetininga e região.",
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "Advogado Criminalista em Itapetininga-SP | Gustavo Camargo — Defesa Criminal",
  description:
    "Advogado criminalista em Itapetininga e região. Defesa em inquéritos, processos criminais, júri, execução penal, habeas corpus e recursos. Atendimento reservado e contato direto com o advogado. Fale no WhatsApp. Gustavo Roberto de Camargo — OAB/SP 431.515.",
  keywords: [
    "advogado criminalista Itapetininga",
    "advogado criminal Itapetininga",
    "escritório de advocacia criminal Itapetininga",
    "advogado criminal Itapetininga e região",
    "advogado habeas corpus Itapetininga",
    "advogado tribunal do júri Itapetininga",
    "advogado execução penal Itapetininga",
    "defesa criminal Itapetininga",
  ],
  alternates: { canonical: "/criminal" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Advogado Criminalista em Itapetininga | Gustavo Camargo Advocacia",
    description:
      "Defesa criminal em todas as fases: inquérito, processo, júri, recursos e execução penal. Contato direto com o advogado.",
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
    "Advogado criminalista em Itapetininga-SP. Defesa em inquéritos policiais, processos criminais, tribunal do júri, habeas corpus, recursos e execução penal.",
  founder: ADVOGADO,
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
    "Direito penal",
    "Processo penal",
    "Tribunal do júri",
    "Execução penal",
    "Habeas corpus",
    "Audiência de custódia",
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

const SITUACOES = [
  {
    icon: <IconAlert className="h-6 w-6" />,
    titulo: "Alguém foi preso agora",
    texto:
      "Prisão recente exige atuação imediata: a audiência de custódia ocorre em até 24 horas.",
    link: "/custodia",
    linkTexto: "Ver atendimento de urgência",
  },
  {
    icon: <IconFile className="h-6 w-6" />,
    titulo: "Recebi uma intimação",
    texto:
      "Intimação de delegacia ou do fórum tem prazo. A orientação certa desde o início evita prejuízo à defesa.",
  },
  {
    icon: <IconGavel className="h-6 w-6" />,
    titulo: "Respondo a um processo",
    texto:
      "Acompanhamento em todas as fases: resposta à acusação, audiências, alegações finais e recursos.",
  },
  {
    icon: <IconLock className="h-6 w-6" />,
    titulo: "Já fui condenado",
    texto:
      "Execução penal e recursos: progressão de regime, livramento condicional, remição e apelação.",
  },
];

const AREAS = [
  { icon: <IconShield className="h-5 w-5" />, t: "Inquérito policial", d: "Acompanhamento desde a fase de investigação." },
  { icon: <IconAlert className="h-5 w-5" />, t: "Prisões e liberdade", d: "Custódia, liberdade provisória e medidas cautelares." },
  { icon: <IconUsers className="h-5 w-5" />, t: "Tribunal do júri", d: "Defesa em crimes dolosos contra a vida." },
  { icon: <IconFile className="h-5 w-5" />, t: "Habeas corpus", d: "Impetração e acompanhamento nos tribunais." },
  { icon: <IconGavel className="h-5 w-5" />, t: "Recursos criminais", d: "Apelação, agravo e recursos aos tribunais superiores." },
  { icon: <IconLock className="h-5 w-5" />, t: "Execução penal", d: "Progressão, livramento condicional e remição de pena." },
  { icon: <IconCar className="h-5 w-5" />, t: "Crimes de trânsito", d: "Embriaguez ao volante, lesão e homicídio culposo." },
  { icon: <IconScale className="h-5 w-5" />, t: "Demais crimes", d: "Patrimoniais, contra a pessoa, tráfico e violência doméstica." },
];

export default function CriminalLanding() {
  return (
    <div className="min-h-dvh scroll-smooth bg-[#0a1120] text-slate-100 antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Analytics />

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
              <IconShield className="h-3.5 w-3.5" /> Defesa criminal • Itapetininga e região
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Advogado criminalista em
              <span className="mt-2 block text-brand-400">Itapetininga e região</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Responder a uma acusação criminal não precisa ser um caminho solitário.
              Defesa técnica em <strong className="text-white">todas as fases</strong> —
              do inquérito ao recurso — com atendimento reservado e contato direto
              com o advogado.
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
              <span className="inline-flex items-center gap-1.5"><IconShield className="h-4 w-4 text-brand-400" /> {ADVOGADO} — {OAB}</span>
              <span className="inline-flex items-center gap-1.5"><IconPin className="h-4 w-4 text-brand-400" /> Escritório no Centro de Itapetininga</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA DE URGÊNCIA -> landing de custódia */}
      <section className="border-y border-brand-400/20 bg-brand-500/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row">
          <p className="flex items-center gap-2.5 text-center text-sm text-slate-200 sm:text-left">
            <IconClock className="h-5 w-5 shrink-0 text-brand-400" />
            <span>
              <strong className="text-white">Alguém foi preso agora?</strong> A audiência de
              custódia acontece em até 24 horas — o atendimento é imediato.
            </span>
          </p>
          <a
            href="/custodia"
            className="shrink-0 rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2.5 text-sm font-bold text-brand-300 transition hover:bg-brand-500/20"
          >
            Atendimento de urgência →
          </a>
        </div>
      </section>

      {/* EM QUE SITUAÇÃO VOCÊ ESTÁ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Em que situação você está?</h2>
          <p className="mt-3 text-slate-300">
            Cada momento do processo criminal exige uma atuação diferente. Veja qual é o seu.
          </p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          {SITUACOES.map((s) => (
            <div key={s.titulo} className="rounded-2xl border border-white/10 bg-[#0d1526] p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
                {s.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.texto}</p>
              {s.link ? (
                <a href={s.link} className="mt-3 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300">
                  {s.linkTexto} →
                </a>
              ) : (
                <a
                  href={WHATS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
                >
                  Falar sobre o meu caso →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ÁREAS DE ATUAÇÃO */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Áreas de atuação</h2>
            <p className="mt-3 text-slate-300">
              Atuação dedicada ao Direito Penal e ao Processo Penal.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map((a) => (
              <div key={a.t} className="rounded-2xl border border-white/10 bg-[#0d1526] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
                  {a.icon}
                </span>
                <h3 className="mt-3.5 text-base font-semibold">{a.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{a.d}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
            O resultado de cada caso depende das circunstâncias concretas e da decisão do
            Poder Judiciário. Este conteúdo tem caráter meramente informativo e não representa
            promessa de resultado.
          </p>
        </div>
      </section>

      {/* O ADVOGADO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FOTO_ADVOGADO}
              alt={`${ADVOGADO}, advogado criminalista em Itapetininga-SP (${OAB})`}
              width={720}
              height={960}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1120] via-[#0a1120]/40 to-transparent p-5 pt-16">
              <p className="text-lg font-bold text-white">{ADVOGADO}</p>
              <p className="text-sm text-brand-300">Advogado Criminalista · {OAB}</p>
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
            comarcas da região. Cada caso é acompanhado de perto, com análise dos autos e
            definição de estratégia de defesa junto ao cliente.
          </p>
          <p className="mt-3 leading-relaxed text-slate-300">
            Você fala diretamente com o advogado, entende em que pé está o processo e o que
            vem a seguir — com total sigilo do início ao fim.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {[OAB, "Itapetininga e região", "Foco em Direito Criminal", "Atendimento 24h"].map((t) => (
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
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Como funciona o atendimento</h2>
            <p className="mt-3 text-slate-300">Três passos simples para começar.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", t: "Você entra em contato", d: "Pelo WhatsApp ou telefone. O primeiro contato é direto e sigiloso." },
              { n: "2", t: "Análise do caso", d: "Entendemos a situação e os documentos para definir a estratégia de defesa." },
              { n: "3", t: "Atuação técnica", d: "Acompanhamento do processo com informação clara sobre cada etapa." },
            ].map((p) => (
              <div key={p.n} className="rounded-2xl border border-white/10 bg-[#0d1526] p-6 text-center">
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

      {/* REGIÃO */}
      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
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
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "Recebi uma intimação da delegacia. O que faço?",
                a: "Antes de prestar depoimento, procure orientação. O acompanhamento por advogado desde a fase de inquérito ajuda a preservar seus direitos e a evitar prejuízos à defesa.",
              },
              {
                q: "Preciso de advogado mesmo antes de ser processado?",
                a: "Na fase de investigação já é possível atuar: acompanhar depoimentos, requerer diligências e apresentar esclarecimentos. Quanto antes, melhor a construção da defesa.",
              },
              {
                q: "Vocês atendem em outras comarcas da região?",
                a: "Sim. O escritório fica em Itapetininga e atua também nas comarcas vizinhas. Fale conosco para confirmar o seu caso.",
              },
              {
                q: "Qual o valor dos honorários?",
                a: "Cada caso é único e os honorários variam conforme a complexidade e a fase do processo. Os valores são informados de forma reservada após entender a situação.",
              },
              {
                q: "O atendimento é sigiloso?",
                a: "Sim. A relação entre cliente e advogado é protegida pelo sigilo profissional. Tudo o que você contar é tratado com total reserva.",
              },
              {
                q: "Já fui condenado. Ainda dá para fazer algo?",
                a: "Dependendo do caso, cabem recursos e pedidos na execução penal, como progressão de regime, livramento condicional e remição de pena. Vale analisar a situação concreta.",
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
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl border border-brand-400/20 bg-[#0d1526] p-8 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Fale agora com o <span className="text-brand-400">advogado</span>
                </h2>
                <p className="mt-3 text-slate-300">
                  Conte o que está acontecendo e receba orientação sobre os próximos passos.
                  Atendimento reservado.
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
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconMail className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">E-mail</span>{EMAIL}</span>
                </a>
                <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-200 transition hover:text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400"><IconPin className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-slate-400">Escritório</span>{ENDERECO}</span>
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
            <p className="text-sm font-bold">{ADVOGADO} — Advocacia Criminal</p>
            <p className="text-xs text-slate-400">
              {OAB} • {ENDERECO} — CEP 18.200-009
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
