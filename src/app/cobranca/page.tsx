"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle, PhoneOff } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, Lancamento } from "@/lib/types";
import { brl, dataBR, diasAteISO, emCobranca, hojeISO, statusLancamento } from "@/lib/format";
import { Badge, BotaoPrimario, Card, EmptyState, Field, Input, PageHeader, StatCard } from "@/components/ui";
import { Modal } from "@/components/Modal";

type Aba = "atraso" | "avencer";

/** Monta o link wa.me a partir de um telefone livre ("+55 15 9…", "15 9…"). */
function linkWhatsapp(telefone: string | undefined, texto: string): string | null {
  if (!telefone) return null;
  let d = telefone.replace(/\D/g, "");
  if (d.length < 10) return null;
  if (!d.startsWith("55")) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

interface Devedor {
  cliente: Cliente;
  parcelas: Lancamento[];
  total: number;
  maisAntiga: Lancamento; // atraso: a mais vencida; a vencer: a mais próxima
  diasReferencia: number; // atraso: dias vencidos (positivo); a vencer: dias até vencer
}

export default function CobrancaPage() {
  const { rows: lancamentos, update } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const cliMap = byId(clientes);

  const [aba, setAba] = useState<Aba>("atraso");
  const [perdoando, setPerdoando] = useState<Cliente | null>(null);

  // `emCobranca` já exclui recebidos E perdoados — é o que faz o cliente
  // perdoado sumir daqui sem sumir do sistema.
  const emAberto = useMemo(
    () => lancamentos.filter((l) => emCobranca(l) && l.cliente_id),
    [lancamentos]
  );

  const grupos = useMemo(() => {
    const querAtraso = aba === "atraso";
    const porCliente = new Map<string, Lancamento[]>();
    for (const l of emAberto) {
      const atrasado = statusLancamento(l) === "atrasado";
      if (querAtraso !== atrasado) continue;
      const arr = porCliente.get(l.cliente_id!) ?? [];
      arr.push(l);
      porCliente.set(l.cliente_id!, arr);
    }

    const devedores: Devedor[] = [];
    for (const [cid, parcelas] of porCliente) {
      const cliente = cliMap.get(cid);
      if (!cliente) continue;
      const ordenadas = [...parcelas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      const total = parcelas.reduce((s, l) => s + l.valor, 0);
      const maisAntiga = ordenadas[0]; // menor vencimento = mais vencida (atraso) ou mais próxima (a vencer)
      const dias = diasAteISO(maisAntiga.vencimento);
      devedores.push({
        cliente,
        parcelas: ordenadas,
        total,
        maisAntiga,
        diasReferencia: querAtraso ? -dias : dias,
      });
    }

    // atraso: maior dívida primeiro; a vencer: vencimento mais próximo primeiro
    devedores.sort((a, b) =>
      querAtraso ? b.total - a.total : a.maisAntiga.vencimento.localeCompare(b.maisAntiga.vencimento)
    );
    return devedores;
  }, [emAberto, aba, cliMap]);

  const totais = useMemo(() => {
    let atraso = 0;
    let avencer = 0;
    const devAtraso = new Set<string>();
    for (const l of emAberto) {
      if (statusLancamento(l) === "atrasado") {
        atraso += l.valor;
        devAtraso.add(l.cliente_id!);
      } else if (diasAteISO(l.vencimento) <= 30) {
        avencer += l.valor;
      }
    }
    return { atraso, avencer, nDevedores: devAtraso.size };
  }, [emAberto]);

  return (
    <div>
      <PageHeader titulo="Cobrança" sub="Quem está devendo e o que está por vencer" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard rotulo="Em atraso" valor={brl(totais.atraso)} destaque={totais.atraso > 0} />
        <StatCard rotulo="Devedores" valor={String(totais.nDevedores)} detalhe="clientes com parcela vencida" />
        <StatCard rotulo="A vencer em 30 dias" valor={brl(totais.avencer)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["atraso", "Em atraso"],
            ["avencer", "A vencer"],
          ] as const
        ).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              aba === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {grupos.length === 0 ? (
        <EmptyState>
          {aba === "atraso"
            ? "Ninguém em atraso. 🎉 (Rode “Gerar parcelas a vencer” nas Configurações se acabou de importar contratos.)"
            : "Nenhuma parcela a vencer no momento."}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {grupos.map((d) => (
            <DevedorCard key={d.cliente.id} d={d} aba={aba} onPerdoar={() => setPerdoando(d.cliente)} />
          ))}
        </div>
      )}

      {perdoando && (
        <PerdoarModal
          cliente={perdoando}
          // TODAS as parcelas em aberto do cliente, não só as da aba visível:
          // perdoar "o que ele deve" e deixar as futuras vivas o traria de volta
          // à cobrança no mês seguinte.
          parcelas={emAberto.filter((l) => l.cliente_id === perdoando.id)}
          onFechar={() => setPerdoando(null)}
          onConfirmar={async (motivo) => {
            const hoje = hojeISO();
            for (const l of emAberto.filter((x) => x.cliente_id === perdoando.id)) {
              await update(l.id, { perdoado_em: hoje, perdoado_motivo: motivo || null });
            }
            setPerdoando(null);
          }}
        />
      )}
    </div>
  );
}

/** Confirmação do perdão. Mostra exatamente o que vai sair da cobrança — o
 *  advogado precisa ver o total e a contagem antes de abrir mão. */
function PerdoarModal({
  cliente,
  parcelas,
  onFechar,
  onConfirmar,
}: {
  cliente: Cliente;
  parcelas: Lancamento[];
  onFechar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const total = parcelas.reduce((s, l) => s + l.valor, 0);

  return (
    <Modal aberto titulo="Perdoar a dívida" onFechar={onFechar}>
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Abrir mão de <span className="font-bold tabular-nums text-slate-900">{brl(total)}</span> de{" "}
          <span className="font-semibold">{cliente.nome}</span> — {parcelas.length} parcela
          {parcelas.length === 1 ? "" : "s"} em aberto.
        </p>
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
          {parcelas.map((l) => (
            <li key={l.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{l.descricao.replace(/ — honorários.*/, "")}</span>
              <span className="shrink-0 tabular-nums">
                {brl(l.valor)} · venc. {dataBR(l.vencimento)}
              </span>
            </li>
          ))}
        </ul>
        <Field rotulo="Motivo (opcional)">
          <Input
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="acordo, cliente sumiu, pro bono…"
          />
        </Field>
        <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">
          Ele sai da cobrança ativa agora. Nada é apagado: o valor fica registrado na ficha dele e na aba
          <span className="font-semibold"> Perdoados</span> do Financeiro, de onde dá para devolver à cobrança. Perdão
          nunca conta como faturamento.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onFechar}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            Cancelar
          </button>
          <BotaoPrimario
            disabled={salvando}
            onClick={async () => {
              setSalvando(true);
              try {
                await onConfirmar(motivo.trim());
              } finally {
                setSalvando(false);
              }
            }}
          >
            <HeartHandshake size={15} /> {salvando ? "Perdoando…" : "Perdoar dívida"}
          </BotaoPrimario>
        </div>
      </div>
    </Modal>
  );
}

function DevedorCard({ d, aba, onPerdoar }: { d: Devedor; aba: Aba; onPerdoar: () => void }) {
  const emAtraso = aba === "atraso";
  const msg =
    `Olá, ${primeiroNome(d.cliente.nome)}! Aqui é do escritório do Dr. Gustavo Camargo. ` +
    (emAtraso
      ? `Passando para lembrar dos honorários em aberto: ${d.parcelas.length} parcela(s) somando ${brl(
          d.total
        )}, a mais antiga vencida em ${dataBR(d.maisAntiga.vencimento)}. Quando puder, me avisa para acertarmos? 🙏`
      : `Passando para lembrar que a próxima parcela (${brl(d.maisAntiga.valor)}) vence em ${dataBR(
          d.maisAntiga.vencimento
        )}. Qualquer dúvida, estou à disposição. 🙏`);
  const wa = linkWhatsapp(d.cliente.telefone, msg);

  return (
    <Card className={`p-4 ${emAtraso ? "border-red-300 bg-red-50/40" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/clientes/${d.cliente.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
              {d.cliente.nome}
            </Link>
            <Badge cor={emAtraso ? "vermelho" : "ambar"}>
              {emAtraso
                ? `${d.parcelas.length} parcela${d.parcelas.length > 1 ? "s" : ""} · ${d.diasReferencia} dia${
                    d.diasReferencia === 1 ? "" : "s"
                  } em atraso`
                : `vence em ${d.diasReferencia} dia${d.diasReferencia === 1 ? "" : "s"}`}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {emAtraso
              ? `Mais antiga: ${d.maisAntiga.descricao.replace(/ — honorários.*/, "")} · venceu ${dataBR(
                  d.maisAntiga.vencimento
                )}`
              : `Próxima: ${d.maisAntiga.descricao.replace(/ — honorários.*/, "")} · vence ${dataBR(
                  d.maisAntiga.vencimento
                )}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-bold tabular-nums ${emAtraso ? "text-red-600" : "text-slate-900"}`}>
            {brl(d.total)}
          </p>
          <p className="text-[11px] text-slate-400">{emAtraso ? "em atraso" : "em aberto"}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={14} /> Cobrar no WhatsApp
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400">
            <PhoneOff size={14} /> Sem telefone cadastrado
          </span>
        )}
        <Link
          href={`/clientes/${d.cliente.id}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:text-slate-900"
        >
          Ver ficha <ArrowRight size={13} />
        </Link>
        {/* discreto de propósito: perdoar é exceção, não a ação esperada aqui */}
        <button
          onClick={onPerdoar}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          title="Abrir mão desta dívida — sai da cobrança e fica arquivada"
        >
          <HeartHandshake size={13} /> Perdoar
        </button>
      </div>
    </Card>
  );
}
