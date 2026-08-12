// Gerador de arte para redes sociais (Instagram) — desenha o card num <canvas>.
//
// Layout inspirado nos perfis jurídicos consolidados: tarja de cor no topo,
// foto de fundo que se dissolve no escuro, manchete gigante em caixa alta,
// linha de apoio (com trechos em destaque) e assinatura com a foto do autor.
//
// Sem dependências: tudo é desenhado na mão com a API 2D do canvas, então
// funciona offline e não estoura o tamanho do site.

export type FormatoCard = "feed" | "quadrado" | "story";

export const FORMATOS: Record<FormatoCard, { w: number; h: number; rotulo: string }> = {
  feed: { w: 1080, h: 1350, rotulo: "Feed 4:5" },
  quadrado: { w: 1080, h: 1080, rotulo: "Quadrado 1:1" },
  story: { w: 1080, h: 1920, rotulo: "Story 9:16" },
};

const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FUNDO = "#080d18";

export interface OpcoesCard {
  titulo: string;
  subtitulo?: string;
  etiqueta?: string;
  formato: FormatoCard;
  imagemFundo?: HTMLImageElement | null;
  fotoAutor?: HTMLImageElement | null;
  nome: string;
  credencial: string;
  destaque: string;
}

// Retângulo de cantos arredondados (feito à mão: ctx.roundRect é recente).
function retanguloRedondo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Texto: trechos entre *asteriscos* saem na cor de destaque.
// ---------------------------------------------------------------------------
interface Palavra {
  txt: string;
  destaque: boolean;
}

function fatiar(texto: string): Palavra[] {
  const partes = texto.split(/(\*[^*]+\*)/g).filter(Boolean);
  const out: Palavra[] = [];
  for (const p of partes) {
    const marcado = p.length > 2 && p.startsWith("*") && p.endsWith("*");
    const limpo = marcado ? p.slice(1, -1) : p;
    for (const w of limpo.split(/\s+/).filter(Boolean)) out.push({ txt: w, destaque: marcado });
  }
  return out;
}

function quebrar(ctx: CanvasRenderingContext2D, palavras: Palavra[], larguraMax: number): Palavra[][] {
  const linhas: Palavra[][] = [];
  let linha: Palavra[] = [];
  let largura = 0;
  const espaco = ctx.measureText(" ").width;
  for (const p of palavras) {
    const w = ctx.measureText(p.txt).width;
    if (linha.length && largura + espaco + w > larguraMax) {
      linhas.push(linha);
      linha = [p];
      largura = w;
    } else {
      largura += (linha.length ? espaco : 0) + w;
      linha.push(p);
    }
  }
  if (linha.length) linhas.push(linha);
  return linhas;
}

function desenharLinha(
  ctx: CanvasRenderingContext2D,
  linha: Palavra[],
  x: number,
  y: number,
  corBase: string,
  corDestaque: string
) {
  const espaco = ctx.measureText(" ").width;
  let cursor = x;
  for (const p of linha) {
    ctx.fillStyle = p.destaque ? corDestaque : corBase;
    ctx.fillText(p.txt, cursor, y);
    cursor += ctx.measureText(p.txt).width + espaco;
  }
}

// Desenha a imagem cobrindo o retângulo (recorte central), sem distorcer.
function cobrir(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const escala = Math.max(w / img.width, h / img.height);
  const nw = img.width * escala;
  const nh = img.height * escala;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - nw) / 2, y + (h - nh) / 2, nw, nh);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Desenho principal
