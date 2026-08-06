"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Cliente, Documento, EventoAgenda, Processo } from "@/lib/types";
import { AREAS, dataBR, dataHoraBR, formatCNJ, TIPOS_EVENTO } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, Select } from "@/components/ui";
import { faseInfo } from "@/lib/fases";

// Pré-visualização do Portal do Cliente: exatamente o que cada cliente enxerga
// ao entrar com o próprio login (apenas os seus processos, andamentos e os
// documentos marcados como visíveis). Com o Supabase configurado, o acesso do
// cliente é criado por convite e as regras de RLS garantem esse recorte no banco.

export default function PortalPage() {
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: andamentos } = useTable<Andamento>("andamentos");
  const { rows: documentos } = useTable<Documento>("documentos");
  const { rows: eventos } = useTable<EventoAgenda>("eventos_agenda");

  const [clienteId, setClienteId] = useState("");
  const cliMap = byId(clientes);
  const cli = clienteId ? cliMap.get(clienteId) : undefined;

  const casos = cli ? processos.filter((p) => p.cliente_id === cli.id) : [];
  const casosIds = new Set(casos.map((c) => c.id));
  const docsVisiveis = cli ? documentos.filter((d) => d.cliente_id === cli.id && d.visivel_cliente) : [];
  const agora = new Date().toISOString();
  const proximos = cli
    ? eventos.filter((e) => e.cliente_id === cli.id && e.inicio >= agora).sort((a, b) => a.inicio.localeCompare(b.inicio))
    : [];

  return (
    <div>
      <PageHeader
        titulo="Portal do Cliente"
        sub="Pré-visualize o que cada cliente vê ao acessar o portal pelo celular"
      />

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Para dar acesso de verdade a alguém, abra a ficha do cliente e use{" "}
        <span className="font-semibold">Liberar portal</span> — ele recebe um convite por e-mail e passa a
        enxergar apenas os próprios casos. Esta tela é só a prévia.
      </div>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Eye size={16} />
          <span>Visualizar como:</span>
        </div>
        <div className="mt-2 max-w-sm">
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione um cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Select>
        </div>
      </Card>

      {!cli ? (
        <EmptyState>
          Escolha um cliente acima para ver o portal pelos olhos dele.
          <br />
          Com o Supabase configurado, cada cliente recebe um convite por e-mail e acessa somente os próprios dados.
        </EmptyState>
      ) : (
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border-4 border-slate-900 bg-slate-50 p-4">
          <div className="rounded-xl bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-400">Camargo Advocacia Criminal</p>
            <p className="mt-1 text-lg font-bold">Olá, {cli.nome.split(" ")[0]} 👋</p>
            <p className="text-xs text-slate-300">Acompanhe aqui os seus processos.</p>
          </div>

          {proximos.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Próximos compromissos</h3>
              {proximos.map((e) => (
                <Card key={e.id} className="mb-2 p-3">
                  <p className="text-sm font-semibold text-slate-900">{e.titulo}</p>
                  <p className="text-xs text-slate-500">{TIPOS_EVENTO[e.tipo]} · {dataHoraBR(e.inicio)}{e.local ? ` · ${e.local}` : ""}</p>
                </Card>
              ))}
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Seus processos</h3>
            {casos.length === 0 ? (
              <EmptyState>Nenhum processo ativo.</EmptyState>
            ) : (
              casos.map((p) => {
                const movs = andamentos
                  .filter((a) => casosIds.has(a.processo_id) && a.processo_id === p.id)
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .slice(0, 3);
                const fase = faseInfo(p.situacao);
                return (
                  <Card key={p.id} className="mb-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[11px] text-slate-500">{formatCNJ(p.numero_cnj)}</p>
                      <Badge cor="roxo">{AREAS[p.area]}</Badge>
                    </div>
                    {fase && (
                      <div className={`mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold ${
                        fase.cor === "verde" ? "bg-emerald-50 text-emerald-800"
                        : fase.cor === "vermelho" ? "bg-red-50 text-red-800"
                        : fase.cor === "ambar" ? "bg-amber-50 text-amber-800"
                        : fase.cor === "azul" ? "bg-blue-50 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                      }`}>
                        <span>{fase.emoji}</span>
                        <span>{fase.rotuloCliente}</span>
                      </div>
                    )}
                    <p className="mt-1.5 text-sm text-slate-800">{p.objeto}</p>
                    {movs.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                        {movs.map((a) => (
                          <li key={a.id} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-500">{dataBR(a.data)}:</span> {a.descricao}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {docsVisiveis.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Seus documentos</h3>
              {docsVisiveis.map((d) => (
                <Card key={d.id} className="mb-2 flex items-center gap-2 p-3">
                  <span>📄</span>
                  <p className="truncate text-sm text-slate-800">{d.nome}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
