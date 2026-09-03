"use client";

// Formulário de cadastro de processo.
//
// Mora aqui, e não dentro de uma tela, porque as MESMAS perguntas aparecem em
// dois lugares: na tela de Processos (a lista geral) e na ficha do cliente —
// onde o caso costuma nascer, com o contrato na mão. Duas cópias divergiriam na
// primeira mudança: uma passaria a buscar os dados no DataJud e a outra não, e o
// mesmo processo ficaria mais completo ou menos dependendo de por onde foi
// cadastrado.

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, Membro, Processo } from "@/lib/types";
import { AREAS, dataBR } from "@/lib/format";
import { BotaoPrimario, Field, Input, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

const FORM_VAZIO = {
  numero_cnj: "",
  cliente_id: "",
  area: "criminal",
  tribunal: "",
  vara: "",
  comarca: "",
  fase: "",
  parte_contraria: "",
  objeto: "",
  responsavel_id: "",
};

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Cliente já definido (ficha do cliente) — trava o campo e evita cadastrar o
   *  processo no nome de outra pessoa por um toque errado. */
  clienteFixo?: string;
}

export function NovoProcesso({ aberto, onFechar, clienteFixo }: Props) {
  const { insert } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: membros } = useTable<Membro>("membros");

  const [form, setForm] = useState(FORM_VAZIO);
  const [buscandoCnj, setBuscandoCnj] = useState(false);
  const [cnjMsg, setCnjMsg] = useState<{ tipo: "ok" | "vazio" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Recomeça limpo a cada abertura: reabrir com o rascunho anterior faria
  // cadastrar o processo do cliente errado.
  useEffect(() => {
    if (!aberto) return;
    setForm({ ...FORM_VAZIO, cliente_id: clienteFixo ?? "" });
    setCnjMsg(null);
  }, [aberto, clienteFixo]);

  const cliente = form.cliente_id ? clientes.find((c) => c.id === form.cliente_id) : undefined;

  async function buscarDadosCnj() {
    const d = form.numero_cnj.replace(/\D/g, "");
    if (d.length !== 20) {
      setCnjMsg({ tipo: "erro", texto: "Digite o número completo (20 dígitos) antes de buscar." });
      return;
    }
    setBuscandoCnj(true);
    setCnjMsg(null);
    try {
      const res = await fetch("/api/tribunais/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: d }),
      });
      const json = await res.json();
      if (!res.ok || json?.erro) throw new Error(json?.erro || "falha");
      const dd = json.dados;
      if (!dd?.encontrado) {
        setCnjMsg({
          tipo: "vazio",
          texto: "Nada encontrado no DataJud — pode estar em segredo de justiça ou ainda não indexado. Preencha os campos manualmente.",
        });
        return;
      }
      // infere a área a partir da classe/assunto (sem sobrescrever o que já houver)
      const txt = `${dd.classe ?? ""} ${dd.assunto ?? ""}`.toLowerCase();
      const area = /execu[çc][aã]o penal|vep|progress|remi[çc]/.test(txt)
        ? "execucao_penal"
        : /penal|crime|criminal/.test(txt)
          ? "criminal"
          : form.area;
      const objetoAuto = [
        dd.classe && `Classe: ${dd.classe}`,
        dd.assunto && `Assunto: ${dd.assunto}`,
        dd.dataAjuizamento && `Ajuizado em ${dataBR(dd.dataAjuizamento)}`,
      ]
        .filter(Boolean)
        .join(" — ");
      // só preenche campos ainda vazios (não apaga o que você já digitou)
      setForm((f) => ({
        ...f,
        area,
        tribunal: f.tribunal || dd.tribunal || "",
        vara: f.vara || dd.vara || "",
        comarca: f.comarca || dd.comarca || "",
        objeto: f.objeto || objetoAuto,
      }));
      const resumo = [dd.classe, dd.vara].filter(Boolean).join(" · ");
      setCnjMsg({ tipo: "ok", texto: `Encontrado${resumo ? `: ${resumo}` : ""}. Confira e ajuste o que precisar.` });
    } catch {
      setCnjMsg({ tipo: "erro", texto: "Não consegui consultar agora. Tente de novo ou preencha manualmente." });
    } finally {
      setBuscandoCnj(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) return;
    setSalvando(true);
    try {
      await insert({
        ...form,
        numero_cnj: form.numero_cnj || undefined,
        area: form.area as Processo["area"],
        status: "ativo",
        monitorado: false,
        responsavel_id: form.responsavel_id || undefined,
      });
      setForm(FORM_VAZIO);
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Novo processo" onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-3">
        {clienteFixo ? (
          <Field rotulo="Cliente">
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{cliente?.nome ?? "—"}</p>
          </Field>
        ) : (
          <Field rotulo="Cliente" obrigatorio>
            <Select required value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field rotulo="Número CNJ">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input value={form.numero_cnj} onChange={(e) => setForm({ ...form, numero_cnj: e.target.value })} placeholder="0000000-00.0000.0.00.0000" />
            </div>
            <button
              type="button"
              onClick={buscarDadosCnj}
              disabled={buscandoCnj}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-50 px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
            >
              {buscandoCnj ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {buscandoCnj ? "Buscando…" : "Buscar dados"}
            </button>
          </div>
          {cnjMsg && (
            <p className={`mt-1.5 text-xs ${cnjMsg.tipo === "ok" ? "text-emerald-700" : cnjMsg.tipo === "vazio" ? "text-amber-700" : "text-red-700"}`}>
              {cnjMsg.texto}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Cola o número e clique em “Buscar dados” — preenche vara, tribunal e assunto pelo DataJud. Tudo continua editável.
          </p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field rotulo="Área">
            <Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              {Object.entries(AREAS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field rotulo="Fase">
            <Input value={form.fase} onChange={(e) => setForm({ ...form, fase: e.target.value })} placeholder="Instrução, Recursal…" />
          </Field>
          <Field rotulo="Tribunal">
            <Input value={form.tribunal} onChange={(e) => setForm({ ...form, tribunal: e.target.value })} placeholder="TJSP" />
          </Field>
          <Field rotulo="Vara / Câmara">
            <Input value={form.vara} onChange={(e) => setForm({ ...form, vara: e.target.value })} />
          </Field>
          <Field rotulo="Comarca">
            <Input value={form.comarca} onChange={(e) => setForm({ ...form, comarca: e.target.value })} />
          </Field>
          <Field rotulo="Responsável">
            <Select value={form.responsavel_id} onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })}>
              <option value="">—</option>
              {membros.filter((m) => m.ativo).map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field rotulo="Parte contrária">
          <Input value={form.parte_contraria} onChange={(e) => setForm({ ...form, parte_contraria: e.target.value })} placeholder="Ministério Público…" />
        </Field>
        <Field rotulo="Objeto / tese">
          <Textarea value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} />
        </Field>
        <div className="flex justify-end pt-1">
          <BotaoPrimario type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar processo"}
          </BotaoPrimario>
        </div>
      </form>
    </Modal>
  );
}
