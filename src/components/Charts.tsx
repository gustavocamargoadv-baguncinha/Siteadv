"use client";

// Gráficos em SVG puro — sem biblioteca, para não pesar o bundle do PWA.
// Regras seguidas: traço fino, grade discreta (nunca tracejada), cores da marca
// para magnitude (hue única) e paleta validada para daltonismo nas fases,
// rótulo sempre junto da cor (identidade nunca depende só da cor) e
// tooltip no toque/hover.

import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/format";

/** Mede a largura real do container para desenhar o SVG em escala 1:1 — assim o
 *  texto do eixo tem o mesmo tamanho em px no celular e no desktop (com viewBox
 *  fixo, a fonte encolheria junto com a tela e ficaria ilegível no telefone). */
function useLargura<T extends HTMLElement>(inicial = 640) {
  const ref = useRef<T | null>(null);
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setLargura(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, largura };
}

const EIXO = "#94a3b8"; // slate-400 — texto de eixo, recessivo
const GRADE = "#e2e8f0"; // slate-200 — grade discreta
const MARCA = "#c07d1d"; // brand-600 — hue única de magnitude

/* ------------------------------------------------------------------ *
 * Área — evolução ao longo do tempo (uma série; o título já a nomeia,
 * então não leva legenda).
 * ------------------------------------------------------------------ */
