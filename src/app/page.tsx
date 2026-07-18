"use client";

import Link from "next/link";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Cliente, EventoAgenda, Lancamento, Prazo, Processo, Tarefa } from "@/lib/types";
import { brl, dataBR, dataHoraBR, diasAteISO, formatCNJ, rotuloDias, statusLancamento, urgenciaPrazo, TIPOS_EVENTO } from "@/lib/format";
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
  const { rows: tarefas } = useTable<Tarefa>("tarefas");
  const { rows: clientes } = useTable<Cliente>("clientes");

  const procMap = byId(processos);
  const cliMap = byId(clientes);

  const ativos = processos.filter((p) => p.status === "ativo").length;

  const prazosPendentes = prazos
    .filter((p) => p.status === "pendente")
    .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  const prazosSemana = prazosPendentes.filter((p) => diasAteISO(p.data_limite) <= 7);

  const agora = new Date().toISOString();
  const proximosEventos = eventos
    .filter((e) => e.inicio >= agora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, 4);

  const aReceber = lancamentos
    .filter((l) => l.tipo === "receita" && !l.pago_em)
    .reduce((s, l) => s + l.valor, 0);
  const atrasados = lancamentos.filter((l) => l.tipo === "receita" && statusLancamento(l) === "atrasado");

  const ultimosAndamentos = [...andamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  const tarefasAbertas = tarefas.filter((t) => t.status !== "concluida").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bom dia, Dr. Gustavo</h1>
        <p className="text-sm text-slate-500">Visão geral do escritório</p>
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
        <StatCard rotulo="Compromissos" valor={String(proximosEventos.length)} detalhe="próximos na agenda" />
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
                    <Badge cor={e.tipo === "audiencia" ? "roxo" : "azul"}>{TIPOS_EVENTO[e.tipo]}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {dataHoraBR(e.inicio)}
                    {e.local ? ` · ${e.local}` : e.link_virtual ? " · virtual" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

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

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">✅ Tarefas da equipe</h2>
          {tarefasAbertas.length === 0 ? (
            <EmptyState>Nenhuma tarefa aberta.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tarefasAbertas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{t.titulo}</p>
                    <p className="text-xs text-slate-500">{t.data_limite ? `até ${dataBR(t.data_limite)}` : "sem data"}</p>
                  </div>
                  <Badge cor={t.prioridade === "alta" ? "vermelho" : t.prioridade === "media" ? "ambar" : "cinza"}>
                    {t.prioridade}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
