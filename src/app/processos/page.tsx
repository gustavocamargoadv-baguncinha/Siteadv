"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Processo, SituacaoCaso } from "@/lib/types";
import { AREAS, formatCNJ } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, PageHeader } from "@/components/ui";
import { NovoProcesso } from "@/components/NovoProcesso";
import { faseInfo } from "@/lib/fases";
import { faseCarteira } from "@/lib/metricas";

const COR_STATUS = { ativo: "verde", suspenso: "ambar", arquivado: "cinza", encerrado: "azul" } as const;

// useSearchParams() precisa de fronteira de Suspense no App Router — sem ela o
// build falha ao pré-renderizar a rota.
export default function ProcessosPage() {
  return (
    <Suspense fallback={<PageHeader titulo="Processos" sub="carregando…" />}>
      <ProcessosConteudo />
    </Suspense>
  );
}

function ProcessosConteudo() {
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const cliMap = byId(clientes);

  // Fase vinda da Desempenho (clique na carteira). Guardada em estado próprio
  // para o "✕" limpar sem precisar mexer na URL.
  const faseUrl = useSearchParams().get("fase") as SituacaoCaso | null;
  const [faseLimpa, setFaseLimpa] = useState(false);
  const fase = faseLimpa ? null : faseUrl;
  const infoFase = faseInfo(fase ?? undefined);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [modal, setModal] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return processos
      // O filtro de fase SUBSTITUI o de status: a carteira da Desempenho conta
      // todo caso não encerrado (inclusive suspensos e arquivados), então cruzar
      // os dois traria menos casos do que o número em que ele acabou de clicar.
      .filter((p) => (fase ? faseCarteira(p) === fase : filtroStatus === "todos" ? true : p.status === filtroStatus))
      .filter((p) => {
        if (!q) return true;
        const cli = cliMap.get(p.cliente_id);
        return (
          (p.numero_cnj ?? "").includes(q) ||
          (cli?.nome ?? "").toLowerCase().includes(q) ||
          (p.objeto ?? "").toLowerCase().includes(q) ||
          (p.comarca ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [processos, busca, filtroStatus, fase, cliMap]);

  return (
    <div>
      <PageHeader
        titulo="Processos"
        sub={`${filtrados.length} de ${processos.length} casos`}
        acao={<BotaoPrimario onClick={() => setModal(true)}><Plus size={16} /> Novo processo</BotaoPrimario>}
      />

      {infoFase && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-600">Vindo do Desempenho — mostrando só:</span>
          <Badge cor={infoFase.cor}>
            {infoFase.emoji} {infoFase.rotulo}
          </Badge>
          <span className="text-sm tabular-nums text-slate-500">
            {filtrados.length} caso{filtrados.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setFaseLimpa(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            <X size={13} /> limpar
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, objeto…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          disabled={!!fase}
          title={fase ? "Enquanto o filtro de fase estiver ativo, ele manda na lista" : undefined}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="ativo">Ativos</option>
          <option value="suspenso">Suspensos</option>
          <option value="arquivado">Arquivados</option>
          <option value="encerrado">Encerrados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState>Nenhum processo encontrado.</EmptyState>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => {
            const cli = cliMap.get(p.cliente_id);
            return (
              <Link key={p.id} href={`/processos/${p.id}`} className="block">
                <Card className="p-4 transition hover:border-brand-400 hover:shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{formatCNJ(p.numero_cnj)}</span>
                    <Badge cor={COR_STATUS[p.status]}>{p.status}</Badge>
                    <Badge cor="roxo">{AREAS[p.area]}</Badge>
                    {faseInfo(p.situacao) && (
                      <Badge cor={faseInfo(p.situacao)!.cor}>{faseInfo(p.situacao)!.emoji} {faseInfo(p.situacao)!.rotulo}</Badge>
                    )}
                    {p.monitorado && <Badge cor="azul">monitorado</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{cli?.nome ?? "Cliente removido"}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{p.objeto}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[p.vara, p.comarca, p.fase && `Fase: ${p.fase}`].filter(Boolean).join(" · ")}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <NovoProcesso aberto={modal} onFechar={() => setModal(false)} />
    </div>
  );
}
