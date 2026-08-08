"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, HeartHandshake, Plus, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Lancamento, Processo } from "@/lib/types";
import { brl, dataBR, emCobranca, formatCNJ, hojeISO, statusLancamento } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, StatCard } from "@/components/ui";
import { Modal } from "@/components/Modal";

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
  const { rows: lancamentos, insert, update } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const cliMap = byId(clientes);

  // Mês vindo do gráfico da Desempenho. Enquanto está ativo ele manda na lista
  // (as abas dão lugar ao recorte do mês); o "✕" devolve a tela ao normal.
  const mesUrl = useSearchParams().get("mes");
  const [mesLimpo, setMesLimpo] = useState(false);
  const mes = mesLimpo ? null : mesUrl;

  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ categoria: "Honorários", cliente_id: "", processo_id: "", descricao: "", valor: "", vencimento: "" });

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
    const perdoado = receitas.filter((l) => !!l.perdoado_em).reduce((s, l) => s + l.valor, 0);
    return { recebidoMes, recebidoAno, aReceber, emAtraso, perdoado };
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

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const valor = parseFloat(form.valor.replace(",", "."));
    if (!form.descricao || !form.vencimento || !valor || valor <= 0) return;
    await insert({
      tipo: "receita",
      categoria: form.categoria,
      cliente_id: form.cliente_id || undefined,
      processo_id: form.processo_id || undefined,
      descricao: form.descricao,
      valor,
      vencimento: form.vencimento,
    });
    setForm({ categoria: "Honorários", cliente_id: "", processo_id: "", descricao: "", valor: "", vencimento: "" });
    setModal(false);
  }

  return (
    <div>
      <PageHeader
        titulo="Financeiro"
        sub="Honorários e recebíveis"
        acao={<BotaoPrimario onClick={() => setModal(true)}><Plus size={16} /> Novo recebimento</BotaoPrimario>}
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
              {k === "perdoados" && totais.perdoado > 0 && (
                <span className={`ml-1 tabular-nums ${filtro === k ? "text-slate-300" : "text-slate-400"}`}>
                  {brl(totais.perdoado)}
                </span>
              )}
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
                    {cli && ` · ${cli.nome}`}
                    {" · "}
                    {l.pago_em
                      ? `recebido em ${dataBR(l.pago_em)}`
                      : l.perdoado_em
                        ? `perdoado em ${dataBR(l.perdoado_em)} · vencia ${dataBR(l.vencimento)}`
                        : `vence ${dataBR(l.vencimento)}`}
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
                {l.perdoado_em ? (
                  <button
                    onClick={() => update(l.id, { perdoado_em: null, perdoado_motivo: null })}
                    className="shrink-0 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100"
                    title="Desfazer — devolver à cobrança"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : (
                  !l.pago_em && (
                    <button
                      onClick={() => update(l.id, { pago_em: hojeISO() })}
                      className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                      title="Marcar como recebido"
                    >
                      <Check size={16} />
                    </button>
                  )
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal aberto={modal} titulo="Novo recebimento" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="space-y-3">
          <Field rotulo="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {["Honorários", "Consultoria", "Êxito", "Outras receitas"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field rotulo="Descrição" obrigatorio>
            <Input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Parcela 1/4 — apelação" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Valor (R$)" obrigatorio>
              <Input required inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="3000,00" />
            </Field>
            <Field rotulo="Vencimento" obrigatorio>
              <Input required type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Cliente">
            <Select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value, processo_id: "" })}>
              <option value="">Sem vínculo</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
          {form.cliente_id && (
            <Field rotulo="Processo">
              <Select value={form.processo_id} onChange={(e) => setForm({ ...form, processo_id: e.target.value })}>
                <option value="">Sem vínculo</option>
                {processos.filter((p) => p.cliente_id === form.cliente_id).map((p) => (
                  <option key={p.id} value={p.id}>{formatCNJ(p.numero_cnj)}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar recebimento</BotaoPrimario></div>
        </form>
      </Modal>
    </div>
  );
}
