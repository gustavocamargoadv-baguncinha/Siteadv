"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, ContratoHonorarios, Documento, Lancamento, Processo } from "@/lib/types";
import { AREAS, brl, dataBR, formatCNJ, statusLancamento, TIPOS_HONORARIOS } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { GerarDocumentos } from "@/components/GerarDocumentos";

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { rows: clientes, update: updateCliente } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: contratos } = useTable<ContratoHonorarios>("contratos_honorarios");
  const { rows: lancamentos } = useTable<Lancamento>("lancamentos");
  const { rows: documentos } = useTable<Documento>("documentos");

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    tipo: "pf", nome: "", cpf_cnpj: "", rg: "", nacionalidade: "", estado_civil: "", profissao: "",
    email: "", telefone: "", endereco: "", notas: "",
  });

  const cli = clientes.find((c) => c.id === id);

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
  const emAberto = financeiro.filter((l) => l.tipo === "receita" && !l.pago_em).reduce((s, l) => s + l.valor, 0);

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
  const proximaParcela = recebiveis.find((l) => !l.pago_em);

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader
        titulo={cli.nome}
        sub={cli.tipo === "pf" ? `CPF ${cli.cpf_cnpj ?? "—"}` : `CNPJ ${cli.cpf_cnpj ?? "—"}`}
        acao={
          <button
            onClick={abrirEdicao}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
          >
            <Pencil size={15} /> Editar
          </button>
        }
      />

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
            {emAberto > 0 && <Badge cor="ambar">{brl(emAberto)} em aberto</Badge>}
          </div>
          {financeiro.length === 0 ? (
            <EmptyState>Sem lançamentos.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {financeiro.slice(0, 6).map((l) => {
                const st = statusLancamento(l);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800">{l.descricao}</p>
                      <p className="text-xs text-slate-500">vence {dataBR(l.vencimento)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{brl(l.valor)}</p>
                      <Badge cor={st === "pago" ? "verde" : st === "atrasado" ? "vermelho" : "ambar"}>{st}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
    </div>
  );
}
