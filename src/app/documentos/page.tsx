"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Documento, Processo } from "@/lib/types";
import { dataBR, formatCNJ } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { getSupabase, supabaseConfigurado } from "@/lib/supabase";

function tamanhoLegivel(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentosPage() {
  const { rows: documentos, insert } = useTable<Documento>("documentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const cliMap = byId(clientes);
  const procMap = byId(processos);

  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [form, setForm] = useState({ cliente_id: "", processo_id: "", tipo: "Peça processual", visivel_cliente: false });
  const [enviando, setEnviando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return documentos
      .filter((d) => !q || d.nome.toLowerCase().includes(q) || (cliMap.get(d.cliente_id ?? "")?.nome ?? "").toLowerCase().includes(q))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [documentos, busca, cliMap]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true);
    try {
      let storage_path: string | undefined;
      if (supabaseConfigurado) {
        // Upload real para o bucket "documentos" do Supabase Storage
        storage_path = `${crypto.randomUUID()}/${arquivo.name}`;
        const { error } = await getSupabase().storage.from("documentos").upload(storage_path, arquivo);
        if (error) throw error;
      }
      await insert({
        nome: arquivo.name,
        cliente_id: form.cliente_id || undefined,
        processo_id: form.processo_id || undefined,
        tipo: form.tipo,
        tamanho: arquivo.size,
        storage_path,
        visivel_cliente: form.visivel_cliente,
      });
      setModal(false);
      setArquivo(null);
      setForm({ cliente_id: "", processo_id: "", tipo: "Peça processual", visivel_cliente: false });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Documentos"
        sub={supabaseConfigurado ? "Arquivos no Supabase Storage" : "Modo demo: registra os metadados; o arquivo em si só é armazenado com o Supabase configurado"}
        acao={<BotaoPrimario onClick={() => setModal(true)}><Plus size={16} /> Enviar documento</BotaoPrimario>}
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do arquivo ou cliente…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState>Nenhum documento.</EmptyState>
      ) : (
        <div className="space-y-2">
          {filtrados.map((d) => {
            const cli = d.cliente_id ? cliMap.get(d.cliente_id) : undefined;
            const proc = d.processo_id ? procMap.get(d.processo_id) : undefined;
            return (
              <Card key={d.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{d.nome}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[d.tipo, cli?.nome, proc && formatCNJ(proc.numero_cnj), tamanhoLegivel(d.tamanho), d.created_at && dataBR(d.created_at)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {d.visivel_cliente && <Badge cor="azul">no portal</Badge>}
              </Card>
            );
          })}
        </div>
      )}

      <Modal aberto={modal} titulo="Enviar documento" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="space-y-3">
          <Field rotulo="Arquivo" obrigatorio>
            <input
              required
              type="file"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {["Peça processual", "Decisão", "Prova", "Contrato", "Procuração", "Documento", "Outro"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field rotulo="Cliente">
              <Select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value, processo_id: "" })}>
                <option value="">Sem vínculo</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </Field>
          </div>
          {form.cliente_id && (
            <Field rotulo="Processo">
              <Select value={form.processo_id} onChange={(e) => setForm({ ...form, processo_id: e.target.value })}>
                <option value="">Sem vínculo</option>
                {processos.filter((p) => p.cliente_id === form.cliente_id).map((p) => (
                  <option key={p.id} value={p.id}>{formatCNJ(p.numero_cnj)}</option>
                ))}
              </Select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.visivel_cliente}
              onChange={(e) => setForm({ ...form, visivel_cliente: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
            Visível para o cliente no portal
          </label>
          <div className="flex justify-end">
            <BotaoPrimario type="submit">{enviando ? "Enviando…" : "Salvar documento"}</BotaoPrimario>
          </div>
        </form>
      </Modal>
    </div>
  );
}
