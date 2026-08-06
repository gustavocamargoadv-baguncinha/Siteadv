"use client";

// O que o CLIENTE vê ao entrar com o próprio login.
//
// Duas travas independentes, de propósito:
//  1) no banco, a RLS (migration 0003) só devolve as linhas dele — é a que
//     realmente protege;
//  2) aqui, o app do escritório nunca chega a ser renderizado para um cliente
//     (o LoginGate escolhe uma tela ou outra), então nem menu interno existe.
//
// Nada de financeiro nesta tela: honorário, parcela e cobrança são assunto
// entre o escritório e o cliente, não conteúdo de autoatendimento.

import { useMemo } from "react";
import { LogOut, Scale } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Documento, EventoAgenda, Processo } from "@/lib/types";
import { dataBR, dataHoraBR, formatCNJ, TIPOS_EVENTO } from "@/lib/format";
import { faseInfo } from "@/lib/fases";
import { sair } from "@/lib/supabase";

export function PortalCliente({ nome }: { nome?: string }) {
  const { rows: processos, loading } = useTable<Processo>("processos");
  const { rows: andamentos } = useTable<Andamento>("andamentos");
  const { rows: eventos } = useTable<EventoAgenda>("eventos_agenda");
  const { rows: documentos } = useTable<Documento>("documentos");
  const procMap = byId(processos);

  const agora = new Date().toISOString();
  const proximos = useMemo(
    () => eventos.filter((e) => e.inicio >= agora).sort((a, b) => a.inicio.localeCompare(b.inicio)).slice(0, 5),
    [eventos, agora]
  );

  const primeiro = (nome ?? "").trim().split(/\s+/)[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-camargo.png" alt="Gustavo Camargo Advocacia" className="h-8" />
          <button
            onClick={() => sair()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {saudacao}{primeiro ? `, ${primeiro}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Acompanhe aqui o andamento do seu caso.</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : processos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-sm text-slate-600">
              Ainda não há caso liberado para acompanhamento. Qualquer dúvida, fale com o escritório.
            </p>
          </div>
        ) : (
          processos.map((p) => {
            const info = p.situacao ? faseInfo(p.situacao) : undefined;
            const hist = andamentos
              .filter((a) => a.processo_id === p.id)
              .sort((a, b) => b.data.localeCompare(a.data))
              .slice(0, 6);
            const docs = documentos.filter((d) => d.processo_id === p.id && d.visivel_cliente);
            return (
              <section key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{p.objeto}</h2>
                  {info && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {info.emoji} {info.rotuloCliente}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{formatCNJ(p.numero_cnj)}</p>

                {hist.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Últimas movimentações
                    </p>
                    <ul className="space-y-2">
                      {hist.map((a) => (
                        <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                          <p className="text-sm text-slate-800">{a.descricao}</p>
                          <p className="text-xs text-slate-400">{dataBR(a.data)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {docs.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Documentos</p>
                    <ul className="space-y-1">
                      {docs.map((d) => (
                        <li key={d.id} className="text-sm text-slate-700">
                          {d.nome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })
        )}

        {proximos.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900">📅 Próximos compromissos</h2>
            <ul className="space-y-2">
              {proximos.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{e.titulo}</p>
                    <p className="text-xs text-slate-500">{dataHoraBR(e.inicio)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {TIPOS_EVENTO[e.tipo]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-slate-400">
          <Scale size={12} /> Gustavo Camargo Advocacia — OAB/SP 431.515
        </p>
      </main>
    </div>
  );
}
