"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { CompartilharModal } from "./CompartilharModal";

// Botão que abre o modal de compartilhamento. Reaproveitado nas pautas e nos
// posts publicados. O visual é controlado por `className`.
export function CompartilharBotao({
  titulo,
  resumo,
  url,
  rotulo = "Compartilhar",
  className = "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",
  iconSize = 14,
}: {
  titulo: string;
  resumo?: string;
  url: string;
  rotulo?: string;
  className?: string;
  iconSize?: number;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button onClick={() => setAberto(true)} className={className}>
        <Share2 size={iconSize} /> {rotulo}
      </button>
      <CompartilharModal
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={titulo}
        resumo={resumo}
        url={url}
      />
    </>
  );
}
