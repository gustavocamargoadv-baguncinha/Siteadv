"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, HeartHandshake, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Lancamento } from "@/lib/types";
import { brl, dataBR, emCobranca, hojeISO, statusLancamento } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { EditarLancamento } from "@/components/EditarLancamento";

type Filtro = "todos" | "areceber" | "atrasados" | "recebidos" | "perdoados";

/** "2026-02" → "fevereiro de 2026" */
function mesPorExtenso(mes: string): string {
  return new Date(`${mes}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// useSearchParams() precisa de fronteira de Suspense no App Router.
export default function FinanceiroPage() {
  return (
    <Suspense fallback={<PageHeader titulo="Financeiro" sub="carregando…" />}>
      <FinanceiroConteudo />
    </Suspense>
  );
}

function FinanceiroConteudo() {
  const { rows: lancamentos, update } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const cliMap = byId(clientes);

  // Mês vindo do gráfico da Desempenho. Enquanto está ativo ele manda na lista
  // (as abas dão lugar ao recorte do mês); o "✕" devolve a tela ao normal.
  const mesUrl = useSearchParams().get("mes");
  const [mesLimpo, setMesLimpo] = useState(false);
  const mes = mesLimpo ? null : mesUrl;

  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modal, setModal] = useState(false);
  // Lançamento em edição; `null` abre o formulário em branco. O formulário em
  // si vive em <EditarLancamento>, compartilhado com a ficha do cliente.
  const [emEdicao, setEmEdicao] = useState<Lancamento | null>(null);
  // Data de recebimento em correção (id do lançamento) — o ✓ grava hoje, e daqui
  // se ajusta quando o pagamento caiu num outro dia.
  const [corrigindoData, setCorrigindoData] = useState<string | null>(null);

  function abrirNovo() {
    setEmEdicao(null);
    setModal(true);
  }

  function abrirEdicao(l: Lancamento) {
    setEmEdicao(l);
    setModal(true);
  }

  const mesAtual = hojeISO().slice(0, 7);
  const anoAtual = hojeISO().slice(0, 4);

  // apenas receitas (o escritório não lança despesas aqui)
  const receitas = useMemo(() => lancamentos.filter((l) => l.tipo === "receita"), [lancamentos]);

  const totais = useMemo(() => {
    const recebidoMes = receitas.filter((l) => l.pago_em?.startsWith(mesAtual)).reduce((s, l) => s + l.valor, 0);
    const recebidoAno = receitas.filter((l) => l.pago_em?.startsWith(anoAtual)).reduce((s, l) => s + l.valor, 0);
    // "a receber" e "em atraso" contam só o que ainda é cobrável — dívida
    // perdoada continua no sistema, mas não engorda mais esses números.
    const aReceber = receitas.filter(emCobranca).reduce((s, l) => s + l.valor, 0);
    const emAtraso = receitas.filter((l) => statusLancamento(l) === "atrasado").reduce((s, l) => s + l.valor, 0);
    return { recebidoMes, recebidoAno, aReceber, emAtraso };
  }, [receitas, mesAtual, anoAtual]);

  // Recorte do mês: casa com o gráfico da Desempenho, que plota dinheiro
  // RECEBIDO — por isso filtra por pago_em, não por vencimento. Filtrar por
  // vencimento traria outra lista e outro total, e o número não bateria.
  const doMes = useMemo(
    () =>
      mes
        ? receitas
            .filter((l) => l.pago_em?.startsWith(mes))
            .sort((a, b) => (b.pago_em ?? "").localeCompare(a.pago_em ?? ""))
        : [],
    [receitas, mes]
  );
  const totalMes = doMes.reduce((s, l) => s + l.valor, 0);

  const filtrados = useMemo(
    () =>
      receitas
        .filter((l) => {
          if (filtro === "todos") return true;
          if (filtro === "atrasados") return statusLancamento(l) === "atrasado";
          if (filtro === "areceber") return emCobranca(l);
          if (filtro === "perdoados") return !!l.perdoado_em;
          return !!l.pago_em; // recebidos
        })
        // recebidos: mais recentes no topo (pela data de recebimento);
        // perdoados: os perdões mais recentes primeiro;
        // demais: por vencimento (mais próximo primeiro)
        .sort((a, b) =>
          filtro === "recebidos"
            ? (b.pago_em ?? "").localeCompare(a.pago_em ?? "")
            : filtro === "perdoados"
              ? (b.perdoado_em ?? "").localeCompare(a.perdoado_em ?? "")
              : a.vencimento.localeCompare(b.vencimento)
        ),
    [receitas, filtro]
  );

  const lista = mes ? doMes : filtrados;

  return (
    <div>
      <PageHeader
        titulo="Financeiro"
        sub="Honorários e recebíveis"
        acao={<BotaoPrimario onClick={abrirNovo}><Plus size={16} /> Novo recebimento</BotaoPrimario>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard rotulo={`Recebido em ${anoAtual}`} valor={brl(totais.recebidoAno)} detalhe="acumulado no ano" />
        <StatCard rotulo="Recebido no mês" valor={brl(totais.recebidoMes)} />
        <StatCard rotulo="A receber" valor={brl(totais.aReceber)} />
        <StatCard rotulo="Em atraso" valor={brl(totais.emAtraso)} destaque={totais.emAtraso > 0} />
      </div>

      {mes ? (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/desempenho" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
              <ArrowLeft size={13} /> Desempenho
            </Link>
            <span className="text-sm font-semibold capitalize text-slate-900">Recebido em {mesPorExtenso(mes)}</span>
            <span className="text-sm font-bold tabular-nums text-emerald-700">{brl(totalMes)}</span>
            <span className="text-xs tabular-nums text-slate-500">
              {doMes.length} recebimento{doMes.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => setMesLimpo(true)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              <X size={13} /> ver tudo
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(
            [
              ["todos", "Todos"],
              ["areceber", "A receber"],
              ["atrasados", "Em atraso"],
              ["recebidos", "Recebidos"],
              ["perdoados", "Perdoados"],
            ] as const
          ).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filtro === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {filtro === "perdoados" && !mes && lista.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          Dívidas de que o escritório abriu mão. Ficam guardadas para o histórico, fora da cobrança ativa, e nunca
          entram no faturamento. Dá para devolver qualquer uma à cobrança.
        </p>
      )}

      {lista.length === 0 ? (
        <EmptyState>
          {mes
            ? `Nenhum recebimento em ${mesPorExtenso(mes)}.`
            : filtro === "perdoados"
              ? "Nenhuma dívida perdoada até agora."
              : "Nenhum recebimento nesse filtro."}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {lista.map((l) => {
            const st = statusLancamento(l);
            const cli = l.cliente_id ? cliMap.get(l.cliente_id) : undefined;
            return (
              <Card
                key={l.id}
                className={`flex items-center gap-3 p-4 ${
                  st === "atrasado" ? "border-red-300 bg-red-50/50" : st === "perdoado" ? "bg-slate-50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${st === "perdoado" ? "text-slate-500" : "text-slate-900"}`}>
                      {l.descricao}
                    </p>
                    <Badge cor={st === "pago" ? "verde" : st === "atrasado" ? "vermelho" : st === "perdoado" ? "cinza" : "ambar"}>
                      {st === "pago" ? "recebido" : st}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {l.categoria}
                    {cli && (
                      <>
                        {" · "}
                        {/* atalho para a ficha: daqui se vê os casos, o contrato
                            e o que mais o cliente deve, sem procurar na lista */}
                        <Link
                          href={`/clientes/${cli.id}`}
                          className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-brand-700 hover:decoration-brand-500"
                        >
                          {cli.nome}
                        </Link>
                      </>
                    )}
                    {" · "}
                    {l.pago_em ? (
                      corrigindoData === l.id ? (
                        // corrigir a data direto na linha: o ✓ grava hoje, mas o
                        // pagamento pode ter caído na sexta
                        <input
                          autoFocus
                          type="date"
                          defaultValue={l.pago_em}
                          onBlur={() => setCorrigindoData(null)}
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            await update(l.id, { pago_em: e.target.value });
                            setCorrigindoData(null);
                          }}
                          className="rounded border border-brand-400 px-1.5 py-0.5 text-xs"
                        />
                      ) : (
                        <button
                          onClick={() => setCorrigindoData(l.id)}
                          className="underline decoration-dotted underline-offset-2 transition hover:text-slate-900"
                          title="Corrigir a data do recebimento"
                        >
                          recebido em {dataBR(l.pago_em)}
                        </button>
                      )
                    ) : l.perdoado_em ? (
                      `perdoado em ${dataBR(l.perdoado_em)} · vencia ${dataBR(l.vencimento)}`
                    ) : (
                      `vence ${dataBR(l.vencimento)}`
                    )}
                  </p>
                  {l.perdoado_motivo && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs italic text-slate-500">
                      <HeartHandshake size={12} className="shrink-0" /> {l.perdoado_motivo}
                    </p>
                  )}
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${
                    st === "perdoado" ? "text-slate-400 line-through" : "text-emerald-700"
                  }`}
                >
                  {brl(l.valor)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {l.perdoado_em ? (
                    <button
                      onClick={() => update(l.id, { perdoado_em: null, perdoado_motivo: null })}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
                      title="Desfazer — devolver à cobrança"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : (
                    !l.pago_em && (
                      <button
                        onClick={() => update(l.id, { pago_em: hojeISO() })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                        title="Marcar como recebido"
                      >
                        <Check size={16} />
                      </button>
                    )
                  )}
                  {/* a saída para todo engano: corrigir valor, desmarcar o
                      recebimento ou apagar o lançamento */}
                  <button
                    onClick={() => abrirEdicao(l)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Corrigir ou apagar este lançamento"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <EditarLancamento
        aberto={modal}
        lancamento={emEdicao}
        onFechar={() => setModal(false)}
      />
    </div>
  );
}
