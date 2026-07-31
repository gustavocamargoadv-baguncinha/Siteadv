"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Send, Linkedin, MessageCircle, Share2 } from "lucide-react";
import { Modal } from "./Modal";

// Monta uma legenda pronta para rede social a partir do título e do resumo.
export function montarLegenda(titulo: string, resumo: string | undefined, url: string): string {
  const corpo = [titulo.trim(), (resumo ?? "").trim()].filter(Boolean).join("\n\n");
  return `${corpo}\n\nLeia mais: ${url}\n\n#DireitoPenal #ProcessoPenal #Advocacia`;
}

// Modal de compartilhamento: legenda editável + botões para WhatsApp, X,
// Telegram, LinkedIn, compartilhar nativo (celular) e copiar.
export function CompartilharModal({
  aberto,
  onFechar,
  titulo,
  resumo,
  url,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  resumo?: string;
  url: string;
}) {
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Reinicia a legenda sempre que abrir para um item diferente.
  useEffect(() => {
    if (aberto) {
      setTexto(montarLegenda(titulo, resumo, url));
      setCopiado(false);
    }
  }, [aberto, titulo, resumo, url]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — o usuário pode selecionar manualmente */
    }
  }

  async function compartilharNativo() {
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, url });
      } catch {
        /* cancelado */
      }
    }
  }

  const t = encodeURIComponent(texto);
  const u = encodeURIComponent(url);

  const redes = [
    { nome: "WhatsApp", href: `https://wa.me/?text=${t}`, icone: <MessageCircle size={16} />, cor: "bg-emerald-600 hover:bg-emerald-700" },
    { nome: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${t}`, icone: <Share2 size={16} />, cor: "bg-slate-900 hover:bg-black" },
    { nome: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}`, icone: <Send size={16} />, cor: "bg-sky-600 hover:bg-sky-700" },
    { nome: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icone: <Linkedin size={16} />, cor: "bg-blue-700 hover:bg-blue-800" },
  ];

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Compartilhar em rede social">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Legenda (edite à vontade)</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={7}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copiado ? "Copiado!" : "Copiar texto"}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={compartilharNativo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Share2 size={16} /> Compartilhar…
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">Postar direto em:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {redes.map((r) => (
              <a
                key={r.nome}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white ${r.cor}`}
              >
                {r.icone} {r.nome}
              </a>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            No LinkedIn, cole a legenda copiada — ele importa só o link automaticamente.
          </p>
        </div>
      </div>
    </Modal>
  );
}