// ---------------------------------------------------------------------------
export function desenharCard(canvas: HTMLCanvasElement, o: OpcoesCard) {
  const { w: W, h: H } = FORMATOS[o.formato];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const margem = Math.round(W * 0.067); // 72 em 1080
  const larguraTexto = W - margem * 2;
  const alturaTarja = Math.round(W * 0.017);

  // 1) fundo
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, W, H);

  const temFoto = Boolean(o.imagemFundo);

  // 2) medir o bloco de texto, encolhendo até caber.
  //    Sem foto sobra muito mais espaço, então o texto pode crescer.
  let tamTitulo = Math.round(W * (temFoto ? 0.086 : 0.098));
  let tamSub = Math.round(W * (temFoto ? 0.039 : 0.042));
  const alturaMax = H * (temFoto ? 0.42 : 0.62);
  const MAX_LINHAS_SUB = temFoto ? 4 : 6;

  const medir = () => {
    ctx.font = `800 ${tamTitulo}px ${FONTE}`;
    const linhasT = quebrar(ctx, fatiar(o.titulo.toUpperCase()), larguraTexto);
    ctx.font = `500 ${tamSub}px ${FONTE}`;
    let linhasS = o.subtitulo?.trim() ? quebrar(ctx, fatiar(o.subtitulo), larguraTexto) : [];
    // corta o excesso para a arte não virar um texto corrido
    if (linhasS.length > MAX_LINHAS_SUB) {
      linhasS = linhasS.slice(0, MAX_LINHAS_SUB).map((l, i) =>
        i === MAX_LINHAS_SUB - 1 ? [...l.slice(0, -1), { ...l[l.length - 1], txt: `${l[l.length - 1].txt}…` }] : l
      );
    }
    const hT = linhasT.length * tamTitulo * 1.08;
    const hS = linhasS.length * tamSub * 1.34;
    return { linhasT, linhasS, altura: hT + (linhasS.length ? tamSub * 0.75 + hS : 0) };
  };

  // Maior palavra da manchete: se não couber numa linha, ela vazaria da arte
  // (e palavras enormes ainda geram linhas órfãs feias).
  const maiorPalavra = () => {
    ctx.font = `800 ${tamTitulo}px ${FONTE}`;
    return fatiar(o.titulo.toUpperCase()).reduce((m, p) => Math.max(m, ctx.measureText(p.txt).width), 0);
  };

  let bloco = medir();
  const tamMinimo = Math.round(W * 0.045);
  // "SE" sozinho na primeira linha fica feio: encolhe um pouco até juntar.
  const orfaNoComeco = () =>
    bloco.linhasT.length > 1 && bloco.linhasT[0].length === 1 && bloco.linhasT[0][0].txt.length <= 4;

  while (
    (bloco.altura > alturaMax || maiorPalavra() > larguraTexto * 0.95 || orfaNoComeco()) &&
    tamTitulo > tamMinimo
  ) {
    tamTitulo -= 3;
    tamSub = Math.max(Math.round(W * 0.028), tamSub - 1);
    bloco = medir();
  }

  const alturaAssinatura = Math.round(H * 0.135);
  const respiro = Math.round(H * 0.045);
  // onde termina a área nobre do topo (tarja + etiqueta)
  const topoLivre = alturaTarja + Math.round(H * (o.etiqueta?.trim() ? 0.115 : 0.05));

  // 3) fundo: foto ou composição da marca
  let inicioTexto: number;
  if (o.imagemFundo) {
    let fimFoto = H - alturaAssinatura - bloco.altura - respiro;
    fimFoto = Math.min(Math.max(fimFoto, H * 0.32), H * 0.68);

    cobrir(ctx, o.imagemFundo, 0, alturaTarja, W, fimFoto - alturaTarja);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, alturaTarja, W, fimFoto - alturaTarja);

    // dissolve a base da foto no fundo escuro
    const alturaFade = Math.min(fimFoto - alturaTarja, H * 0.3);
    const fade = ctx.createLinearGradient(0, fimFoto - alturaFade, 0, fimFoto);
    fade.addColorStop(0, "rgba(8,13,24,0)");
    fade.addColorStop(1, FUNDO);
    ctx.fillStyle = fade;
    ctx.fillRect(0, fimFoto - alturaFade, W, alturaFade);

    inicioTexto = fimFoto + respiro;
  } else {
    // Sem foto: fundo com profundidade + marca d'água jurídica, e o texto
    // centralizado no espaço livre (nada de vazio no topo).
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#16243f");
    g.addColorStop(0.55, "#0d1526");
    g.addColorStop(1, "#070b14");
    ctx.fillStyle = g;
    ctx.fillRect(0, alturaTarja, W, H - alturaTarja);

    // brilho suave atrás da manchete
    const brilho = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.85);
    brilho.addColorStop(0, "rgba(255,255,255,0.06)");
    brilho.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(0, alturaTarja, W, H - alturaTarja);

    // marca d'água: o símbolo de parágrafo, discreto
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = o.destaque;
    ctx.font = `800 ${Math.round(W * 0.78)}px ${FONTE}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("§", W + W * 0.06, H * 0.3);
    ctx.restore();
    ctx.textAlign = "left";

    const disponivel = H - alturaAssinatura - topoLivre;
    const filete = Math.round(H * 0.035);
    inicioTexto = topoLivre + Math.max(0, (disponivel - bloco.altura - filete) / 2) + filete;

    // filete dourado acima da manchete
    ctx.fillStyle = o.destaque;
    ctx.fillRect(margem, inicioTexto - filete, Math.round(W * 0.13), Math.max(5, Math.round(W * 0.008)));
  }

  // 6) tarja de cor no topo
  ctx.fillStyle = o.destaque;
  ctx.fillRect(0, 0, W, alturaTarja);

  // 6.1) etiqueta de categoria (ex.: STJ, DIREITO PENAL)
  if (o.etiqueta?.trim()) {
    const tamEtq = Math.round(W * 0.026);
    ctx.font = `700 ${tamEtq}px ${FONTE}`;
    ctx.textBaseline = "alphabetic";
    const texto = o.etiqueta.trim().toUpperCase();
    const padX = Math.round(tamEtq * 0.8);
    const padY = Math.round(tamEtq * 0.55);
    const larg = ctx.measureText(texto).width + padX * 2;
    const alt = tamEtq + padY * 2;
    const ex = margem;
    const ey = alturaTarja + Math.round(H * 0.032);
    ctx.fillStyle = o.destaque;
    retanguloRedondo(ctx, ex, ey, larg, alt, Math.round(alt * 0.28));
    ctx.fill();
    ctx.fillStyle = "#0b1020";
    ctx.fillText(texto, ex + padX, ey + padY + tamEtq * 0.82);
  }

  // 7) manchete
  ctx.textBaseline = "alphabetic";
  let y = inicioTexto + tamTitulo * 0.82;
  ctx.font = `800 ${tamTitulo}px ${FONTE}`;
  for (const linha of bloco.linhasT) {
    desenharLinha(ctx, linha, margem, y, "#ffffff", o.destaque);
    y += tamTitulo * 1.08;
  }

  // 8) linha de apoio
  if (bloco.linhasS.length) {
    ctx.font = `500 ${tamSub}px ${FONTE}`;
    y += tamSub * 0.5;
    for (const linha of bloco.linhasS) {
      desenharLinha(ctx, linha, margem, y, "#dbe2ec", o.destaque);
      y += tamSub * 1.34;
    }
  }

  // 9) assinatura: foto redonda + nome + credencial, centralizadas
  const diametro = Math.round(W * 0.085);
  const centroY = H - Math.round(alturaAssinatura * 0.52);
  const tamNome = Math.round(W * 0.031);
  const tamCred = Math.round(W * 0.023);

  ctx.font = `700 ${tamNome}px ${FONTE}`;
  const larguraNome = ctx.measureText(o.nome.toUpperCase()).width;
  ctx.font = `500 ${tamCred}px ${FONTE}`;
  const larguraCred = ctx.measureText(o.credencial).width;

  const temRetrato = Boolean(o.fotoAutor);
  const larguraTextoAss = Math.max(larguraNome, larguraCred);
  const vao = Math.round(W * 0.02);
  const total = (temRetrato ? diametro + vao : 0) + larguraTextoAss;
  const inicio = (W - total) / 2;

  if (o.fotoAutor) {
    const raio = diametro / 2;
    const cx = inicio + raio;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, centroY, raio, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    cobrir(ctx, o.fotoAutor, cx - raio, centroY - raio, diametro, diametro);
    ctx.restore();
    // aro na cor de destaque
    ctx.beginPath();
    ctx.arc(cx, centroY, raio, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(3, Math.round(W * 0.004));
    ctx.strokeStyle = o.destaque;
    ctx.stroke();
  }

  const xTexto = inicio + (temRetrato ? diametro + vao : 0);
  ctx.textAlign = "left";
  ctx.font = `700 ${tamNome}px ${FONTE}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(o.nome.toUpperCase(), xTexto, centroY - tamCred * 0.25);
  ctx.font = `500 ${tamCred}px ${FONTE}`;
  ctx.fillStyle = o.destaque;
  ctx.fillText(o.credencial, xTexto, centroY + tamNome * 0.78);
}

