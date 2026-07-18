"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, Radar } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Cliente, Documento, Lancamento, Prazo, Processo } from "@/lib/types";
import { AREAS, brl, dataBR, formatCNJ, hojeISO, rotuloDias, statusLancamento, urgenciaPrazo } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export default function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { rows: processos, update } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: andamentos, insert: addAndamento } = useTable<Andamento>("andamentos");
  const { rows: prazos, insert: addPrazo, update: updatePrazo } = useTable<Prazo>("prazos");
  const { rows: documentos } = useTable<Documento>("documentos");
  const { rows: lancamentos } = useTable<Lancamento>("lancamentos");

  const proc = processos.find((p) => p.id === id);
  const cliMap = byId(clientes);

  const [modalAndamento, setModalAndamento] = useState(false);
  const [modalPrazo, setModalPrazo] = useState(false);
  const [descAndamento, setDescAndamento] = useState("");
  const [formPrazo, setFormPrazo] = useState({ titulo: "", tipo: "", data_limite: "", notas: "" });

  if (!proc) {
    return (
      <div>
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600"><ArrowLeft size={16} /> Voltar</button>
        <EmptyState>Processo não encontrado.</EmptyState>
      </div>
    );
  }

  const cli = cliMap.get(proc.cliente_id);
  const doProcesso = {
    andamentos: andamentos.filter((a) => a.processo_id === proc.id).sort((a, b) => b.data.localeCompare(a.data)),
    prazos: prazos.filter((p) => p.processo_id === proc.id).sort((a, b) => a.data_limite.localeCompare(b.data_limite)),
    documentos: documentos.filter((d) => d.processo_id === proc.id),
    lancamentos: lancamentos.filter((l) => l.processo_id === proc.id),
  };

  async function alternarMonitoramento() {
    if (!proc) return;
    const ligar = !proc.monitorado;
    await update(proc.id, { monitorado: ligar });
    if (ligar) {
      // Com a API de tribunais configurada, o servidor registra o monitoramento real;
      // sem ela, registramos o andamento informativo no modo demonstração.
      const res = await fetch("/api/tribunais/monitorar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processo_id: proc.id, numero_cnj: proc.numero_cnj }),
      }).catch(() => null);
      const simulado = !res || !res.ok || (await res.json().catch(() => ({ simulated: true }))).simulated;
      await addAndamento({
        processo_id: proc.id,
        data: hojeISO(),
        origem: "manual",
        descricao: simulado
          ? "Monitoramento automático ativado (simulado — configure a API de tribunais em Configurações)."
          : "Monitoramento automático ativado junto ao provedor de tribunais.",
      });
    }
  }

  async function salvarAndamento(e: React.FormEvent) {
    e.preventDefault();
    if (!proc || !descAndamento.trim()) return;
    await addAndamento({ processo_id: proc.id, data: hojeISO(), origem: "manual", descricao: descAndamento.trim() });
    setDescAndamento("");
    setModalAndamento(false);
  }

  async function salvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!proc || !formPrazo.titulo || !formPrazo.data_limite) return;
    await addPrazo({
      processo_id: proc.id,
      titulo: formPrazo.titulo,
      tipo: formPrazo.tipo || undefined,
      data_limite: formPrazo.data_limite,
      notas: formPrazo.notas || undefined,
      status: "pendente",
    });
    setFormPrazo({ titulo: "", tipo: "", data_limite: "", notas: "" });
    setModalPrazo(false);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader
        titulo={cli?.nome ?? "Processo"}
        sub={formatCNJ(proc.numero_cnj)}
        acao={
          <button
            onClick={alternarMonitoramento}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              proc.monitorado ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
            }`}
          >
            <Radar size={16} />
            {proc.monitorado ? "Monitorado" : "Monitorar no tribunal"}
          </button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Badge cor="roxo">{AREAS[proc.area]}</Badge>
          <Badge cor={proc.status === "ativo" ? "verde" : "cinza"}>{proc.status}</Badge>
          {proc.fase && <Badge cor="azul">{proc.fase}</Badge>}
        </div>
        <p className="mt-3 text-sm text-slate-700">{proc.objeto}</p>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {proc.parte_contraria && (
            <div className="flex gap-2"><dt className="font-medium text-slate-500">Parte contrária:</dt><dd className="text-slate-800">{proc.parte_contraria}</dd></div>
          )}
          {(proc.vara || proc.comarca) && (
            <div className="flex gap-2"><dt className="font-medium text-slate-500">Juízo:</dt><dd className="text-slate-800">{[proc.vara, proc.comarca, proc.tribunal].filter(Boolean).join(" — ")}</dd></div>
          )}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Prazos do caso</h2>
            <button onClick={() => setModalPrazo(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
              <Plus size={14} /> novo prazo
            </button>
          </div>
          {doProcesso.prazos.length === 0 ? (
            <EmptyState>Sem prazos cadastrados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {doProcesso.prazos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={p.status === "concluido"}
                      onChange={() =>
                        updatePrazo(p.id, p.status === "concluido"
                          ? { status: "pendente", concluido_em: undefined }
                          : { status: "concluido", concluido_em: hojeISO() })
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className={`truncate text-sm ${p.status === "concluido" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {p.titulo}
                    </span>
                  </label>
                  {p.status === "pendente" ? (
                    <Badge cor={["vencido", "hoje"].includes(urgenciaPrazo(p.data_limite)) ? "vermelho" : urgenciaPrazo(p.data_limite) === "urgente" ? "ambar" : "cinza"}>
                      {rotuloDias(p.data_limite)}
                    </Badge>
                  ) : (
                    <Badge cor="verde">cumprido</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Financeiro do caso</h2>
          {doProcesso.lancamentos.length === 0 ? (
            <EmptyState>Sem lançamentos vinculados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {doProcesso.lancamentos.map((l) => {
                const st = statusLancamento(l);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900">{l.descricao}</p>
                      <p className="text-xs text-slate-500">vence {dataBR(l.vencimento)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${l.tipo === "receita" ? "text-emerald-700" : "text-slate-700"}`}>
                        {l.tipo === "despesa" ? "− " : ""}{brl(l.valor)}
                      </p>
                      <Badge cor={st === "pago" ? "verde" : st === "atrasado" ? "vermelho" : "ambar"}>{st}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Andamentos</h2>
          <button onClick={() => setModalAndamento(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
            <Plus size={14} /> registrar andamento
          </button>
        </div>
        {doProcesso.andamentos.length === 0 ? (
          <EmptyState>Nenhum andamento registrado.</EmptyState>
        ) : (
          <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
            {doProcesso.andamentos.map((a) => (
              <li key={a.id} className="relative">
                <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white ${a.origem === "tribunal" ? "bg-brand-500" : "bg-slate-400"}`} />
                <p className="text-xs font-medium text-slate-500">
                  {dataBR(a.data)} {a.origem === "tribunal" && <span className="text-brand-700">· tribunal</span>}
                </p>
                <p className="text-sm text-slate-800">{a.descricao}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {doProcesso.documentos.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Documentos do caso</h2>
          <ul className="divide-y divide-slate-100">
            {doProcesso.documentos.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                <p className="truncate text-sm text-slate-800">📄 {d.nome}</p>
                {d.visivel_cliente && <Badge cor="azul">visível ao cliente</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal aberto={modalAndamento} titulo="Registrar andamento" onFechar={() => setModalAndamento(false)}>
        <form onSubmit={salvarAndamento} className="space-y-3">
          <Field rotulo="Descrição" obrigatorio>
            <Textarea required value={descAndamento} onChange={(e) => setDescAndamento(e.target.value)} placeholder="Ex.: Protocolada petição de juntada…" />
          </Field>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar</BotaoPrimario></div>
        </form>
      </Modal>

      <Modal aberto={modalPrazo} titulo="Novo prazo" onFechar={() => setModalPrazo(false)}>
        <form onSubmit={salvarPrazo} className="space-y-3">
          <Field rotulo="Título" obrigatorio>
            <Input required value={formPrazo.titulo} onChange={(e) => setFormPrazo({ ...formPrazo, titulo: e.target.value })} placeholder="Ex.: Razões de apelação" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Tipo">
              <Input value={formPrazo.tipo} onChange={(e) => setFormPrazo({ ...formPrazo, tipo: e.target.value })} placeholder="Apelação, HC…" />
            </Field>
            <Field rotulo="Data fatal" obrigatorio>
              <Input required type="date" value={formPrazo.data_limite} onChange={(e) => setFormPrazo({ ...formPrazo, data_limite: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Notas">
            <Textarea value={formPrazo.notas} onChange={(e) => setFormPrazo({ ...formPrazo, notas: e.target.value })} />
          </Field>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar prazo</BotaoPrimario></div>
        </form>
      </Modal>
    </div>
  );
}
