// Utilidades do blog, seguras para rodar no cliente.

import type { FontePauta } from "./types";

/** Gera o "slug" (parte do endereço) a partir do título. */
export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const ROTULO_FONTE: Record<FontePauta, string> = {
  stf: "STF",
  stj: "STJ",
  camara: "Câmara dos Deputados",
  senado: "Senado Federal",
  blogs: "Blogs consolidados",
};

export const COR_FONTE: Record<FontePauta, "azul" | "roxo" | "verde" | "ambar" | "rosa"> = {
  stf: "azul",
  stj: "roxo",
  camara: "verde",
  senado: "ambar",
  blogs: "rosa",
};

// Renderizador de Markdown mínimo → HTML. Cobre o que a redação usa: títulos,
// negrito, itálico, listas, links e parágrafos. Sem dependências externas.
function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapar(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

export function markdownParaHtml(md: string): string {
  const linhas = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let emLista = false;
  const fecharLista = () => {
    if (emLista) {
      out.push("</ul>");
      emLista = false;
    }
  };

  for (const linha of linhas) {
    const l = linha.trimEnd();
    if (!l.trim()) {
      fecharLista();
      continue;
    }
    if (/^###\s+/.test(l)) {
      fecharLista();
      out.push(`<h3>${inline(l.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(l)) {
      fecharLista();
      out.push(`<h2>${inline(l.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(l)) {
      fecharLista();
      out.push(`<h2>${inline(l.replace(/^#\s+/, ""))}</h2>`);
    } else if (/^[-*]\s+/.test(l)) {
      if (!emLista) {
        out.push("<ul>");
        emLista = true;
      }
      out.push(`<li>${inline(l.replace(/^[-*]\s+/, ""))}</li>`);
    } else {
      fecharLista();
      out.push(`<p>${inline(l)}</p>`);
    }
  }
  fecharLista();
  return out.join("\n");
}
