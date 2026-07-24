"use client";

import Link from "next/link";
import { Scale } from "lucide-react";

// Moldura pública do blog "Radar Penal" — visual editorial, independente do
// menu do escritório. É o que o visitante vê.
export function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/blog" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Scale size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight">Radar Penal</span>
              <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                Notícias e julgados de direito penal
              </span>
            </span>
          </Link>
          <a
            href="https://wa.me/"
            className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:inline-block"
          >
            Falar com o escritório
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>

      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-8 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Radar Penal — por Gustavo Roberto de Camargo (OAB/SP 431.515)</p>
          <p className="mt-2">
            Conteúdo informativo sobre direito penal, processo penal e execução penal. Não constitui
            aconselhamento jurídico nem substitui a consulta a um advogado. Publicação de caráter
            estritamente informativo, nos termos do Provimento 205/2021 da OAB.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Espaço reservado para anúncio (AdSense). Quando você tiver o código do
// AdSense, é só trocar este bloco pelo <ins class="adsbygoogle"> de verdade.
export function EspacoAnuncio({ rotulo = "Publicidade" }: { rotulo?: string }) {
  return (
    <div className="my-8 flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
      {rotulo}
    </div>
  );
}
