"use client";

// "Fechar o dia" — o único momento em que o sistema é alimentado.
//
// O Dr. Gustavo trabalha o dia inteiro no WhatsApp e no fórum; pedir que ele
// registre as coisas na hora não funcionaria. Então tudo se concentra aqui, à
// noite, em quatro passos curtos e na ordem em que ele pensa: o que andou,
// quem pagou, que prazo eu vi no e-SAJ, e o que tem amanhã.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Star, Trash2 } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Andamento, Cliente, EventoAgenda, Lancamento, Prazo, Processo, Tarefa } from "@/lib/types";
import { brl, dataBR, dataHoraBR, emCobranca, formatCNJ, hojeISO, statusLancamento, TIPOS_EVENTO } from "@/lib/format";
import { PRESETS_PRAZO, calcularPrazo } from "@/lib/prazos";
import { AndamentoRapido } from "@/components/AndamentoRapido";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";

function Passo({ n, titulo, sub, children }: { n: number; titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function FecharDiaPage() {
  const hoje = hojeISO();

  const { rows: lancamentos, update: updateLanc } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: eventos } = useTable<EventoAgenda>("eventos_agenda");
  const { rows: andamentos } = useTable<Andamento>("andamentos");
  const { insert: addPrazo } = useTable<Prazo>("prazos");
  const { rows: tarefas, insert: addTarefa, update: updateTarefa, remove: removeTarefa } = useTable<Tarefa>("tarefas");

  const cliMap = byId(clientes);
  const procMap = byId(processos);

  /* ---------- 1. o que andou hoje ---------- */
  const registradosHoje = useMemo(
    () => andamentos.filter((a) => a.data === hoje).length,
    [andamentos, hoje]
  );

  /* ---------- 2. entrou dinheiro ---------- */
  // vencidos + os que vencem nos próximos 7 dias: é a janela em que o pagamento
  // costuma cair, e mostrar a carteira inteira aqui só atrapalharia
  const limiteBaixa = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const aBaixar = useMemo(
    () =>
      lancamentos
        .filter((l) => emCobranca(l) && l.vencimento <= limiteBaixa)
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
        .slice(0, 8),
    [lancamentos, limiteBaixa]
  );

  /* ---------- 3. prazo visto no e-SAJ ---------- */
  const [pProcesso, setPProcesso] = useState("");
  const [pPreset, setPPreset] = useState("alegacoes_finais");
  const [pIntimacao, setPIntimacao] = useState(hoje);
  const [pDias, setPDias] = useState("");
  const [pSalvo, setPSalvo] = useState<string | null>(null);

  const previa = useMemo(
    () => calcularPrazo(pIntimacao, pPreset, pDias ? Number(pDias) : undefined),
    [pIntimacao, pPreset, pDias]
  );

  async function salvarPrazo(e: React.FormEvent) {
    e.preventDefault();
    const preset = PRESETS_PRAZO.find((x) => x.id === pPreset);
    if (!preset) return;
    await addPrazo({
      processo_id: pProcesso || undefined,
      titulo: preset.id === "outro" ? "Prazo processual" : preset.rotulo,
      tipo: preset.rotulo,
      data_limite: previa.dataLimite,
      data_interna: previa.dataInterna,
      status: "pendente",
      notas: `Intimação em ${dataBR(pIntimacao)} · ${previa.descricao}. Conferir no e-SAJ/eproc.`,
    });
    setPSalvo(previa.dataLimite);
    setPProcesso("");
    setPDias("");
    setTimeout(() => setPSalvo(null), 3500);
  }

  /* ---------- 4. amanhã ---------- */
  const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const compromissosAmanha = useMemo(
    () => eventos.filter((e) => e.inicio.slice(0, 10) === amanha).sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [eventos, amanha]
  );

  const [novaTarefa, setNovaTarefa] = useState("");
  const anotacoes = [...tarefas].sort((a, b) => {
    const ac = a.status === "concluida" ? 1 : 0;
    const bc = b.status === "concluida" ? 1 : 0;
    if (ac !== bc) return ac - bc;
    const ap = a.prioridade === "alta" ? 0 : 1;
    const bp = b.prioridade === "alta" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  async function adicionarTarefa(e: React.FormEvent) {
    e.preventDefault();
    const t = novaTarefa.trim();
    if (!t) return;
    setNovaTarefa("");
    await addTarefa({ titulo: t, prioridade: "media", status: "pendente" });
  }

  const dataLonga = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="space-y-4">
      <PageHeader titulo="Fechar o dia" sub={`${dataLonga} · leva uns 5 minutos`} />

      <Passo
        n={1}
        titulo="O que andou hoje?"
        sub={
          registradosHoje > 0
            ? `${registradosHoje} ${registradosHoje === 1 ? "registro feito" : "registros feitos"} hoje`
            : "Busque o caso pelo nome do cliente"
        }
      >
        <AndamentoRapido />
      </Passo>

      <Passo n={2} titulo="Entrou dinheiro?" sub="Recebíveis vencidos ou vencendo nos próximos dias">
        {aBaixar.length === 0 ? (
          <EmptyState>Nada a receber por agora. 🎉</EmptyState>
        ) : (
          <ul className="space-y-1.5">
            {aBaixar.map((l) => {
              const atrasado = statusLancamento(l) === "atrasado";
              const cli = l.cliente_id ? cliMap.get(l.cliente_id) : undefined;
              return (
                <li
                  key={l.id}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                    atrasado ? "border-red-200 bg-red-50/50" : "border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{cli?.nome ?? l.descricao}</p>
                    <p className="truncate text-xs text-slate-500">
                      vence {dataBR(l.vencimento)}
                      {atrasado && <span className="ml-1 font-semibold text-red-600">· em atraso</span>}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{brl(l.valor)}</span>
                  <button
                    onClick={() => updateLanc(l.id, { pago_em: hoje })}
                    title="marcar como recebido hoje"
                    className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Check size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/cobranca" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
          ver quem está devendo <ArrowRight size={12} />
        </Link>
      </Passo>

      <Passo n={3} titulo="Viu algum prazo no e-SAJ?" sub="Informe a intimação — o vencimento é calculado e vai para o Google Agenda">
        {pSalvo && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <Check size={15} /> Prazo salvo para <span className="font-semibold">{dataBR(pSalvo)}</span>.
          </p>
        )}
        <form onSubmit={salvarPrazo} className="space-y-3">
          <Field rotulo="Caso">
            <Select value={pProcesso} onChange={(e) => setPProcesso(e.target.value)}>
              <option value="">Sem vínculo com processo</option>
              {processos
                .filter((p) => p.status === "ativo")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {cliMap.get(p.cliente_id)?.nome ?? "—"} · {formatCNJ(p.numero_cnj)}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Tipo de prazo">
              <Select value={pPreset} onChange={(e) => setPPreset(e.target.value)}>
                {PRESETS_PRAZO.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rotulo}
                  </option>
                ))}
              </Select>
            </Field>
            <Field rotulo="Data da intimação">
              <Input type="date" value={pIntimacao} onChange={(e) => setPIntimacao(e.target.value)} />
            </Field>
          </div>
          {pPreset === "outro" && (
            <Field rotulo="Quantos dias?">
              <Input inputMode="numeric" value={pDias} onChange={(e) => setPDias(e.target.value)} placeholder="5" />
            </Field>
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-700">
              Vence em <span className="font-bold text-slate-900">{dataBR(previa.dataLimite)}</span>
              <span className="text-slate-500"> · {previa.descricao}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Aviso para preparar em {dataBR(previa.dataInterna)}. Contagem automática não considera feriado
              forense local nem suspensão — <span className="font-medium">confira no e-SAJ</span>.
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              Salvar prazo
            </button>
          </div>
        </form>
      </Passo>

      <Passo n={4} titulo="E amanhã?" sub="O que já está marcado e o que você quer lembrar">
        {compromissosAmanha.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">Nenhum compromisso marcado para amanhã.</p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {compromissosAmanha.map((e) => {
              const proc = e.processo_id ? procMap.get(e.processo_id) : undefined;
              const cli = proc ? cliMap.get(proc.cliente_id) : e.cliente_id ? cliMap.get(e.cliente_id) : undefined;
              return (
                <li key={e.id} className="rounded-lg border border-slate-200 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{e.titulo}</p>
                    <Badge cor={e.tipo === "audiencia" ? "roxo" : e.tipo === "video" ? "verde" : "azul"}>
                      {TIPOS_EVENTO[e.tipo]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {dataHoraBR(e.inicio)}
                    {cli ? ` · ${cli.nome}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={adicionarTarefa} className="mb-2 flex gap-2">
          <input
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            placeholder="Anotar para amanhã…"
            className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
            Anotar
          </button>
        </form>

        {anotacoes.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {anotacoes.map((t) => {
              const feita = t.status === "concluida";
              return (
                <li key={t.id} className="group flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    checked={feita}
                    onChange={() => updateTarefa(t.id, { status: feita ? "pendente" : "concluida" })}
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span
                    className={`min-w-0 flex-1 text-sm ${
                      feita ? "text-slate-400 line-through" : t.prioridade === "alta" ? "font-bold text-slate-900" : "text-slate-800"
                    }`}
                  >
                    {t.titulo}
                  </span>
                  {!feita && (
                    <button
                      onClick={() => updateTarefa(t.id, { prioridade: t.prioridade === "alta" ? "media" : "alta" })}
                      title={t.prioridade === "alta" ? "tirar urgência" : "marcar urgente"}
                      className="shrink-0 text-slate-400 hover:text-amber-500"
                    >
                      <Star size={16} className={t.prioridade === "alta" ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                  )}
                  <button onClick={() => removeTarefa(t.id)} title="apagar" className="shrink-0 text-slate-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Passo>

      <Card className="border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-900">Dia fechado. 🌙</p>
        <p className="mt-0.5 text-xs text-emerald-800">
          Os prazos salvos aparecem no seu Google Agenda com alarme na véspera.
        </p>
      </Card>
    </div>
  );
}
