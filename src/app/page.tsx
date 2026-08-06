"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MoonStar, Star, Trash2, TrendingUp, Video } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Cliente, EventoAgenda, Lancamento, Prazo, Processo, Tarefa } from "@/lib/types";
import { brl, dataBR, dataHoraBR, diasAteISO, formatCNJ, hojeISO, rotuloDias, statusLancamento, urgenciaPrazo, TIPOS_EVENTO } from "@/lib/format";
import { MESES_CURTOS, lerMeta, metaSugerida, projecaoAno, resumoAno } from "@/lib/metricas";
import { MedidorMeta, Sparkline } from "@/components/Charts";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";

const COR_URGENCIA = {
  vencido: "vermelho",
  hoje: "vermelho",
  urgente: "ambar",
  proximo: "azul",
  tranquilo: "cinza",
} as const;

export default function Dashboard() {
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: prazos } = useTable<Prazo>("prazos");
  const { rows: eventos } = useTable<EventoAgenda>("eventos_agenda");
  const { rows: lancamentos } = useTable<Lancamento>("lancamentos");
  const { rows: andamentos } = useTable<Andamento>("andamentos");
  const { rows: tarefas, insert: addTarefa, update: updateTarefa, remove: removeTarefa } = useTable<Tarefa>("tarefas");
  const { rows: clientes } = useTable<Cliente>("clientes");

  const procMap = byId(processos);
  const cliMap = byId(clientes);

  const [novaTarefa, setNovaTarefa] = useState("");

  const ativos = processos.filter((p) => p.status === "ativo").length;

  const prazosPendentes = prazos
    .filter((p) => p.status === "pendente")
    .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  const prazosSemana = prazosPendentes.filter((p) => diasAteISO(p.data_limite) <= 7);

  const agora = new Date().toISOString();
  const proximosEventos = eventos
    .filter((e) => e.inicio >= agora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, 5);

  const aReceber = lancamentos
    .filter((l) => l.tipo === "receita" && !l.pago_em)
    .reduce((s, l) => s + l.valor, 0);
  const atrasados = lancamentos.filter((l) => l.tipo === "receita" && statusLancamento(l) === "atrasado");

  const ultimosAndamentos = [...andamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  // Bloco de anotações (o "post-it"): pendentes primeiro, urgentes no topo,
  // riscadas (concluídas) por último.
  const anotacoes = [...tarefas].sort((a, b) => {
    const ac = a.status === "concluida" ? 1 : 0;
    const bc = b.status === "concluida" ? 1 : 0;
    if (ac !== bc) return ac - bc;
    const ap = a.prioridade === "alta" ? 0 : 1;
    const bp = b.prioridade === "alta" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  const temRiscadas = tarefas.some((t) => t.status === "concluida");
  const abertas = tarefas.filter((t) => t.status !== "concluida").length;

  async function adicionarTarefa(e: React.FormEvent) {
    e.preventDefault();
    const t = novaTarefa.trim();
    if (!t) return;
    setNovaTarefa("");
    await addTarefa({ titulo: t, prioridade: "media", status: "pendente" });
  }

  async function alternarFeito(t: Tarefa) {
    await updateTarefa(t.id, { status: t.status === "concluida" ? "pendente" : "concluida" });
  }

  async function alternarUrgencia(t: Tarefa) {
    await updateTarefa(t.id, { prioridade: t.prioridade === "alta" ? "media" : "alta" });
  }

  async function limparRiscadas() {
    for (const t of tarefas.filter((x) => x.status === "concluida")) {
      await removeTarefa(t.id);
    }
  }

  // Faixa de desempenho: ritmo do ano e meta, resumidos (o detalhe fica em /desempenho)
  const hojeStr = hojeISO();
  const anoAtual = hojeStr.slice(0, 4);
  const resumo = useMemo(() => resumoAno(lancamentos, anoAtual, hojeStr), [lancamentos, anoAtual, hojeStr]);
  const projecao = projecaoAno(resumo);
  const [meta, setMeta] = useState(0);
  useEffect(() => {
    setMeta(lerMeta(anoAtual) ?? metaSugerida(resumo, null));
  }, [anoAtual, resumo]);
  const mesesPlot = resumo.mesesDecorridos;
  const melhorMes = resumo.porMes.indexOf(Math.max(...resumo.porMes));

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const hojeLongo = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{saudacao}, Dr. Gustavo</h1>
          <p className="text-sm text-slate-500 first-letter:uppercase">{hojeLongo}</p>
        </div>
        {/* A partir do fim da tarde o fechamento do dia vira a ação principal */}
        <Link
          href="/fechar-dia"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            hora >= 17
              ? "bg-slate-900 text-white shadow-sm hover:bg-slate-700"
              : "text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
          }`}
        >
          <MoonStar size={15} /> Fechar o dia
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard rotulo="Processos ativos" valor={String(ativos)} />
        <StatCard
          rotulo="Prazos em 7 dias"
          valor={String(prazosSemana.length)}
          destaque={prazosSemana.some((p) => diasAteISO(p.data_limite) <= 1)}
          detalhe={prazosSemana.length ? `próximo: ${rotuloDias(prazosSemana[0].data_limite)}` : "nenhum prazo próximo"}
        />
        <StatCard rotulo="A receber" valor={brl(aReceber)} detalhe={atrasados.length ? `${atrasados.length} em atraso` : "nada em atraso"} destaque={atrasados.length > 0} />
        <StatCard rotulo="Anotações abertas" valor={String(abertas)} detalhe="no seu bloco" />
      </div>

      {/* Faixa de desempenho — o ritmo do ano em um olhar */}
      {resumo.total > 0 && (
        <Link href="/desempenho" className="block">
          <Card className="p-4 transition hover:border-brand-300 hover:shadow-md">
            <div className="grid gap-4 sm:grid-cols-[1.1fr_1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recebido em {anoAtual}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{brl(resumo.total)}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  no ritmo atual, fecha em <span className="font-semibold tabular-nums text-slate-700">{brl(projecao)}</span>
                  {melhorMes >= 0 && resumo.porMes[melhorMes] > 0 && (
                    <span className="text-slate-400"> · melhor mês: {MESES_CURTOS[melhorMes]}</span>
                  )}
                </p>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 text-brand-600">
                  <Sparkline pontos={resumo.porMes.slice(0, mesesPlot)} />
                </div>
                <MedidorMeta realizado={resumo.total} meta={meta} projecao={projecao} />
              </div>

              <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 sm:inline-flex">
                <TrendingUp size={14} /> desempenho <ArrowRight size={13} />
              </span>
            </div>
          </Card>
        </Link>
      )}

      {/* Bloco de anotações — o "post-it" do escritório */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">📌 Minhas anotações</h2>
          {temRiscadas && (
            <button onClick={limparRiscadas} className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline">
              limpar riscadas
            </button>
          )}
        </div>

        <form onSubmit={adicionarTarefa} className="mb-3 flex gap-2">
          <input
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            placeholder="Escreva uma tarefa e tecle Enter…"
            className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
            Adicionar
          </button>
        </form>

        {anotacoes.length === 0 ? (
          <EmptyState>Bloco limpo. Escreva a primeira anotação acima. ✍️</EmptyState>
        ) : (
          <ul className="divide-y divide-amber-100">
            {anotacoes.map((t) => {
              const feita = t.status === "concluida";
              return (
                <li key={t.id} className="group flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    checked={feita}
                    onChange={() => alternarFeito(t)}
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span className={`min-w-0 flex-1 text-sm ${feita ? "text-slate-400 line-through" : t.prioridade === "alta" ? "font-bold text-slate-900" : "text-slate-800"}`}>
                    {t.titulo}
                  </span>
                  {!feita && (
                    <button
                      onClick={() => alternarUrgencia(t)}
                      title={t.prioridade === "alta" ? "tirar urgência" : "marcar urgente"}
                      className="shrink-0 text-slate-400 hover:text-amber-500"
                    >
                      <Star size={16} className={t.prioridade === "alta" ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                  )}
                  <button
                    onClick={() => removeTarefa(t.id)}
                    title="apagar"
                    className="shrink-0 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">⚖️ Prazos mais urgentes</h2>
            <Link href="/agenda" className="text-xs font-semibold text-brand-700 hover:underline">ver todos</Link>
          </div>
          {prazosPendentes.length === 0 ? (
            <EmptyState>Nenhum prazo pendente. 🎉</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {prazosPendentes.slice(0, 5).map((p) => {
                const proc = p.processo_id ? procMap.get(p.processo_id) : undefined;
                const u = urgenciaPrazo(p.data_limite);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{p.titulo}</p>
                      <p className="truncate text-xs text-slate-500">
                        {proc ? formatCNJ(proc.numero_cnj) : "sem processo"} · {dataBR(p.data_limite)}
                      </p>
                    </div>
                    <Badge cor={COR_URGENCIA[u]}>{rotuloDias(p.data_limite)}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">📅 Próximos compromissos</h2>
            <Link href="/agenda" className="text-xs font-semibold text-brand-700 hover:underline">agenda</Link>
          </div>
          {proximosEventos.length === 0 ? (
            <EmptyState>Agenda livre.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {proximosEventos.map((e) => (
                <li key={e.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-900">{e.titulo}</p>
                    <Badge cor={e.tipo === "audiencia" ? "roxo" : e.tipo === "sustentacao" ? "vermelho" : e.tipo === "video" ? "verde" : "azul"}>{TIPOS_EVENTO[e.tipo]}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {dataHoraBR(e.inicio)}
                      {e.local ? ` · ${e.local}` : ""}
                    </p>
                    {e.link_virtual && (
                      <a
                        href={e.link_virtual}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                      >
                        <Video size={13} /> entrar
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">🔔 Últimas movimentações</h2>
          <Link href="/processos" className="text-xs font-semibold text-brand-700 hover:underline">processos</Link>
        </div>
        {ultimosAndamentos.length === 0 ? (
          <EmptyState>Sem movimentações registradas.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ultimosAndamentos.map((a) => {
              const proc = procMap.get(a.processo_id);
              const cli = proc ? cliMap.get(proc.cliente_id) : undefined;
              return (
                <li key={a.id} className="py-2.5">
                  <p className="text-sm text-slate-800">{a.descricao}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dataBR(a.data)} · {cli?.nome ?? "—"}
                    {a.origem === "tribunal" && <span className="ml-1.5 text-brand-700">· via tribunal</span>}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
