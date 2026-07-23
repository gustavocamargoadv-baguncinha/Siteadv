"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Membro, Processo } from "@/lib/types";
import { AREAS, formatCNJ, dataBR } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { faseInfo } from "@/lib/fases";

const COR_STATUS = { ativo: "verde", suspenso: "ambar", arquivado: "cinza", encerrado: "azul" } as const;

export default function ProcessosPage() {
  const { rows: processos, insert } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: membros } = useTable<Membro>("membros");
  const cliMap = byId(clientes);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [modal, setModal] = useState(false);
  const [buscandoCnj, setBuscandoCnj] = useState(false);
  const [cnjMsg, setCnjMsg] = useState<{ tipo: "ok" | "vazio" | "erro"; texto: string } | null>(null);
  const [form, setForm] = useState({
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
  });

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return processos
      .filter((p) => (filtroStatus === "todos" ? true : p.status === filtroStatus))
      .filter((p) => {
        if (!q) return true;
        const cli = cliMap.get(p.cliente_id);
        return (
          (p.numero_cnj ?? "").includes(q) ||
          (cli?.nome ?? "").toLowerCase().includes(q) ||
          (p.objeto ?? "").toLowerCase().includes(q) ||
          (p.comarca ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [processos, busca, filtroStatus, cliMap]);

  function abrirNovo() {
    setCnjMsg(null);
    setModal(true);
  }

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
    await insert({
      ...form,
      numero_cnj: form.numero_cnj || undefined,
      area: form.area as Processo["area"],
      status: "ativo",
      monitorado: false,
      responsavel_id: form.responsavel_id || undefined,
    });
    setModal(false);
    setForm({ numero_cnj: "", cliente_id: "", area: "criminal", tribunal: "", vara: "", comarca: "", fase: "", parte_contraria: "", objeto: "", responsavel_id: "" });
  }

  return (
    <div>
      <PageHeader
        titulo="Processos"
        sub={`${filtrados.length} de ${processos.length} casos`}
        acao={<BotaoPrimario onClick={abrirNovo}><Plus size={16} /> Novo processo</BotaoPrimario>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, objeto…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ativo">Ativos</option>
          <option value="suspenso">Suspensos</option>
          <option value="arquivado">Arquivados</option>
          <option value="encerrado">Encerrados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState>Nenhum processo encontrado.</EmptyState>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => {
            const cli = cliMap.get(p.cliente_id);
            return (
              <Link key={p.id} href={`/processos/${p.id}`} className="block">
                <Card className="p-4 transition hover:border-brand-400 hover:shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{formatCNJ(p.numero_cnj)}</span>
                    <Badge cor={COR_STATUS[p.status]}>{p.status}</Badge>
                    <Badge cor="roxo">{AREAS[p.area]}</Badge>
                    {faseInfo(p.situacao) && (
                      <Badge cor={faseInfo(p.situacao)!.cor}>{faseInfo(p.situacao)!.emoji} {faseInfo(p.situacao)!.rotulo}</Badge>
                    )}
                    {p.monitorado && <Badge cor="azul">monitorado</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{cli?.nome ?? "Cliente removido"}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{p.objeto}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[p.vara, p.comarca, p.fase && `Fase: ${p.fase}`].filter(Boolean).join(" · ")}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal aberto={modal} titulo="Novo processo" onFechar={() => setModal(false)}>
        <form onSubmit={salvar} className="space-y-3">
          <Field rotulo="Cliente" obrigatorio>
            <Select required value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
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
            <BotaoPrimario type="submit">Salvar processo</BotaoPrimario>
          </div>
        </form>
      </Modal>
    </div>
  );
}
