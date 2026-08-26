"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, HeartHandshake, KeyRound, Mail, MapPin, Pencil, Phone, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, ContratoHonorarios, Documento, Lancamento, Processo } from "@/lib/types";
import { AREAS, brl, dataBR, emCobranca, formatCNJ, statusLancamento, TIPOS_HONORARIOS } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { GerarDocumentos } from "@/components/GerarDocumentos";
import { EditarLancamento } from "@/components/EditarLancamento";

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { rows: clientes, update: updateCliente, remove: removeCliente } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: contratos, remove: removeContrato } = useTable<ContratoHonorarios>("contratos_honorarios");
  const { rows: lancamentos, update, remove: removeLancamento } = useTable<Lancamento>("lancamentos");
  const { rows: documentos, remove: removeDocumento } = useTable<Documento>("documentos");

  const [editando, setEditando] = useState(false);
  // Lançamento em correção pela ficha (null = novo lançamento para este cliente)
  const [modalLanc, setModalLanc] = useState(false);
  const [lancEditando, setLancEditando] = useState<Lancamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const [avisoPortal, setAvisoPortal] = useState<{ ok: boolean; texto: string } | null>(null);
  const [form, setForm] = useState({
    tipo: "pf", nome: "", cpf_cnpj: "", rg: "", nacionalidade: "", estado_civil: "", profissao: "",
    email: "", telefone: "", endereco: "", notas: "",
  });

  const cli = clientes.find((c) => c.id === id);

  // Libera o acesso do cliente ao portal: manda o convite por e-mail e amarra
  // aquele login à ficha. O que ele passa a enxergar é decidido pela RLS no
  // banco (migration 0003), não por esta tela.
  async function liberarPortal() {
    if (!cli || convidando) return;
    if (!cli.email) {
      setAvisoPortal({ ok: false, texto: "Cadastre o e-mail do cliente antes de liberar o portal." });
      return;
    }
    setConvidando(true);
    setAvisoPortal(null);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      const r = await fetch("/api/portal/convidar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ cliente_id: cli.id, email: cli.email, nome: cli.nome }),
      });
      const json = await r.json();
      setAvisoPortal(
        r.ok
          ? { ok: true, texto: `Convite enviado para ${cli.email}. O cliente define a senha pelo link do e-mail.` }
          : { ok: false, texto: json?.erro ?? "Não foi possível liberar o acesso." }
      );
    } catch {
      setAvisoPortal({ ok: false, texto: "Falha de conexão ao liberar o acesso." });
    }
    setConvidando(false);
  }

  function abrirEdicao() {
    if (!cli) return;
    setForm({
      tipo: cli.tipo,
      nome: cli.nome,
      cpf_cnpj: cli.cpf_cnpj ?? "",
      rg: cli.rg ?? "",
      nacionalidade: cli.nacionalidade ?? "",
      estado_civil: cli.estado_civil ?? "",
      profissao: cli.profissao ?? "",
      email: cli.email ?? "",
      telefone: cli.telefone ?? "",
      endereco: cli.endereco ?? "",
      notas: cli.notas ?? "",
    });
    setEditando(true);
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!cli || !form.nome.trim()) return;
    await updateCliente(cli.id, {
      tipo: form.tipo as Cliente["tipo"],
      nome: form.nome.trim(),
      cpf_cnpj: form.cpf_cnpj || undefined,
      rg: form.rg || undefined,
      nacionalidade: form.nacionalidade || undefined,
      estado_civil: form.estado_civil || undefined,
      profissao: form.profissao || undefined,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      endereco: form.endereco || undefined,
      notas: form.notas || undefined,
    });
    setEditando(false);
  }

  if (!cli) {
    return (
      <div>
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600"><ArrowLeft size={16} /> Voltar</button>
        <EmptyState>Cliente não encontrado.</EmptyState>
      </div>
    );
  }

  const casos = processos.filter((p) => p.cliente_id === cli.id);
  const contratosCli = contratos.filter((h) => h.cliente_id === cli.id);
  const financeiro = lancamentos.filter((l) => l.cliente_id === cli.id);
  const docs = documentos.filter((d) => d.cliente_id === cli.id);
  const emAberto = financeiro.filter(emCobranca).reduce((s, l) => s + l.valor, 0);
  // Perdoado fica à parte do "em aberto": não é dívida (não se cobra mais) nem
  // receita (nunca entrou). É o histórico — o que pesa antes de aceitar um caso
  // novo desse cliente.
  const perdoado = financeiro.filter((l) => l.tipo === "receita" && l.perdoado_em);
  const totalPerdoado = perdoado.reduce((s, l) => s + l.valor, 0);

  // Resumo contratado × recebido × em aberto (reproduz a antiga aba "Processos" da planilha)
  const totalContratado = contratosCli.reduce((s, h) => s + (h.valor_fixo ?? 0), 0);
  const totalRecebido = financeiro
    .filter((l) => l.tipo === "receita" && l.pago_em)
    .reduce((s, l) => s + l.valor, 0);
  const saldoContrato = totalContratado - totalRecebido;

  // Em qual parcela o cliente está: conta os recebíveis pagos × total, em ordem
  // de vencimento, e aponta a próxima em aberto.
  const recebiveis = financeiro
    .filter((l) => l.tipo === "receita")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const parcelasTotal = recebiveis.length;
  const parcelasPagas = recebiveis.filter((l) => l.pago_em).length;
  const proximaParcela = recebiveis.find((l) => emCobranca(l));

  // O card do Financeiro mostra um recorte, não a lista inteira — e sem ordem
  // nenhuma ele mostrava as linhas mais RECÉM-CRIADAS. Como o gerador cria de
  // uma vez todas as parcelas futuras do contrato, elas ocupavam as vagas e o
  // histórico de pagamentos do cliente sumia da própria ficha dele: ficava a
  // impressão de que ele nunca pagou nada.
  //
  // O recorte agora é metade de cada lado — o que se cobra e o que já entrou —
  // para nenhum dos dois esconder o outro.
  const aCobrar = financeiro
    .filter(emCobranca)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento)); // atrasada no topo
  const dataLiquidacao = (l: Lancamento) => l.pago_em ?? l.perdoado_em ?? "";
  const liquidados = financeiro
    .filter((l) => l.tipo === "receita" && (l.pago_em || l.perdoado_em))
    .sort((a, b) => dataLiquidacao(b).localeCompare(dataLiquidacao(a))); // mais recente no topo
  const POR_LADO = 4;
  const aCobrarVisiveis = aCobrar.slice(0, POR_LADO);
  const liquidadosVisiveis = liquidados.slice(0, POR_LADO);
  const visiveis = aCobrarVisiveis.length + liquidadosVisiveis.length;

  /** Uma linha do card do Financeiro. As duas listas desenham igual — separá-las
   *  em dois blocos de JSX faria uma divergir da outra na primeira mudança. */
  const linhaLancamento = (l: Lancamento) => {
    const st = statusLancamento(l);
    return (
      <li key={l.id} className="flex items-center justify-between gap-2 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-800">{l.descricao}</p>
          <p className="text-xs text-slate-500">
            {l.pago_em
              ? `recebido em ${dataBR(l.pago_em)}`
              : l.perdoado_em
                ? `perdoado em ${dataBR(l.perdoado_em)}`
                : `vence ${dataBR(l.vencimento)}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-slate-800">{brl(l.valor)}</p>
          <Badge cor={st === "pago" ? "verde" : st === "atrasado" ? "vermelho" : st === "perdoado" ? "cinza" : "ambar"}>
            {st === "pago" ? "recebido" : st}
          </Badge>
        </div>
        {/* corrigir valor e data sem ter de achar o lançamento no
            Financeiro: a dívida se discute olhando a ficha */}
        <button
          onClick={() => {
            setLancEditando(l);
            setModalLanc(true);
          }}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="Corrigir ou apagar este lançamento"
        >
          <Pencil size={14} />
        </button>
      </li>
    );
  };

  /** Apaga o cliente e o que só existe por causa dele.
   *
   *  Os lançamentos vão explicitamente, um a um, ANTES do cliente: no banco a
   *  chave é `on delete set null`, então apagar só o cliente deixaria os
   *  pagamentos órfãos — eles sumiriam da ficha mas continuariam somando no
   *  faturamento como "Sem vínculo", que é justamente o que se quer eliminar.
   *
   *  Processos não são apagados aqui: um caso criminal apagado por engano não
   *  tem volta, então a exclusão fica bloqueada enquanto houver algum. */
  async function excluirCliente() {
    if (!cli) return;
    setApagando(true);
    try {
      for (const l of financeiro) await removeLancamento(l.id);
      for (const c of contratosCli) await removeContrato(c.id);
      for (const d of docs) await removeDocumento(d.id);
      await removeCliente(cli.id);
      router.push("/clientes");
    } finally {
      setApagando(false);
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader
        titulo={cli.nome}
        sub={cli.tipo === "pf" ? `CPF ${cli.cpf_cnpj ?? "—"}` : `CNPJ ${cli.cpf_cnpj ?? "—"}`}
        acao={
          <div className="flex gap-2">
            <button
              onClick={liberarPortal}
              disabled={convidando}
              title={cli.email ? `Convidar ${cli.email}` : "Cadastre o e-mail do cliente primeiro"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
            >
              <KeyRound size={15} /> {convidando ? "Enviando…" : "Liberar portal"}
            </button>
            <button
              onClick={abrirEdicao}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
            >
              <Pencil size={15} /> Editar
            </button>
          </div>
        }
      />

      {avisoPortal && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            avisoPortal.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {avisoPortal.texto}
        </p>
      )}

      <Card className="space-y-2 p-4 text-sm text-slate-700">
        {cli.telefone && <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /> {cli.telefone}</p>}
        {cli.email && <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /> {cli.email}</p>}
        {cli.endereco && <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" /> {cli.endereco}</p>}
        {cli.notas && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">📌 {cli.notas}</p>}
      </Card>

      {totalContratado > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Contratado</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{brl(totalContratado)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Recebido</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700">{brl(totalRecebido)}</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${saldoContrato > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">Em aberto</p>
            <p className={`mt-0.5 text-lg font-bold ${saldoContrato > 0 ? "text-amber-700" : "text-slate-900"}`}>{brl(Math.max(0, saldoContrato))}</p>
          </div>
        </div>
      )}

      {parcelasTotal > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Parcelas</h2>
            <span className="text-sm font-semibold text-slate-700">{parcelasPagas} de {parcelasTotal} pagas</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((parcelasPagas / parcelasTotal) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {proximaParcela
              ? `Está na parcela ${parcelasPagas + 1} de ${parcelasTotal} — próxima: ${brl(proximaParcela.valor)}, vence ${dataBR(proximaParcela.vencimento)}.`
              : "✓ Todas as parcelas quitadas."}
          </p>
        </Card>
      )}

      <GerarDocumentos key={cli.id} cliente={cli} />

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Processos ({casos.length})</h2>
        {casos.length === 0 ? (
          <EmptyState>Nenhum processo vinculado.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {casos.map((p) => (
              <li key={p.id}>
                <Link href={`/processos/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">{formatCNJ(p.numero_cnj)}</p>
                    <p className="truncate text-sm text-slate-800">{p.objeto}</p>
                  </div>
                  <Badge cor="roxo">{AREAS[p.area]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Contratos de honorários</h2>
          {contratosCli.length === 0 ? (
            <EmptyState>Sem contratos cadastrados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {contratosCli.map((h) => (
                <li key={h.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-800">{h.descricao ?? TIPOS_HONORARIOS[h.tipo]}</p>
                    <Badge cor={h.status === "ativo" ? "verde" : "cinza"}>{h.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {TIPOS_HONORARIOS[h.tipo]}
                    {h.valor_fixo ? ` · ${brl(h.valor_fixo)}` : ""}
                    {h.valor_hora ? ` · ${brl(h.valor_hora)}/h` : ""}
                    {h.percentual_exito ? ` · ${h.percentual_exito}% êxito` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Financeiro</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {emAberto > 0 && <Badge cor="ambar">{brl(emAberto)} em aberto</Badge>}
              {totalPerdoado > 0 && <Badge cor="cinza">{brl(totalPerdoado)} perdoado</Badge>}
            </div>
          </div>
          {totalPerdoado > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <HeartHandshake size={14} className="shrink-0 text-slate-400" />
              <p className="min-w-0 flex-1 text-xs text-slate-600">
                O escritório abriu mão de <span className="font-semibold tabular-nums">{brl(totalPerdoado)}</span>
                {perdoado[0]?.perdoado_em && ` em ${dataBR(perdoado[0].perdoado_em)}`}
                {perdoado[0]?.perdoado_motivo && ` — ${perdoado[0].perdoado_motivo}`}.
              </p>
              <button
                onClick={async () => {
                  for (const l of perdoado) await update(l.id, { perdoado_em: null, perdoado_motivo: null });
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                title="Devolver à cobrança ativa"
              >
                <RotateCcw size={12} /> devolver
              </button>
            </div>
          )}
          {financeiro.length === 0 ? (
            <EmptyState>Sem lançamentos.</EmptyState>
          ) : (
            <div className="space-y-3">
              {aCobrarVisiveis.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">A cobrar</p>
                  <ul className="divide-y divide-slate-100">{aCobrarVisiveis.map(linhaLancamento)}</ul>
                </div>
              )}
              {liquidadosVisiveis.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Já recebido</p>
                  <ul className="divide-y divide-slate-100">{liquidadosVisiveis.map(linhaLancamento)}</ul>
                </div>
              )}
            </div>
          )}
          {financeiro.length > visiveis && (
            <p className="mt-2 text-xs text-slate-400">
              Mostrando {visiveis} de {financeiro.length}. Os demais estão no{" "}
              <Link href="/financeiro" className="font-semibold text-brand-700 hover:underline">
                Financeiro
              </Link>
              .
            </p>
          )}
          <button
            onClick={() => {
              setLancEditando(null);
              setModalLanc(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            <Plus size={14} /> Lançar para este cliente
          </button>
        </Card>
      </div>

      {docs.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Documentos</h2>
          <ul className="divide-y divide-slate-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                <p className="truncate text-sm text-slate-800">📄 {d.nome}</p>
                {d.visivel_cliente && <Badge cor="azul">no portal</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal aberto={editando} titulo={`Editar — ${cli.nome}`} onFechar={() => setEditando(false)}>
        <form onSubmit={salvarEdicao} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="pf">Pessoa física</option>
                <option value="pj">Pessoa jurídica</option>
              </Select>
            </Field>
            <Field rotulo={form.tipo === "pf" ? "CPF" : "CNPJ"}>
              <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Nome completo" obrigatorio>
            <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          {form.tipo === "pf" && (
            <div className="grid grid-cols-2 gap-3">
              <Field rotulo="RG">
                <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} placeholder="00.000.000-0 SSP/SP" />
              </Field>
              <Field rotulo="Nacionalidade">
                <Input value={form.nacionalidade} onChange={(e) => setForm({ ...form, nacionalidade: e.target.value })} placeholder="brasileiro / brasileira" />
              </Field>
              <Field rotulo="Estado civil">
                <Input value={form.estado_civil} onChange={(e) => setForm({ ...form, estado_civil: e.target.value })} placeholder="solteiro / casada…" />
              </Field>
              <Field rotulo="Profissão">
                <Input value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })} />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Telefone">
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 9…" />
            </Field>
            <Field rotulo="E-mail">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field rotulo="Endereço">
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </Field>
          <Field rotulo="Notas">
            <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ex.: réu preso, contato pela família…" />
          </Field>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar alterações</BotaoPrimario></div>
        </form>
      </Modal>

      <EditarLancamento
        aberto={modalLanc}
        lancamento={lancEditando}
        clienteFixo={cli.id}
        onFechar={() => setModalLanc(false)}
      />

      {/* Zona de exclusão — discreta e no fim da página de propósito */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => setExcluindo(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={13} /> Excluir cliente
        </button>
      </div>

      <Modal aberto={excluindo} titulo="Excluir cliente" onFechar={() => setExcluindo(false)}>
        {casos.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{cli.nome}</span> tem {casos.length} processo
              {casos.length === 1 ? "" : "s"} cadastrado{casos.length === 1 ? "" : "s"}. A exclusão fica bloqueada
              enquanto houver algum — processo apagado por engano não tem volta.
            </p>
            <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
              Se o cadastro entrou por engano (uma transferência que não era honorário, por exemplo), apague antes os
              processos ligados a ele. Se for cliente de verdade que você só não quer mais ver na lista, o caminho é
              encerrar os casos, não excluir a ficha.
            </p>
            <div className="flex justify-end">
              <button onClick={() => setExcluindo(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
                Entendi
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Apagar <span className="font-semibold">{cli.nome}</span> e tudo que existe por causa dele. Isto{" "}
              <span className="font-semibold">não</span> tem desfazer.
            </p>
            <ul className="space-y-1 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
              <li className="flex justify-between gap-3">
                <span>Lançamentos no financeiro</span>
                <span className="tabular-nums">
                  {financeiro.length} · {brl(financeiro.reduce((s, l) => s + l.valor, 0))}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Contratos de honorários</span>
                <span className="tabular-nums">{contratosCli.length}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Documentos</span>
                <span className="tabular-nums">{docs.length}</span>
              </li>
            </ul>
            {totalRecebido > 0 && (
              <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                {brl(totalRecebido)} já recebidos vão sair do faturamento — o total do ano e os gráficos do Desempenho
                mudam. É o que se espera quando o valor não era honorário.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setExcluindo(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={excluirCliente}
                disabled={apagando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
              >
                <Trash2 size={15} /> {apagando ? "Apagando…" : "Apagar definitivamente"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
