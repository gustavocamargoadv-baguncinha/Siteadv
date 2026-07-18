"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Membro, Prazo, Tarefa } from "@/lib/types";
import { PAPEIS } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";

const COR_PAPEL = { admin: "roxo", advogado: "azul", estagiario: "ambar", secretaria: "verde" } as const;

export default function EquipePage() {
  const { rows: membros, insert, update } = useTable<Membro>("membros");
  const { rows: prazos } = useTable<Prazo>("prazos");
  const { rows: tarefas } = useTable<Tarefa>("tarefas");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", papel: "advogado", oab: "", telefone: "" });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email) return;
    await insert({
      nome: form.nome,
      email: form.email,
      papel: form.papel as Membro["papel"],
      oab: form.oab || undefined,
      telefone: form.telefone || undefined,
      ativo: true,
    });
    setForm({ nome: "", email: "", papel: "advogado", oab: "", telefone: "" });
    setModal(false);
  }

  return (
    <div>
      <PageHeader
        titulo="Equipe"
        sub="Membros do escritório e distribuição de trabalho"
        acao={<BotaoPrimario onClick={() => setModal(true)}><Plus size={16} /> Novo membro</BotaoPrimario>}
      />

      {membros.length === 0 ? (
        <EmptyState>Nenhum membro cadastrado.</EmptyState>
      ) : (
        <div className="space-y-2">
          {membros.map((m) => {
            const prazosDele = prazos.filter((p) => p.responsavel_id === m.id && p.status === "pendente").length;
            const tarefasDele = tarefas.filter((t) => t.responsavel_id === m.id && t.status !== "concluida").length;
            return (
              <Card key={m.id} className={`flex items-center gap-3 p-4 ${!m.ativo ? "opacity-50" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {m.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{m.nome}</p>
                    <Badge cor={COR_PAPEL[m.papel]}>{PAPEIS[m.papel]}</Badge>
                    {!m.ativo && <Badge cor="cinza">inativo</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {[m.oab, m.email, m.telefone].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {prazosDele} prazo{prazosDele === 1 ? "" : "s"} · {tarefasDele} tarefa{tarefasDele === 1 ? "" : "s"} em aberto
                  </p>
                </div>
                {m.papel !== "admin" && (
                  <button
                    onClick={() => update(m.id, { ativo: !m.ativo })}
                    className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {m.ativo ? "Desativar" : "Reativar"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal aberto={modal} titulo="Novo membro da equipe" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="space-y-3">
          <Field rotulo="Nome" obrigatorio>
            <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Papel">
              <Select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}>
                {Object.entries(PAPEIS).filter(([k]) => k !== "admin").map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field rotulo="OAB">
              <Input value={form.oab} onChange={(e) => setForm({ ...form, oab: e.target.value })} placeholder="OAB/SP 000.000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="E-mail" obrigatorio>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field rotulo="Telefone">
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </Field>
          </div>
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">
            Com o Supabase configurado, cada membro recebe um convite de acesso por e-mail e as permissões seguem o papel
            escolhido (advogados veem tudo; estagiários e secretaria não acessam o financeiro completo).
          </p>
          <div className="flex justify-end"><BotaoPrimario type="submit">Salvar membro</BotaoPrimario></div>
        </form>
      </Modal>
    </div>
  );
}
