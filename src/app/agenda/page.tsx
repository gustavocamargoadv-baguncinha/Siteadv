"use client";

import { useMemo, useState } from "react";
import { Plus, Video } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, EventoAgenda, Membro, Prazo, Processo } from "@/lib/types";
import { dataBR, dataHoraBR, diasAteISO, formatCNJ, hojeISO, rotuloDias, urgenciaPrazo, TIPOS_EVENTO } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

const COR_URGENCIA = { vencido: "vermelho", hoje: "vermelho", urgente: "ambar", proximo: "azul", tranquilo: "cinza" } as const;

export default function AgendaPage() {
  const { rows: prazos, insert: addPrazo, update: updatePrazo } = useTable<Prazo>("prazos");
  const { rows: eventos, insert: addEvento } = useTable<EventoAgenda>("eventos_agenda");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: membros } = useTable<Membro>("membros");

  const procMap = byId(processos);
  const cliMap = byId(clientes);
  const memMap = byId(membros);

  const [aba, setAba] = useState<"prazos" | "eventos">("prazos");
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);
  const [modalPrazo, setModalPrazo] = useState(false);
  const [modalEvento, setModalEvento] = useState(false);

  const [formPrazo, setFormPrazo] = useState({ titulo: "", processo_id: "", tipo: "", data_limite: "", responsavel_id: "", notas: "" });
  const [formEvento, setFormEvento] = useState({ tipo: "audiencia", titulo: "", processo_id: "", inicio: "", local: "", link_virtual: "", notas: "" });

  const prazosOrdenados = useMemo(
    () =>
      prazos
        .filter((p) => (mostrarConcluidos ? true : p.status === "pendente"))
        .sort((a, b) => a.data_limite.localeCompare(b.data_limite)),
    [prazos, mostrarConcluidos]
  );

  const eventosFuturos = useMemo(() => {
    const corte = new Date();
    corte.setHours(0, 0, 0, 0);
    return eventos.filter((e) => new Date(e.inicio) >= corte).sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [eventos]);

  async function salvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    if (!formPrazo.titulo || !formPrazo.data_limite) return;
    await addPrazo({
      titulo: formPrazo.titulo,
      processo_id: formPrazo.processo_id || undefined,
      tipo: formPrazo.tipo || undefined,
      data_limite: formPrazo.data_limite,
      responsavel_id: formPrazo.responsavel_id || undefined,
      notas: formPrazo.notas || undefined,
      status: "pendente",
    });
    setFormPrazo({ titulo: "", processo_id: "", tipo: "", data_limite: "", responsavel_id: "", notas: "" });
    setModalPrazo(false);
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!formEvento.titulo || !formEvento.inicio) return;
    const proc = formEvento.processo_id ? procMap.get(formEvento.processo_id) : undefined;
    await addEvento({
      tipo: formEvento.tipo as EventoAgenda["tipo"],
      titulo: formEvento.titulo,
      processo_id: formEvento.processo_id || undefined,
      cliente_id: proc?.cliente_id,
      inicio: new Date(formEvento.inicio).toISOString(),
      local: formEvento.local || undefined,
      link_virtual: formEvento.link_virtual || undefined,
      notas: formEvento.notas || undefined,
    });
    setFormEvento({ tipo: "audiencia", titulo: "", processo_id: "", inicio: "", local: "", link_virtual: "", notas: "" });
    setModalEvento(false);
  }

  return (
    <div>
      <PageHeader
        titulo="Agenda e Prazos"
        sub="Prazos fatais, audiências e compromissos"
        acao={
          aba === "prazos" ? (
            <BotaoPrimario onClick={() => setModalPrazo(true)}><Plus size={16} /> Novo prazo</BotaoPrimario>
          ) : (
            <BotaoPrimario onClick={() => setModalEvento(true)}><Plus size={16} /> Novo compromisso</BotaoPrimario>
          )
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(["prazos", "eventos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
                aba === t ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "prazos" ? "Prazos" : "Compromissos"}
            </button>
          ))}
        </div>
        {aba === "prazos" && (
          <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
            <input type="checkbox" checked={mostrarConcluidos} onChange={(e) => setMostrarConcluidos(e.target.checked)} className="accent-brand-600" />
            mostrar cumpridos
          </label>
        )}
      </div>

      {aba === "prazos" ? (
        prazosOrdenados.length === 0 ? (
          <EmptyState>Nenhum prazo pendente. 🎉</EmptyState>
        ) : (
          <div className="space-y-2">
            {prazosOrdenados.map((p) => {
              const proc = p.processo_id ? procMap.get(p.processo_id) : undefined;
              const cli = proc ? cliMap.get(proc.cliente_id) : undefined;
              const resp = p.responsavel_id ? memMap.get(p.responsavel_id) : undefined;
              const u = urgenciaPrazo(p.data_limite);
              const pendente = p.status === "pendente";
              return (
                <Card
                  key={p.id}
                  className={`flex items-start gap-3 p-4 ${pendente && ["vencido", "hoje"].includes(u) ? "border-red-300 bg-red-50/50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!pendente}
                    onChange={() =>
                      updatePrazo(p.id, pendente
                        ? { status: "concluido", concluido_em: hojeISO() }
                        : { status: "pendente", concluido_em: undefined })
                    }
                    className="mt-1 h-4 w-4 accent-brand-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold ${pendente ? "text-slate-900" : "text-slate-400 line-through"}`}>{p.titulo}</p>
                      {pendente ? <Badge cor={COR_URGENCIA[u]}>{rotuloDias(p.data_limite)}</Badge> : <Badge cor="verde">cumprido</Badge>}
                      {p.tipo && <Badge cor="cinza">{p.tipo}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {dataBR(p.data_limite)}
                      {proc && ` · ${formatCNJ(proc.numero_cnj)}`}
                      {cli && ` · ${cli.nome}`}
                      {resp && ` · resp.: ${resp.nome.split(" ")[0]}`}
                    </p>
                    {p.notas && <p className="mt-1 text-xs text-slate-600">{p.notas}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : eventosFuturos.length === 0 ? (
        <EmptyState>Nenhum compromisso futuro.</EmptyState>
      ) : (
        <div className="space-y-2">
          {eventosFuturos.map((e) => {
            const cli = e.cliente_id ? cliMap.get(e.cliente_id) : undefined;
            const proc = e.processo_id ? procMap.get(e.processo_id) : undefined;
            const emDias = diasAteISO(e.inicio.slice(0, 10));
            return (
              <Card key={e.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{e.titulo}</p>
                  <Badge cor={e.tipo === "audiencia" ? "roxo" : e.tipo === "sustentacao" ? "vermelho" : e.tipo === "video" ? "verde" : "azul"}>{TIPOS_EVENTO[e.tipo]}</Badge>
                  {emDias <= 1 && <Badge cor="ambar">{emDias === 0 ? "hoje" : "amanhã"}</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {dataHoraBR(e.inicio)}
                  {e.local && ` · ${e.local}`}
                  {cli && ` · ${cli.nome}`}
                  {proc && ` · ${formatCNJ(proc.numero_cnj)}`}
                </p>
                {e.notas && <p className="mt-1.5 text-xs text-slate-600">{e.notas}</p>}
                {e.link_virtual && (
                  <a
                    href={e.link_virtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    <Video size={14} /> Entrar na reunião
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal aberto={modalPrazo} titulo="Novo prazo" onFechar={() => setModalPrazo(false)}>
        <form onSubmit={salvarPrazo} className="space-y-3">
          <Field rotulo="Título" obrigatorio>
            <Input required value={formPrazo.titulo} onChange={(e) => setFormPrazo({ ...formPrazo, titulo: e.target.value })} placeholder="Ex.: Contrarrazões — cliente X" />
          </Field>
          <Field rotulo="Processo">
            <Select value={formPrazo.processo_id} onChange={(e) => setFormPrazo({ ...formPrazo, processo_id: e.target.value })}>
              <option value="">Sem vínculo</option>
              {processos.filter((p) => p.status === "ativo").map((p) => (
                <option key={p.id} value={p.id}>
                  {formatCNJ(p.numero_cnj)} — {cliMap.get(p.cliente_id)?.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Data fatal" obrigatorio>
              <Input required type="date" value={formPrazo.data_limite} onChange={(e) => setFormPrazo({ ...formPrazo, data_limite: e.target.value })} />
            </Field>
            <Field rotulo="Responsável">
              <Select value={formPrazo.responsavel_id} onChange={(e) => setFormPrazo({ ...formPrazo, responsavel_id: e.target.value })}>
                <option value="">—</option>
                {membros.filter((m) => m.ativo).map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field rotulo="Notas">
            <Textarea value={formPrazo.notas} onChange={(e) => setFormPrazo({ ...formPrazo, notas: e.target.value })} />
          </Field>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar prazo</BotaoPrimario></div>
        </form>
      </Modal>

      <Modal aberto={modalEvento} titulo="Novo compromisso" onFechar={() => setModalEvento(false)}>
        <form onSubmit={salvarEvento} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Tipo">
              <Select value={formEvento.tipo} onChange={(e) => setFormEvento({ ...formEvento, tipo: e.target.value })}>
                {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field rotulo="Data e hora" obrigatorio>
              <Input required type="datetime-local" value={formEvento.inicio} onChange={(e) => setFormEvento({ ...formEvento, inicio: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Título" obrigatorio>
            <Input required value={formEvento.titulo} onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })} />
          </Field>
          <Field rotulo="Processo">
            <Select value={formEvento.processo_id} onChange={(e) => setFormEvento({ ...formEvento, processo_id: e.target.value })}>
              <option value="">Sem vínculo</option>
              {processos.filter((p) => p.status === "ativo").map((p) => (
                <option key={p.id} value={p.id}>
                  {formatCNJ(p.numero_cnj)} — {cliMap.get(p.cliente_id)?.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Local">
              <Input value={formEvento.local} onChange={(e) => setFormEvento({ ...formEvento, local: e.target.value })} placeholder="Fórum, escritório…" />
            </Field>
            <Field rotulo="Link da videochamada">
              <Input value={formEvento.link_virtual} onChange={(e) => setFormEvento({ ...formEvento, link_virtual: e.target.value })} placeholder="Cole o link do Teams / Meet / Zoom" />
            </Field>
          </div>
          <Field rotulo="Notas">
            <Textarea value={formEvento.notas} onChange={(e) => setFormEvento({ ...formEvento, notas: e.target.value })} />
          </Field>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar compromisso</BotaoPrimario></div>
        </form>
      </Modal>
    </div>
  );
}
