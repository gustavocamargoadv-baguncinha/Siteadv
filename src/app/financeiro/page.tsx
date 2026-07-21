"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Lancamento, Processo } from "@/lib/types";
import { brl, dataBR, formatCNJ, hojeISO, statusLancamento } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, StatCard } from "@/components/ui";
import { Modal } from "@/components/Modal";

type Filtro = "todos" | "areceber" | "atrasados" | "recebidos";

export default function FinanceiroPage() {
  const { rows: lancamentos, insert, update } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const cliMap = byId(clientes);

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
    const aReceber = receitas.filter((l) => !l.pago_em).reduce((s, l) => s + l.valor, 0);
    const emAtraso = receitas.filter((l) => statusLancamento(l) === "atrasado").reduce((s, l) => s + l.valor, 0);
    return { recebidoMes, recebidoAno, aReceber, emAtraso };
  }, [receitas, mesAtual, anoAtual]);

  const filtrados = useMemo(
    () =>
      receitas
        .filter((l) => {
          if (filtro === "todos") return true;
          if (filtro === "atrasados") return statusLancamento(l) === "atrasado";
          if (filtro === "areceber") return !l.pago_em;
          return !!l.pago_em; // recebidos
        })
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento)),
    [receitas, filtro]
  );

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

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["todos", "Todos"],
            ["areceber", "A receber"],
            ["atrasados", "Em atraso"],
            ["recebidos", "Recebidos"],
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

      {filtrados.length === 0 ? (
        <EmptyState>Nenhum recebimento nesse filtro.</EmptyState>
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => {
            const st = statusLancamento(l);
            const cli = l.cliente_id ? cliMap.get(l.cliente_id) : undefined;
            return (
              <Card key={l.id} className={`flex items-center gap-3 p-4 ${st === "atrasado" ? "border-red-300 bg-red-50/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{l.descricao}</p>
                    <Badge cor={st === "pago" ? "verde" : st === "atrasado" ? "vermelho" : "ambar"}>
                      {st === "pago" ? "recebido" : st}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {l.categoria}
                    {cli && ` · ${cli.nome}`}
                    {" · "}
                    {l.pago_em ? `recebido em ${dataBR(l.pago_em)}` : `vence ${dataBR(l.vencimento)}`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-emerald-700">{brl(l.valor)}</p>
                {!l.pago_em && (
                  <button
                    onClick={() => update(l.id, { pago_em: hojeISO() })}
                    className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                    title="Marcar como recebido"
                  >
                    <Check size={16} />
                  </button>
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
