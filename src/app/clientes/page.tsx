"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, Processo } from "@/lib/types";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

export default function ClientesPage() {
  const { rows: clientes, insert } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");

  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipo: "pf", nome: "", cpf_cnpj: "", email: "", telefone: "", endereco: "", notas: "" });

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return clientes
      .filter((c) => !q || c.nome.toLowerCase().includes(q) || (c.cpf_cnpj ?? "").includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes, busca]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    await insert({
      ...form,
      tipo: form.tipo as Cliente["tipo"],
      cpf_cnpj: form.cpf_cnpj || undefined,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      endereco: form.endereco || undefined,
      notas: form.notas || undefined,
    });
    setModal(false);
    setForm({ tipo: "pf", nome: "", cpf_cnpj: "", email: "", telefone: "", endereco: "", notas: "" });
  }

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        sub={`${clientes.length} cadastrados`}
        acao={<BotaoPrimario onClick={() => setModal(true)}><Plus size={16} /> Novo cliente</BotaoPrimario>}
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CPF/CNPJ…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState>Nenhum cliente encontrado.</EmptyState>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => {
            const casos = processos.filter((p) => p.cliente_id === c.id);
            const ativos = casos.filter((p) => p.status === "ativo").length;
            return (
              <Link key={c.id} href={`/clientes/${c.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-brand-400 hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.nome}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[c.cpf_cnpj, c.telefone].filter(Boolean).join(" · ") || "sem contato cadastrado"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge cor="cinza">{c.tipo === "pf" ? "PF" : "PJ"}</Badge>
                    <Badge cor={ativos > 0 ? "verde" : "cinza"}>{ativos} ativo{ativos === 1 ? "" : "s"}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal aberto={modal} titulo="Novo cliente" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="space-y-3">
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
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar cliente</BotaoPrimario></div>
        </form>
      </Modal>
    </div>
  );
}