export function GraficoArea({
  pontos,
  rotulos,
  altura = 200,
  ultimoParcial = false,
  onSelecionar,
}: {
  pontos: number[];
  rotulos: string[];
  altura?: number;
  /** O último ponto é o mês em curso (ainda incompleto) — desenhado esmaecido
   *  para não parecer uma queda real na tendência. */
  ultimoParcial?: boolean;
  /** Torna os pontos clicáveis (detalhar o período). Quando ausente, o gráfico
   *  segue só com tooltip — sem cursor de link prometendo algo que não acontece. */
  onSelecionar?: (indice: number) => void;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const { ref, largura } = useLargura<HTMLDivElement>();

  const L = 46, R = 14, T = 14, B = 26; // margens internas
  const W = Math.max(largura, 260);
  const H = altura;
  const larguraPlot = W - L - R;
  const alturaPlot = H - T - B;

  const max = Math.max(...pontos, 0);
  // teto "redondo" para a grade não cair em número quebrado
  const passo = max > 0 ? Math.pow(10, Math.floor(Math.log10(max))) / 2 : 1;
  const teto = max > 0 ? Math.ceil(max / passo) * passo : 1;

  const x = (i: number) => L + (pontos.length <= 1 ? larguraPlot / 2 : (i * larguraPlot) / (pontos.length - 1));
  const y = (v: number) => T + alturaPlot - (v / teto) * alturaPlot;

  // quando o último mês está em curso, a linha cheia vai só até o penúltimo
  // ponto e o trecho final entra esmaecido
  const iCorte = ultimoParcial && pontos.length > 1 ? pontos.length - 2 : pontos.length - 1;
  const cheios = pontos.slice(0, iCorte + 1);
  const linha = cheios.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = cheios.length
    ? `${linha} L${x(iCorte).toFixed(1)},${(T + alturaPlot).toFixed(1)} L${x(0).toFixed(1)},${(T + alturaPlot).toFixed(1)} Z`
    : "";
  const trechoParcial =
    ultimoParcial && pontos.length > 1
      ? `M${x(iCorte).toFixed(1)},${y(pontos[iCorte]).toFixed(1)} L${x(pontos.length - 1).toFixed(1)},${y(pontos[pontos.length - 1]).toFixed(1)}`
      : null;

  const linhasGrade = [0, 0.5, 1];

  return (
    <div className="relative" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Evolução do faturamento por mês">
        <defs>
          <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MARCA} stopOpacity="0.22" />
            <stop offset="100%" stopColor={MARCA} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* grade + rótulos do eixo de valor */}
        {linhasGrade.map((f) => {
          const vy = T + alturaPlot - f * alturaPlot;
          return (
            <g key={f}>
              <line x1={L} y1={vy} x2={W - R} y2={vy} stroke={GRADE} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <text x={L - 8} y={vy + 3.5} textAnchor="end" fontSize="11" fill={EIXO} style={{ fontVariantNumeric: "tabular-nums" }}>
                {teto * f >= 1000 ? `${Math.round((teto * f) / 1000)}k` : Math.round(teto * f)}
              </text>
            </g>
          );
        })}

        {pontos.length > 0 && (
          <>
            {area && <path d={area} fill="url(#grad-area)" />}
            <path d={linha} fill="none" stroke={MARCA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {trechoParcial && (
              <path d={trechoParcial} fill="none" stroke={MARCA} strokeWidth="2" strokeLinecap="round" opacity="0.35" vectorEffect="non-scaling-stroke" />
            )}
          </>
        )}

        {/* marcadores + rótulo do mês */}
        {pontos.map((v, i) => (
          <g key={i}>
            {ativo === i && (
              <line x1={x(i)} y1={T} x2={x(i)} y2={T + alturaPlot} stroke={EIXO} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            )}
            <circle
              cx={x(i)}
              cy={y(v)}
              r={ativo === i ? 5 : 3.5}
              fill="#ffffff"
              stroke={MARCA}
              strokeWidth="2"
              opacity={ultimoParcial && i === pontos.length - 1 ? 0.45 : 1}
              vectorEffect="non-scaling-stroke"
            />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={EIXO}>
              {rotulos[i]}
            </text>
            {/* alvo de toque generoso, maior que o marcador */}
            <rect
              x={x(i) - larguraPlot / Math.max(pontos.length, 1) / 2}
              y={T}
              width={larguraPlot / Math.max(pontos.length, 1)}
              height={alturaPlot}
              fill="transparent"
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onTouchStart={() => setAtivo(i)}
              onClick={onSelecionar ? () => onSelecionar(i) : undefined}
              style={{ cursor: onSelecionar ? "pointer" : "default" }}
              role={onSelecionar ? "button" : undefined}
              aria-label={onSelecionar ? `Ver recebimentos de ${rotulos[i]}` : undefined}
            />
          </g>
        ))}
      </svg>

      {ativo !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(ativo) / W) * 100}%`, top: `${(y(pontos[ativo]) / H) * 100}%` }}
        >
          <span className="font-semibold tabular-nums">{brl(pontos[ativo])}</span>
          <span className="ml-1.5 text-slate-300">{rotulos[ativo]}</span>
          {ultimoParcial && ativo === pontos.length - 1 && <span className="ml-1 text-slate-400">(em curso)</span>}
          {onSelecionar && <span className="ml-1.5 text-slate-400">· toque para detalhar</span>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Barra empilhada horizontal — parte-do-todo da carteira ativa.
 * Cada fatia leva rótulo + contagem na legenda, então a cor é reforço,
 * não a única pista. Vão 2px de respiro entre as fatias.
 * ------------------------------------------------------------------ */
export function BarraCarteira({
  fatias,
  onSelecionar,
}: {
  fatias: { rotulo: string; emoji: string; cor: string; quantidade: number }[];
  /** Torna cada fatia clicável (abrir a lista daquela fase). */
  onSelecionar?: (indice: number) => void;
}) {
  const total = fatias.reduce((s, f) => s + f.quantidade, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full">
        {fatias.map((f, i) =>
          onSelecionar ? (
            <button
              key={f.rotulo}
              type="button"
              onClick={() => onSelecionar(i)}
              aria-label={`Ver os ${f.quantidade} casos em ${f.rotulo}`}
              className="h-full transition first:rounded-l-full last:rounded-r-full hover:opacity-75"
              style={{ width: `${(f.quantidade / total) * 100}%`, backgroundColor: f.cor }}
              title={`${f.rotulo}: ${f.quantidade}`}
            />
          ) : (
            <div
              key={f.rotulo}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(f.quantidade / total) * 100}%`, backgroundColor: f.cor }}
              title={`${f.rotulo}: ${f.quantidade}`}
            />
          )
        )}
      </div>
      {/* uma coluna: o rótulo da fase precisa caber inteiro — truncar destruiria a
          distinção entre "Aguardando trâmite" e "Aguardando o cliente" */}
      <ul className="mt-3 space-y-1.5">
        {fatias.map((f, i) => {
          const conteudo = (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: f.cor }} aria-hidden />
              <span className="min-w-0 flex-1 text-left text-slate-700">{f.rotulo}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">{f.quantidade}</span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
                {Math.round((f.quantidade / total) * 100)}%
              </span>
            </>
          );
          return (
            <li key={f.rotulo}>
              {onSelecionar ? (
                // linha inteira clicável: no celular o alvo é a largura do card,
                // não a bolinha de 10px
                <button
                  type="button"
                  onClick={() => onSelecionar(i)}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-slate-50"
                >
                  {conteudo}
                </button>
              ) : (
                <span className="flex items-center gap-2 text-sm">{conteudo}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Lista de barras — comparação de magnitude (uma hue só; o tamanho da
 * barra já codifica o valor, então a cor não varia).
 * ------------------------------------------------------------------ */
export function ListaBarras({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  const max = Math.max(...itens.map((i) => i.valor), 0);
  if (max === 0) return null;

  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-slate-700">{i.rotulo}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{brl(i.valor)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(i.valor / max) * 100}%`, backgroundColor: MARCA }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Medidor da meta — uma razão contra um limite. Trilho na mesma hue.
 * ------------------------------------------------------------------ */
export function MedidorMeta({
  realizado,
  meta,
  projecao,
}: {
  realizado: number;
  meta: number;
  projecao?: number;
}) {
  const pct = meta > 0 ? Math.min((realizado / meta) * 100, 100) : 0;
  const pctProj = meta > 0 && projecao ? Math.min((projecao / meta) * 100, 100) : null;
  const bateu = realizado >= meta && meta > 0;

  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {/* marca da projeção: onde o ano fecha mantendo o ritmo atual */}
        {pctProj !== null && pctProj > pct && (
          <div
            className="absolute inset-y-0 rounded-full"
            style={{ width: `${pctProj}%`, backgroundColor: MARCA, opacity: 0.22 }}
            title={`Projeção: ${brl(projecao!)}`}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: bateu ? "#059669" : MARCA }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-xs">
        <span className="font-semibold tabular-nums text-slate-700">{Math.round(pct)}% da meta</span>
        <span className="tabular-nums text-slate-500">meta {brl(meta)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sparkline — tendência em miniatura, para o cartão do "Meu dia".
 * ------------------------------------------------------------------ */
export function Sparkline({ pontos, cor = MARCA }: { pontos: number[]; cor?: string }) {
  if (pontos.length < 2) return null;
  const W = 100, H = 28;
  const max = Math.max(...pontos, 0) || 1;
  const x = (i: number) => (i * W) / (pontos.length - 1);
  const y = (v: number) => H - (v / max) * (H - 4) - 2;
  const d = pontos.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 28 }} aria-hidden>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={cor} opacity="0.12" />
      <path d={d} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(pontos.length - 1)} cy={y(pontos[pontos.length - 1])} r="2.5" fill={cor} />
    </svg>
  );
}
