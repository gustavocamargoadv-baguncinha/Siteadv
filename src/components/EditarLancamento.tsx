"use client";

// Formulário de lançamento — criar, corrigir e apagar.
//
// Mora aqui, e não dentro de uma tela, porque as MESMAS perguntas aparecem em
// dois lugares: no Financeiro (a lista geral) e na ficha do cliente. Duas
// cópias divergiriam na primeira mudança — uma passaria a limpar `pago_em` ao
// desmarcar e a outra não, e o dinheiro contaria diferente dependendo de por
// onde o lançamento foi editado.

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTable } from "@/lib/hooks";
import { ehParcelaProjetada, reconciliarParcelasCliente } from "@/lib/store";
import type { Cliente, Lancamento, Processo } from "@/lib/types";
import { brl, dataBR, formatCNJ, hojeISO, somaMesesISO } from "@/lib/format";
import { BotaoPrimario, Field, Input, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";

const CATEGORIAS = ["Honorários", "Consultoria", "Êxito", "Outras receitas"];

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Lançamento a corrigir. `null` = novo. */
  lancamento?: Lancamento | null;
  /** Cliente já definido (ficha do cliente) — trava o campo e evita
   *  reatribuir o lançamento a outra pessoa sem querer. */
  clienteFixo?: string;
}

