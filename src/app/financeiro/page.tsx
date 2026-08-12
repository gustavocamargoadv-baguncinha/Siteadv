"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, HeartHandshake, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
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
  const { rows: lancamentos, insert, update, remove } = useTable<Lancamento>("lancamentos");
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
  // `recebido` é a pergunta que faltava: o dinheiro JÁ entrou ou é uma conta a
  // receber? Sem ela todo lançamento nascia como recebível e, com data de hoje
  // ou de ontem, aparecia como parcela atrasada — dinheiro que entrou virava
  // cobrança. Começa em "já recebi" porque é o uso do dia a dia (registrar o
  // pagamento que acabou de cair); parcela futura sai do contrato.
  // `id` nulo = lançamento novo; preenchido = editando um que já existe. O mesmo
  // formulário serve aos dois — e é por ele que se conserta engano: trocar para
  // "A receber" desmarca um recebimento lançado sem querer.
  const [form, setForm] = useState({
    id: null as string | null,
    recebido: true,
    categoria: "Honorários",
    cliente_id: "",
    processo_id: "",
    descricao: "",
    valor: "",
    data: "",
  });
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  // Data de recebimento em correção (id do lançamento) — o ✓ grava hoje, e daqui
  // se ajusta quando o pagamento caiu num outro dia.
  const [corrigindoData, setCorrigindoData] = useState<string | null>(null);

  const cliSelecionado = form.cliente_id ? cliMap.get(form.cliente_id) : undefined;
  // Com o cliente escolhido, a descrição já vem pronta: sobra digitar o valor.
  const descricaoSugerida = cliSelecionado ? `${form.categoria} — ${cliSelecionado.nome}` : "";

  function abrirNovo() {
    // hoje só aqui (e não no useState) para o servidor e o navegador não
    // renderizarem datas diferentes na virada do dia
    setForm({ id: null, recebido: true, categoria: "Honorários", cliente_id: "", processo_id: "", descricao: "", valor: "", data: hojeISO() });
    setConfirmandoExclusao(false);
    setModal(true);
  }

  function abrirEdicao(l: Lancamento) {
    setForm({
      id: l.id,
      recebido: !!l.pago_em,
      categoria: l.categoria,
      cliente_id: l.cliente_id ?? "",
      processo_id: l.processo_id ?? "",
      descricao: l.descricao,
      // vírgula decimal, como ele digita
      valor: String(l.valor).replace(".", ","),
      data: l.pago_em ?? l.vencimento,
    });
    setConfirmandoExclusao(false);
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
    const descricao = form.descricao.trim() || descricaoSugerida;
    if (!descricao || !form.data || !valor || valor <= 0) return;

    const campos = {
      tipo: "receita" as const,
      categoria: form.categoria,
      cliente_id: form.cliente_id || undefined,
      processo_id: form.processo_id || undefined,
      descricao,
      valor,
      // Já recebido: o vencimento é o próprio dia do pagamento. Gravar uma data
      // anterior faria o lançamento nascer marcado como atraso no histórico,
      // mesmo tendo sido pago em dia.
      vencimento: form.data,
    };

    if (form.id) {
      await update(form.id, {
        ...campos,
        // `null` e não `undefined`: é assim que o campo é LIMPO. Voltar para
        // "a receber" tem de apagar a data de pagamento — é esse o desfazer de
        // quem marcou recebido por engano.
        pago_em: form.recebido ? form.data : null,
        // pago e perdoado ao mesmo tempo é proibido no banco; registrar o
        // pagamento encerra o perdão.
        ...(form.recebido ? { perdoado_em: null, perdoado_motivo: null } : {}),
      });
    } else {
      await insert({ ...campos, ...(form.recebido ? { pago_em: form.data } : {}) });
    }
    setModal(false);
  }

  async function excluirLancamento() {
    if (!form.id) return;
    await remove(form.id);
    setModal(false);
  }

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

      <Modal
        aberto={modal}
        titulo={form.id ? "Corrigir lançamento" : form.recebido ? "Registrar pagamento" : "Nova conta a receber"}
        onFechar={() => setModal(false)}
      >
        <form onSubmit={salvar} className="space-y-3">
          {form.id && (
            <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
              Marcou como recebido sem querer? Troque para <span className="font-semibold">⏳ A receber</span> — a data
              do pagamento é apagada e ele volta para a cobrança.
            </p>
          )}
          {/* A pergunta que decide tudo, antes de qualquer campo */}
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [true, "💰 Já recebi", "o dinheiro entrou"],
                [false, "⏳ A receber", "vai vencer"],
              ] as const
            ).map(([v, rotulo, dica]) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setForm({ ...form, recebido: v })}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  form.recebido === v
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className={`block text-sm font-semibold ${form.recebido === v ? "text-brand-800" : "text-slate-700"}`}>
                  {rotulo}
                </span>
                <span className="block text-xs text-slate-500">{dica}</span>
              </button>
            ))}
          </div>

          <Field rotulo="Cliente">
            <Select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value, processo_id: "" })}>
              <option value="">Sem vínculo</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Valor (R$)" obrigatorio>
              <Input required inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="3000,00" />
            </Field>
            <Field rotulo={form.recebido ? "Recebido em" : "Vencimento"} obrigatorio>
              <Input required type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Descrição">
            <Input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder={descricaoSugerida || "Ex.: Parcela 1/4 — apelação"}
            />
            {descricaoSugerida && !form.descricao.trim() && (
              <p className="mt-1 text-xs text-slate-400">
                Em branco, salva como “{descricaoSugerida}”.
              </p>
            )}
          </Field>
          <Field rotulo="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {["Honorários", "Consultoria", "Êxito", "Outras receitas"].map((c) => (
                <option key={c} value={c}>{c}</option>
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
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {form.id &&
              (confirmandoExclusao ? (
                <div className="mr-auto flex items-center gap-2">
                  <span className="text-xs text-slate-600">Apagar de vez?</span>
                  <button
                    type="button"
                    onClick={excluirLancamento}
                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    Sim, apagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={13} /> Apagar lançamento
                </button>
              ))}
            <BotaoPrimario type="submit">
              {form.id ? "Salvar correção" : form.recebido ? "Registrar pagamento" : "Salvar conta a receber"}
            </BotaoPrimario>
          </div>
        </form>
      </Modal>
    </div>
  );
}
