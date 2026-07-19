"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, ContratoHonorarios, Documento, Lancamento, Processo } from "@/lib/types";
import { AREAS, brl, dataBR, formatCNJ, statusLancamento, TIPOS_HONORARIOS } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { GerarDocumentos } from "@/components/GerarDocumentos";

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: contratos } = useTable<ContratoHonorarios>("contratos_honorarios");
  const { rows: lancamentos } = useTable<Lancamento>("lancamentos");
  const { rows: documentos } = useTable<Documento>("documentos");

  const cli = clientes.find((c) => c.id === id);

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

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader titulo={cli.nome} sub={cli.tipo === "pf" ? `CPF ${cli.cpf_cnpj ?? "—"}` : `CNPJ ${cli.cpf_cnpj ?? "—"}`} />

      <Card className="space-y-2 p-4 text-sm text-slate-700">
        {cli.telefone && <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /> {cli.telefone}</p>}
        {cli.email && <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /> {cli.email}</p>}
        {cli.endereco && <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" /> {cli.endereco}</p>}
        {cli.notas && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">📌 {cli.notas}</p>}
      </Card>

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
    </div>
  );
}