export function EditarLancamento({ aberto, onFechar, lancamento = null, clienteFixo }: Props) {
  const { insert, update, remove } = useTable<Lancamento>("lancamentos");
  const { rows: clientes } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");

  const [recebido, setRecebido] = useState(true);
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [clienteId, setClienteId] = useState("");
  const [processoId, setProcessoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  // Quantas parcelas mensais lançar de uma vez. Só vale para conta a receber
  // NOVA: lançar as 10 do contrato uma a uma são 10 idas ao formulário.
  const [parcelas, setParcelas] = useState("1");
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Recarrega a cada abertura: reabrir com o formulário do lançamento anterior
  // faria corrigir o registro errado.
  useEffect(() => {
    if (!aberto) return;
    setConfirmando(false);
    setParcelas("1");
    if (lancamento) {
      setRecebido(!!lancamento.pago_em);
      setCategoria(lancamento.categoria);
      setClienteId(lancamento.cliente_id ?? "");
      setProcessoId(lancamento.processo_id ?? "");
      setDescricao(lancamento.descricao);
      setValor(String(lancamento.valor).replace(".", ",")); // vírgula, como ele digita
      setData(lancamento.pago_em ?? lancamento.vencimento);
    } else {
      setRecebido(true);
      setCategoria(CATEGORIAS[0]);
      setClienteId(clienteFixo ?? "");
      setProcessoId("");
      setDescricao("");
      setValor("");
      // hoje só na abertura (não no estado inicial) para servidor e navegador
      // não renderizarem datas diferentes na virada do dia
      setData(hojeISO());
    }
  }, [aberto, lancamento, clienteFixo]);

  const cliente = clienteId ? clientes.find((c) => c.id === clienteId) : undefined;
  // Com o cliente escolhido, a descrição já vem pronta: sobra digitar o valor.
  const descricaoSugerida = cliente ? `${categoria} — ${cliente.nome}` : "";

  // Parcelar só faz sentido em conta a receber nova: corrigir um lançamento
  // existente é sobre ele, e dez recebimentos passados não entram todos juntos.
  const podeParcelar = !lancamento && !recebido;
  const nParcelas = podeParcelar ? Math.min(60, Math.max(1, parseInt(parcelas, 10) || 1)) : 1;
  const valorNum = parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    const desc = descricao.trim() || descricaoSugerida;
    if (!desc || !data || !v || v <= 0) return;

    setSalvando(true);
    try {
      const campos = {
        tipo: "receita" as const,
        categoria,
        cliente_id: clienteId || undefined,
        processo_id: processoId || undefined,
        descricao: desc,
        valor: v,
        // Já recebido: o vencimento é o próprio dia do pagamento. Gravar uma
        // data anterior faria o lançamento nascer marcado como atraso no
        // histórico, mesmo tendo sido pago em dia.
        vencimento: data,
      };

      if (lancamento) {
        await update(lancamento.id, {
          ...campos,
          // `null` e não `undefined`: é assim que o campo é LIMPO. Voltar para
          // "a receber" apaga a data de pagamento — é o desfazer de quem marcou
          // recebido por engano.
          pago_em: recebido ? data : null,
          // pago e perdoado ao mesmo tempo é proibido no banco; registrar o
          // pagamento encerra o perdão.
          ...(recebido ? { perdoado_em: null, perdoado_motivo: null } : {}),
        });
      } else if (nParcelas > 1) {
        // Uma linha por parcela, mês a mês a partir da data escolhida. São
        // lançamentos comuns — dá para corrigir, perdoar ou apagar cada um.
        for (let k = 1; k <= nParcelas; k++) {
          await insert({
            ...campos,
            descricao: `Parcela ${k}/${nParcelas} — ${desc}`,
            vencimento: somaMesesISO(data, k - 1),
          });
        }
      } else {
        await insert({ ...campos, ...(recebido ? { pago_em: data } : {}) });
      }
      // Lançar o pagamento não pode deixar de pé a parcela projetada que ele
      // quitou — senão o cliente segue "em atraso" logo abaixo do recebimento
      // que acabou de entrar.
      //
      // A exceção é corrigir uma parcela projetada deixando-a em aberto: o
      // reacerto reescreve as parcelas em aberto, então ele apagaria na hora a
      // correção recém-feita. Aí a projeção espera o próximo movimento de
      // dinheiro (ou o botão das Configurações).
      if (!(lancamento && ehParcelaProjetada(lancamento.id) && !recebido)) {
        await reconciliarParcelasCliente(clienteId);
        // lançamento que trocou de dono: reacerta os dois, para nenhum dos dois
        // ficar com a projeção velha
        if (lancamento?.cliente_id && lancamento.cliente_id !== clienteId) {
          await reconciliarParcelasCliente(lancamento.cliente_id);
        }
      }
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    if (!lancamento) return;
    // Apagar uma parcela projetada que ainda está em aberto é dizer "essa
    // cobrança não existe": reacertar a traria de volta no mesmo instante, e o
    // botão pareceria não funcionar.
    const projetadaEmAberto =
      ehParcelaProjetada(lancamento.id) && !lancamento.pago_em && !lancamento.perdoado_em;
    await remove(lancamento.id);
    // apagar um recebimento devolve a dívida: a parcela volta para a fila
    if (!projetadaEmAberto) await reconciliarParcelasCliente(lancamento.cliente_id);
    onFechar();
  }

  return (
    <Modal
      aberto={aberto}
      titulo={
        lancamento
          ? "Corrigir lançamento"
          : recebido
            ? "Registrar pagamento"
            : nParcelas > 1
              ? `Novas contas a receber (${nParcelas}x)`
              : "Nova conta a receber"
      }
      onFechar={onFechar}
    >
      <form onSubmit={salvar} className="space-y-3">
        {lancamento && (
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
            Marcou como recebido sem querer? Troque para <span className="font-semibold">⏳ A receber</span> — a data do
            pagamento é apagada e ele volta para a cobrança.
          </p>
        )}

        {/* A pergunta que decide tudo, antes de qualquer campo */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              [true, "💰 Já recebi", "o dinheiro entrou"],
              [false, "⏳ A receber", "vai vencer"],
            ] as const
          ).map(([v, rotulo, dica]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setRecebido(v)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                recebido === v
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className={`block text-sm font-semibold ${recebido === v ? "text-brand-800" : "text-slate-700"}`}>
                {rotulo}
              </span>
              <span className="block text-xs text-slate-500">{dica}</span>
            </button>
          ))}
        </div>

        {clienteFixo ? (
          <Field rotulo="Cliente">
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{cliente?.nome ?? "—"}</p>
          </Field>
        ) : (
          <Field rotulo="Cliente">
            <Select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setProcessoId("");
              }}
            >
              <option value="">Sem vínculo</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field rotulo={nParcelas > 1 ? "Valor de CADA parcela (R$)" : "Valor (R$)"} obrigatorio>
            <Input required inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="3000,00" />
          </Field>
          <Field rotulo={recebido ? "Recebido em" : nParcelas > 1 ? "1º vencimento" : "Vencimento"} obrigatorio>
            <Input required type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
        </div>

        {podeParcelar && (
          <Field rotulo="Parcelas (mensais)">
            <Input
              type="number"
              min={1}
              max={60}
              inputMode="numeric"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
            />
            {nParcelas > 1 ? (
              // O valor digitado é o de CADA parcela, mas o contrato costuma ser
              // falado pelo total ("4.500 em 10x"). Mostrar o total e a última
              // data faz o engano de digitar o total aqui saltar aos olhos antes
              // de virar 10 lançamentos errados.
              <p className="mt-1 text-xs text-slate-600">
                {valorNum > 0 && (
                  <>
                    <span className="font-semibold">
                      {nParcelas}x de {brl(valorNum)} = {brl(valorNum * nParcelas)}
                    </span>
                    {" · "}
                  </>
                )}
                {data && (
                  <>
                    vencem de {dataBR(data)} a {dataBR(somaMesesISO(data, nParcelas - 1))}, todo dia{" "}
                    {Number(data.slice(8, 10))}
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Deixe 1 para um lançamento só. Mais que isso, lança uma parcela por mês a partir do vencimento.
              </p>
            )}
          </Field>
        )}

        <Field rotulo="Descrição">
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={descricaoSugerida || "Ex.: Parcela 1/4 — apelação"}
          />
          {descricaoSugerida && !descricao.trim() && (
            <p className="mt-1 text-xs text-slate-400">Em branco, salva como “{descricaoSugerida}”.</p>
          )}
        </Field>

        <Field rotulo="Categoria">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>

        {clienteId && (
          <Field rotulo="Processo">
            <Select value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
              <option value="">Sem vínculo</option>
              {processos.filter((p) => p.cliente_id === clienteId).map((p) => (
                <option key={p.id} value={p.id}>{formatCNJ(p.numero_cnj)}</option>
              ))}
            </Select>
          </Field>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {lancamento &&
            (confirmando ? (
              <div className="mr-auto flex items-center gap-2">
                <span className="text-xs text-slate-600">Apagar de vez?</span>
                <button
                  type="button"
                  onClick={apagar}
                  className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Sim, apagar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  não
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={13} /> Apagar lançamento
              </button>
            ))}
          <BotaoPrimario type="submit" disabled={salvando}>
            {salvando
              ? "Salvando…"
              : lancamento
                ? "Salvar correção"
                : recebido
                  ? "Registrar pagamento"
                  : nParcelas > 1
                    ? `Lançar as ${nParcelas} parcelas`
                    : "Salvar conta a receber"}
          </BotaoPrimario>
        </div>
      </form>
    </Modal>
  );
}
