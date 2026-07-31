"use client";

import { useState } from "react";

// Cartão "Sobre o autor" com foto em recorte circular. Enquanto a foto não
// estiver em public/gustavo-autor.jpg, mostra um monograma elegante no lugar
// (sem link quebrado) — assim que o arquivo existir, a foto aparece sozinha.
export function AutorBio() {
  const [semFoto, setSemFoto] = useState(false);

  return (
    <aside className="mt-12 rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-5 sm:flex sm:items-center sm:gap-5">
      <div className="mx-auto mb-4 h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-brand-200 sm:mx-0 sm:mb-0">
        {semFoto ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-2xl font-bold tracking-tight text-brand-300">
            GC
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/gustavo-autor.jpg"
            alt="Gustavo Roberto de Camargo"
            className="h-full w-full object-cover"
            onError={() => setSemFoto(true)}
          />
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Sobre o autor</p>
        <h3 className="mt-0.5 text-lg font-bold text-slate-900">Gustavo Roberto de Camargo</h3>
        <p className="text-sm font-medium text-slate-500">Advogado criminalista · OAB/SP 431.515</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Dedicado à defesa criminal em todas as fases — do inquérito aos tribunais superiores. No
          Radar Penal, traduz decisões e novidades do direito penal em linguagem direta, sem
          juridiquês.
        </p>
      </div>
    </aside>
  );
}