// ---------------------------------------------------------------------------
// Apoio
// ---------------------------------------------------------------------------
export function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`não foi possível carregar ${src}`));
    img.src = src;
  });
}

/** Converte códigos HTML (&#8230;, &amp;…) de volta em texto legível. */
export function decodificarHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&(?:lsquo|rsquo|apos);/g, "'")
    .replace(/&(?:ldquo|rdquo|quot);/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Tira da pauta o prefixo da fonte ("Síntese Criminal: …") para virar manchete. */
export function tituloParaArte(titulo: string): string {
  const limpo = decodificarHtml(titulo);
  const semPrefixo = limpo.replace(/^[A-Za-zÀ-ú][A-Za-zÀ-ú.\s]{2,24}:\s+/, "");
  return (semPrefixo || limpo).replace(/\s+—\s+.*$/, "").trim();
}

/**
 * Prepara o resumo para virar linha de apoio: decodifica códigos HTML, remove
 * o rodapé que os feeds RSS grudam no fim ("O post … apareceu primeiro em …",
 * inclusive quando vem cortado) e encurta na última frase inteira.
 */
export function resumoParaArte(resumo?: string, limite = 230): string {
  if (!resumo) return "";
  const texto = decodificarHtml(resumo)
    .replace(/\[\s*(?:…|\.\.\.)\s*\]/g, " ")
    .replace(/\bO post\b[\s\S]*$/i, "")
    .replace(/\bLeia (?:mais|na íntegra)\b[\s\S]*$/i, "")
    .replace(/\bapareceu primeiro em\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (texto.length <= limite) return texto;

  const corte = texto.slice(0, limite);
  const fimFrase = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("! "), corte.lastIndexOf("? "));
  if (fimFrase > limite * 0.45) return corte.slice(0, fimFrase + 1).trim();
  const fimPalavra = corte.lastIndexOf(" ");
  return `${(fimPalavra > 0 ? corte.slice(0, fimPalavra) : corte).trim()}…`;
}
