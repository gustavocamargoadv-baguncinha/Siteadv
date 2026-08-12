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

  // 2) medir o bloco de texto, encolhendo até caber
  let tamTitulo = Math.round(W * 0.086);
  let tamSub = Math.round(W * 0.039);
  const alturaMax = H * 0.42;

  const medir = () => {
    ctx.font = `800 ${tamTitulo}px ${FONTE}`;
    const linhasT = quebrar(ctx, fatiar(o.titulo.toUpperCase()), larguraTexto);
    ctx.font = `500 ${tamSub}px ${FONTE}`;
    const linhasS = o.subtitulo?.trim() ? quebrar(ctx, fatiar(o.subtitulo), larguraTexto) : [];
    const hT = linhasT.length * tamTitulo * 1.08;
    const hS = linhasS.length * tamSub * 1.34;
    return { linhasT, linhasS, altura: hT + (linhasS.length ? tamSub * 0.75 + hS : 0) };
  };

  let bloco = medir();
  while (bloco.altura > alturaMax && tamTitulo > Math.round(W * 0.045)) {
    tamTitulo -= 3;
    tamSub = Math.max(Math.round(W * 0.028), tamSub - 1);
    bloco = medir();
  }

  // 3) posições: assinatura embaixo, texto acima dela, foto ocupando o resto
  const alturaAssinatura = Math.round(H * 0.135);
  const respiro = Math.round(H * 0.045);
  let fimFoto = H - alturaAssinatura - bloco.altura - respiro;
  fimFoto = Math.min(Math.max(fimFoto, H * 0.32), H * 0.68);

  // 4) foto de fundo (ou gradiente da marca quando não houver)
  if (o.imagemFundo) {
    cobrir(ctx, o.imagemFundo, 0, alturaTarja, W, fimFoto - alturaTarja);
    // leve escurecida geral para a manchete respirar
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, alturaTarja, W, fimFoto - alturaTarja);
  } else {
    const g = ctx.createLinearGradient(0, alturaTarja, W, fimFoto);
    g.addColorStop(0, "#13203a");
    g.addColorStop(1, "#0a1120");
    ctx.fillStyle = g;
    ctx.fillRect(0, alturaTarja, W, fimFoto - alturaTarja);
  }

  // 5) dissolve a base da foto no fundo escuro
  const alturaFade = Math.min(fimFoto - alturaTarja, H * 0.3);
  const fade = ctx.createLinearGradient(0, fimFoto - alturaFade, 0, fimFoto);
  fade.addColorStop(0, "rgba(8,13,24,0)");
  fade.addColorStop(1, FUNDO);
  ctx.fillStyle = fade;
  ctx.fillRect(0, fimFoto - alturaFade, W, alturaFade);

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
  let y = fimFoto + respiro + tamTitulo * 0.82;
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

  const temFoto = Boolean(o.fotoAutor);
  const larguraTextoAss = Math.max(larguraNome, larguraCred);
  const vao = Math.round(W * 0.02);
  const total = (temFoto ? diametro + vao : 0) + larguraTextoAss;
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

  const xTexto = inicio + (temFoto ? diametro + vao : 0);
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

/** Tira da pauta o prefixo da fonte ("Síntese Criminal: …") para virar manchete. */
export function tituloParaArte(titulo: string): string {
  const semPrefixo = titulo.replace(/^[A-Za-zÀ-ú][A-Za-zÀ-ú.\s]{2,24}:\s+/, "");
  return (semPrefixo || titulo).replace(/\s+—\s+.*$/, "").trim();
}

/** Limpa rodapés de RSS ("O post … apareceu primeiro em …") do resumo. */
export function resumoParaArte(resumo?: string): string {
  if (!resumo) return "";
  return resumo
    .replace(/O post .*?apareceu primeiro em .*?\.?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
