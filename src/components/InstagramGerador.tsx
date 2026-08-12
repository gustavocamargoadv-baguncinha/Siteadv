"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Share2, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import {
  desenharCard,
  carregarImagem,
  FORMATOS,
  type FormatoCard,
} from "@/lib/instagram-card";
import { gerarSlug } from "@/lib/blog";

const NOME = "Gustavo Camargo";
const CREDENCIAL = "Advogado criminalista · OAB/SP 431.515";
const FOTO_AUTOR = "/gustavo-autor.jpg";

const CORES: { nome: string; valor: string }[] = [
  { nome: "Dourado", valor: "#d99a26" },
  { nome: "Laranja", valor: "#f4511e" },
  { nome: "Vermelho", valor: "#dc2626" },
  { nome: "Azul", valor: "#2563eb" },
  { nome: "Verde", valor: "#059669" },
];

// Gera a arte de divulgação (Instagram) a partir de uma pauta ou de um post.
export function InstagramGerador({
  aberto,
  onFechar,
  tituloInicial,
  subtituloInicial,
  etiquetaInicial,
}: {
  aberto: boolean;
  onFechar: () => void;
  tituloInicial: string;
  subtituloInicial?: string;
  etiquetaInicial?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [titulo, setTitulo] = useState(tituloInicial);
  const [subtitulo, setSubtitulo] = useState(subtituloInicial ?? "");
  const [etiqueta, setEtiqueta] = useState(etiquetaInicial ?? "");
  const [formato, setFormato] = useState<FormatoCard>("feed");
  const [cor, setCor] = useState(CORES[0].valor);
  const [comAutor, setComAutor] = useState(true);
  const [fundoUrl, setFundoUrl] = useState<string | null>(null);
  const [imgFundo, setImgFundo] = useState<HTMLImageElement | null>(null);
  const [imgAutor, setImgAutor] = useState<HTMLImageElement | null>(null);
  const [baixado, setBaixado] = useState(false);

  // Reabre sempre com os dados do item escolhido.
  useEffect(() => {
    if (aberto) {
      setTitulo(tituloInicial);
      setSubtitulo(subtituloInicial ?? "");
      setEtiqueta(etiquetaInicial ?? "");
      setBaixado(false);
    }
  }, [aberto, tituloInicial, subtituloInicial, etiquetaInicial]);

  useEffect(() => {
    carregarImagem(FOTO_AUTOR)
      .then(setImgAutor)
      .catch(() => setImgAutor(null));
  }, []);

  useEffect(() => {
    if (!fundoUrl) {
      setImgFundo(null);
      return;
    }
    carregarImagem(fundoUrl)
      .then(setImgFundo)
      .catch(() => setImgFundo(null));
  }, [fundoUrl]);

  // Redesenha a arte a cada ajuste.
  useEffect(() => {
    if (!aberto || !canvasRef.current) return;
    desenharCard(canvasRef.current, {
      titulo,
      subtitulo,
      etiqueta,
      formato,
      imagemFundo: imgFundo,
      fotoAutor: comAutor ? imgAutor : null,
      nome: NOME,
      credencial: CREDENCIAL,
      destaque: cor,
    });
  }, [aberto, titulo, subtitulo, etiqueta, formato, cor, comAutor, imgFundo, imgAutor]);

  const escolherFundo = (arquivo?: File) => {
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setFundoUrl(String(leitor.result));
    leitor.readAsDataURL(arquivo);
  };

  const comBlob = useCallback((acao: (b: Blob) => void) => {
    canvasRef.current?.toBlob((b) => b && acao(b), "image/png");
  }, []);

  const baixar = () =>
    comBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gerarSlug(titulo).slice(0, 50) || "post"}-instagram.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBaixado(true);
      setTimeout(() => setBaixado(false), 2500);
    });

  const compartilhar = () =>
    comBlob(async (blob) => {
      const arquivo = new File([blob], "radar-penal.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo], text: titulo });
        } catch {
          /* cancelado pelo usuário */
        }
      } else {
        baixar();
      }
    });

  const podeCompartilhar = typeof navigator !== "undefined" && "canShare" in navigator;

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Arte para Instagram" largo>
      <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
        {/* pré-visualização */}
        <div>
          <canvas
            ref={canvasRef}
            className="mx-auto max-h-[52vh] w-auto max-w-full rounded-xl shadow-lg ring-1 ring-slate-200"
          />
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {FORMATOS[formato].w}×{FORMATOS[formato].h}px — prévia
          </p>
        </div>

        {/* controles */}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Manchete</span>
            <textarea
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Linha de apoio <span className="font-normal text-slate-400">— use *asteriscos* para destacar</span>
            </span>
            <textarea
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Etiqueta</span>
              <input
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="STJ, Tráfico…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Formato</span>
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value as FormatoCard)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {(Object.keys(FORMATOS) as FormatoCard[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMATOS[f].rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Cor de destaque</span>
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button
                  key={c.valor}
                  onClick={() => setCor(c.valor)}
                  title={c.nome}
                  aria-label={c.nome}
                  className={`h-8 w-8 rounded-full ring-offset-2 transition ${cor === c.valor ? "ring-2 ring-slate-900" : "ring-1 ring-slate-200"}`}
                  style={{ backgroundColor: c.valor }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus size={15} />
              {fundoUrl ? "Trocar foto de fundo" : "Foto de fundo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => escolherFundo(e.target.files?.[0])}
              />
            </label>
            {fundoUrl && (
              <button
                onClick={() => setFundoUrl(null)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                <Trash2 size={15} /> Remover
              </button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={comAutor} onChange={(e) => setComAutor(e.target.checked)} />
              Minha foto na assinatura
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={baixar}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Download size={16} /> {baixado ? "Baixado!" : "Baixar imagem"}
            </button>
            {podeCompartilhar && (
              <button
                onClick={compartilhar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Share2 size={16} /> Compartilhar
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            No celular, “Compartilhar” manda direto para o Instagram. No computador, baixe a imagem e
            publique pelo aplicativo.
          </p>
        </div>
      </div>
    </Modal>
  );
}
