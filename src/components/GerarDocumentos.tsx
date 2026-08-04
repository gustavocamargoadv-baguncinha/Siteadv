"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSignature, FileText, HandCoins } from "lucide-react";
import { useTable, byId } from "@/lib/hooks";
import type { Cliente, ContratoHonorarios, Lancamento, Processo } from "@/lib/types";
import { brl, dataBR, formatCNJ } from "@/lib/format";
import { abrirDocumento, contratoHTML, hipossuficienciaHTML, procuracaoHTML, PODERES_ESPECIAIS, type PessoaDoc } from "@/lib/modelos";
import { BotaoPrimario, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/Modal";

type TipoDoc = "procuracao" | "hipo" | "contrato" | null;

interface Qualificacao {
  nacionalidade: string;
  estado_civil: string;
  profissao: string;
  rg: string;
  cpf: string;
  endereco: string;
}

function qualificacaoDoCliente(c: Cliente): Qualificacao {
  return {
    nacionalidade: c.nacionalidade ?? "brasileiro(a)",
    estado_civil: c.estado_civil ?? "",
    profissao: c.profissao ?? "",
    rg: c.rg ?? "",
    cpf: c.cpf_cnpj ?? "",
    endereco: c.endereco ?? "",
  };
}

function somaMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const alvo = new Date(a, m - 1 + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimoDia));
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, "0")}-${String(alvo.getDate()).padStart(2, "0")}`;
}

export function GerarDocumentos({ cliente }: { cliente: Cliente }) {
  const { rows: clientes, update: updateCliente } = useTable<Cliente>("clientes");
  const { rows: processos } = useTable<Processo>("processos");
  const { insert: addContrato } = useTable<ContratoHonorarios>("contratos_honorarios");
  const { insert: addLancamento } = useTable<Lancamento>("lancamentos");

  const [modal, setModal] = useState<TipoDoc>(null);
  const [q, setQ] = useState<Qualificacao>(qualificacaoDoCliente(cliente));
  const [salvarCadastro, setSalvarCadastro] = useState(true);
  const [poderesSel, setPoderesSel] = useState<string[]>([]);

  // Campos específicos do contrato
  const [defendidoId, setDefendidoId] = useState(cliente.id);
  const [defendidoNomeLivre, setDefendidoNomeLivre] = useState("");
  const [processoId, setProcessoId] = useState("");
  const [numeroLivre, setNumeroLivre] = useState("");
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [vencimento, setVencimento] = useState("");
  const [objeto, setObjeto] = useState("");
  const [objetoEditado, setObjetoEditado] = useState(false);
  const [lancarFinanceiro, setLancarFinanceiro] = useState(true);
  const [primeiraPaga, setPrimeiraPaga] = useState(false);
  const [pagaEm, setPagaEm] = useState("");

  const cliMap = byId(clientes);

  const defendidoNome = useMemo(() => {
    if (defendidoId === "__outro__") return defendidoNomeLivre.trim();
    return cliMap.get(defendidoId)?.nome ?? cliente.nome;
  }, [defendidoId, defendidoNomeLivre, cliMap, cliente.nome]);

  const processosDoDefendido = useMemo(() => {
    const doDefendido = defendidoId !== "__outro__" ? processos.filter((p) => p.cliente_id === defendidoId) : [];
    return doDefendido.length ? doDefendido : processos.filter((p) => p.status === "ativo");
  }, [processos, defendidoId]);

  const numeroProcesso = useMemo(() => {
    if (numeroLivre.trim()) return numeroLivre.trim();
    const p = processos.find((x) => x.id === processoId);
    return p?.numero_cnj ? formatCNJ(p.numero_cnj) : "";
  }, [numeroLivre, processoId, processos]);

  // Monta o texto do objeto automaticamente enquanto o usuário não o editar
  useEffect(() => {
    if (objetoEditado || modal !== "contrato") return;
    const autos = numeroProcesso ? `, nos autos do processo n. ${numeroProcesso}` : "";
    setObjeto(
      `prestação de serviços técnicos jurídicos com fim de prestar SERVIÇOS ADVOCATÍCIOS por meio de defesa em ação penal em favor de ${defendidoNome.toUpperCase()}${autos}, incluindo impetração e acompanhamento de Habeas Corpus sempre que cabível no estado em que se encontra.`
    );
  }, [defendidoNome, numeroProcesso, objetoEditado, modal]);

  function abrirModal(tipo: Exclude<TipoDoc, null>) {
    setQ(qualificacaoDoCliente(cliente));
    setSalvarCadastro(true);
    setPoderesSel([]);
    if (tipo === "contrato") {
      setDefendidoId(cliente.id);
      setDefendidoNomeLivre("");
      setProcessoId("");
      setNumeroLivre("");
      setValor("");
      setParcelas("1");
      setVencimento("");
      setObjeto("");
      setObjetoEditado(false);
      setLancarFinanceiro(true);
      setPrimeiraPaga(false);
      setPagaEm(new Date().toISOString().slice(0, 10));
    }
    setModal(tipo);
  }

  async function persistirCadastro() {
    if (!salvarCadastro) return;
    await updateCliente(cliente.id, {
      nacionalidade: q.nacionalidade || undefined,
      estado_civil: q.estado_civil || undefined,
      profissao: q.profissao || undefined,
      rg: q.rg || undefined,
      cpf_cnpj: q.cpf || undefined,
      endereco: q.endereco || undefined,
    });
  }

  function pessoa(): PessoaDoc {
    return {
      nome: cliente.nome,
      nacionalidade: q.nacionalidade || undefined,
      estado_civil: q.estado_civil || undefined,
      profissao: q.profissao || undefined,
      rg: q.rg || undefined,
      cpf: q.cpf || undefined,
      endereco: q.endereco || undefined,
    };
  }

  function togglePoder(id: string) {
    setPoderesSel((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  async function gerarProcuracao(e: React.FormEvent) {
    e.preventDefault();
    await persistirCadastro();
    const poderesExtras = PODERES_ESPECIAIS.filter((x) => poderesSel.includes(x.id)).map((x) => x.frase);
    abrirDocumento(procuracaoHTML(pessoa(), { poderesExtras }));
    setModal(null);
  }

  async function gerarHipo(e: React.FormEvent) {
    e.preventDefault();
    await persistirCadastro();
    abrirDocumento(hipossuficienciaHTML(pessoa()));
    setModal(null);
  }

  async function gerarContrato(e: React.FormEvent) {
    e.preventDefault();
    const valorTotal = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    const n = Math.max(1, parseInt(parcelas, 10) || 1);
    if (!valorTotal || valorTotal <= 0 || !vencimento || !objeto.trim() || !defendidoNome) return;

    const hoje = new Date().toISOString().slice(0, 10);
    const diaVenc = new Date(`${vencimento}T12:00:00`).getDate();
    // data em que a 1ª parcela foi paga (informada ou hoje)
    const dataPaga = primeiraPaga ? (pagaEm || hoje) : hoje;

    await persistirCadastro();
    abrirDocumento(
      contratoHTML({
        contratante: pessoa(),
        objeto: objeto.trim(),
        valorTotal,
        parcelas: n,
        primeiroVencimento: vencimento,
        diaVencimento: diaVenc,
        primeiraPaga,
        pagaEm: primeiraPaga ? dataPaga : undefined,
      })
    );

    if (lancarFinanceiro) {
      const procId = processoId || undefined;
      const valorParcela = Math.round((valorTotal / n) * 100) / 100;
      await addContrato({
        cliente_id: cliente.id,
        processo_id: procId,
        tipo: "fixo",
        valor_fixo: valorTotal,
        descricao: `Defesa de ${defendidoNome} — ${n}x de ${brl(valorParcela)}.`,
        status: "ativo",
      });
      for (let i = 0; i < n; i++) {
        const ultima = i === n - 1;
        const valorDesta = ultima ? Math.round((valorTotal - valorParcela * (n - 1)) * 100) / 100 : valorParcela;
        // Quando a 1ª parcela já foi paga antes da assinatura, ela entra como
        // recebida na data informada; as demais vencem no mesmo dia dos meses seguintes.
        const primeiraJaPaga = primeiraPaga && i === 0;
        await addLancamento({
          tipo: "receita",
          categoria: "Honorários",
          cliente_id: cliente.id,
          processo_id: procId,
          descricao: `Parcela ${i + 1}/${n} — honorários (defesa de ${defendidoNome})`,
          valor: valorDesta,
          vencimento: primeiraJaPaga ? dataPaga : somaMeses(vencimento, i),
          ...(primeiraJaPaga ? { pago_em: dataPaga } : {}),
        });
      }
    }
    setModal(null);
  }

  const CamposQualificacao = ({ comProfissao }: { comProfissao?: boolean }) => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field rotulo="Nacionalidade">
          <Input value={q.nacionalidade} onChange={(e) => setQ({ ...q, nacionalidade: e.target.value })} placeholder="brasileiro / brasileira" />
        </Field>
        <Field rotulo="Estado civil">
          <Input value={q.estado_civil} onChange={(e) => setQ({ ...q, estado_civil: e.target.value })} placeholder="solteiro / casada…" />
        </Field>
        {comProfissao && (
          <Field rotulo="Profissão">
            <Input value={q.profissao} onChange={(e) => setQ({ ...q, profissao: e.target.value })} placeholder="desempregada, autônomo…" />
          </Field>
        )}
        <Field rotulo="RG" obrigatorio>
          <Input required value={q.rg} onChange={(e) => setQ({ ...q, rg: e.target.value })} placeholder="00.000.000-0 SSP/SP" />
        </Field>
        <Field rotulo="CPF" obrigatorio>
          <Input required value={q.cpf} onChange={(e) => setQ({ ...q, cpf: e.target.value })} placeholder="000.000.000-00" />
        </Field>
      </div>
      <Field rotulo="Endereço completo" obrigatorio>
        <Input required value={q.endereco} onChange={(e) => setQ({ ...q, endereco: e.target.value })} placeholder="Rua…, nº, bairro, CEP, cidade-SP" />
      </Field>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={salvarCadastro} onChange={(e) => setSalvarCadastro(e.target.checked)} className="accent-brand-600" />
        Salvar estes dados no cadastro do cliente
      </label>
    </>
  );

  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-bold text-slate-900">Gerar documentos</h2>
      <p className="mb-3 text-xs text-slate-500">
        Documentos prontos no papel timbrado do escritório, para imprimir ou salvar em PDF.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <button onClick={() => abrirModal("procuracao")} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">
          <FileSignature size={17} /> Procuração
        </button>
        <button onClick={() => abrirModal("hipo")} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">
          <FileText size={17} /> Hipossuficiência
        </button>
        <button onClick={() => abrirModal("contrato")} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">
          <HandCoins size={17} /> Contrato
        </button>
      </div>

      {/* Procuração */}
      <Modal aberto={modal === "procuracao"} titulo={`Procuração — ${cliente.nome}`} onFechar={() => setModal(null)}>
        <form onSubmit={gerarProcuracao} className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
            Procuração <i>ad judicia et extra</i> assinada pelo outorgante ({cliente.nome}) em favor do
            Dr. Gustavo. Confira a qualificação abaixo.
          </p>
          <CamposQualificacao />
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Poderes especiais (marque os que quiser acrescentar)</p>
            <p className="mb-2.5 text-[11px] text-slate-400">
              Confessar, desistir, transigir, firmar acordos e substabelecer já constam do texto. Marque abaixo os poderes extras conforme o caso.
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {PODERES_ESPECIAIS.map((pd) => (
                <label key={pd.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={poderesSel.includes(pd.id)}
                    onChange={() => togglePoder(pd.id)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {pd.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end"><BotaoPrimario type="submit">Gerar procuração</BotaoPrimario></div>
        </form>
      </Modal>

      {/* Hipossuficiência */}
      <Modal aberto={modal === "hipo"} titulo={`Declaração de hipossuficiência — ${cliente.nome}`} onFechar={() => setModal(null)}>
        <form onSubmit={gerarHipo} className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
            Declaração nos termos da Lei 1.060/50, assinada por {cliente.nome}.
          </p>
          <CamposQualificacao comProfissao />
          <div className="flex justify-end"><BotaoPrimario type="submit">Gerar declaração</BotaoPrimario></div>
        </form>
      </Modal>

      {/* Contrato */}
      <Modal aberto={modal === "contrato"} titulo={`Contrato de honorários — contratante: ${cliente.nome}`} onFechar={() => setModal(null)}>
        <form onSubmit={gerarContrato} className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
            <b>{cliente.nome}</b> assina como <b>contratante</b>. A pessoa defendida pode ser outra
            (esposa contratando pela defesa do marido, mãe pelo filho…).
          </p>

          <CamposQualificacao />

          <div className="border-t border-slate-100 pt-3">
            <Field rotulo="Pessoa defendida" obrigatorio>
              <Select value={defendidoId} onChange={(e) => setDefendidoId(e.target.value)}>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}{c.id === cliente.id ? " (o próprio contratante)" : ""}
                  </option>
                ))}
                <option value="__outro__">Outra pessoa (digitar o nome)…</option>
              </Select>
            </Field>
            {defendidoId === "__outro__" && (
              <div className="mt-2">
                <Field rotulo="Nome completo do defendido" obrigatorio>
                  <Input required value={defendidoNomeLivre} onChange={(e) => setDefendidoNomeLivre(e.target.value)} />
                </Field>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field rotulo="Processo (opcional)">
              <Select value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
                <option value="">Sem processo ainda</option>
                {processosDoDefendido.map((p) => (
                  <option key={p.id} value={p.id}>{formatCNJ(p.numero_cnj)}</option>
                ))}
              </Select>
            </Field>
            <Field rotulo="Ou nº do processo">
              <Input value={numeroLivre} onChange={(e) => setNumeroLivre(e.target.value)} placeholder="0000000-00.0000…" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field rotulo="Valor total (R$)" obrigatorio>
              <Input required inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="5000,00" />
            </Field>
            <Field rotulo="Parcelas" obrigatorio>
              <Input required type="number" min={1} max={60} value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
            </Field>
            <Field rotulo="1º vencimento" obrigatorio>
              <Input required type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </Field>
          </div>

          <Field rotulo="Objeto do contrato" obrigatorio>
            <Textarea
              required
              rows={4}
              value={objeto}
              onChange={(e) => {
                setObjeto(e.target.value);
                setObjetoEditado(true);
              }}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={primeiraPaga} onChange={(e) => setPrimeiraPaga(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Primeira parcela já paga antes da assinatura
          </label>
          {primeiraPaga && (
            <div className="space-y-2 rounded-lg bg-amber-50 p-2.5">
              <Field rotulo="Data em que a 1ª parcela foi paga">
                <Input type="date" value={pagaEm} onChange={(e) => setPagaEm(e.target.value)} />
              </Field>
              <p className="text-xs text-amber-800">
                O contrato dirá que a 1ª parcela foi <b>quitada em {pagaEm ? dataBR(pagaEm) : "—"}</b> e as demais
                vencem todo dia <b>{vencimento ? new Date(`${vencimento}T12:00:00`).getDate() : "—"}</b>.
                No Financeiro, ela entra como recebida nessa data.
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={lancarFinanceiro} onChange={(e) => setLancarFinanceiro(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Lançar as parcelas automaticamente no Financeiro
          </label>

          <div className="flex justify-end"><BotaoPrimario type="submit">Gerar contrato</BotaoPrimario></div>
        </form>
      </Modal>
    </Card>
  );
}
