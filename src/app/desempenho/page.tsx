"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Cliente, Lancamento, Processo } from "@/lib/types";
import { brl, hojeISO, maiusculaInicial, mesPorExtenso } from "@/lib/format";
import {
  MESES_CURTOS,
  anosComDados,
  distribuicaoCarteira,
  lerMeta,
  metaSugerida,
  previsaoMes,
  projecaoAno,
  resumoAno,
  salvarMeta,
  topClientes,
  totalAteMes,
  variacao,
} from "@/lib/metricas";
import { BarraCarteira, GraficoArea, ListaBarras, MedidorMeta } from "@/components/Charts";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default function DesempenhoPage() {
  const router = useRouter();
  const { rows: lancamentos } = useTable<Lancamento>("lancamentos");
  const { rows: processos } = useTable<Processo>("processos");
  const { rows: clientes } = useTable<Cliente>("clientes");

  const hoje = hojeISO();
  const anos = useMemo(() => anosComDados(lancamentos), [lancamentos]);
  const anoCorrente = hoje.slice(0, 4);
  // O ano exibido é DERIVADO (não um efeito): enquanto os lançamentos ainda estão
  // carregando só existem os anos históricos, e um efeito "corrigiria" a seleção
  // para o último ano fechado, abrindo a página no ano errado.
  const [anoEscolhido, setAnoEscolhido] = useState<string | null>(null);
  const ano =
    anoEscolhido ?? (anos.includes(anoCorrente) ? anoCorrente : anos[anos.length - 1] ?? anoCorrente);
  const setAno = setAnoEscolhido;

  const resumo = useMemo(() => resumoAno(lancamentos, ano, hoje), [lancamentos, ano, hoje]);
  const idxAnterior = anos.indexOf(ano) - 1;
  const anoAnterior = idxAnterior >= 0 ? anos[idxAnterior] : null;
  const resumoAnterior = useMemo(
    () => (anoAnterior ? resumoAno(lancamentos, anoAnterior, hoje) : null),
    [lancamentos, anoAnterior, hoje]
  );

  const ehAnoCorrente = ano === anoCorrente;
  const projecao = projecaoAno(resumo);
  // Comparação sempre entre períodos equivalentes: no ano corrente, confronta o
  // acumulado até o mês de hoje com os MESMOS meses do ano anterior — comparar
  // 8 meses contra 12 acusaria "queda" mesmo num ano que vai fechar melhor.
  const baseAnterior = resumoAnterior
    ? ehAnoCorrente
      ? totalAteMes(resumoAnterior, resumo.mesesDecorridos)
      : resumoAnterior.total
    : null;
  const varAno = baseAnterior !== null ? variacao(resumo.total, baseAnterior) : null;
  const rotuloComparacao = ehAnoCorrente
    ? `vs jan–${MESES_CURTOS[resumo.mesesDecorridos - 1]} de ${anoAnterior}`
    : `vs ${anoAnterior}`;

  // meta: o que estiver salvo, senão uma sugestão (20% acima do ano anterior)
  const sugestao = useMemo(() => metaSugerida(resumo, resumoAnterior?.total ?? null), [resumo, resumoAnterior]);
  const [meta, setMeta] = useState<number>(0);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");

  useEffect(() => {
    setMeta(lerMeta(ano) ?? sugestao);
  }, [ano, sugestao]);

  function confirmarMeta() {
    const v = Number(rascunho.replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(v) && v > 0) {
      salvarMeta(ano, v);
      setMeta(v);
    }
    setEditando(false);
  }

  // só os meses que já aconteceram — plotar meses futuros como zero faria a
  // linha despencar e mentir sobre a tendência
  const mesesPlot = ehAnoCorrente ? resumo.mesesDecorridos : 12;

  // Um caso de anos pago de uma vez estica a escala e achata todo o resto do
  // ano. Com algum recebimento marcado como excepcional, o gráfico abre
  // diluído — que é a leitura útil para comparar meses — e o botão devolve o
  // caixa de verdade a um toque.
  const [verCaixa, setVerCaixa] = useState(false);
  const temDiluido = resumo.nDiluidos > 0;
  const diluindo = temDiluido && !verCaixa;
  const serie = diluindo ? resumo.porMesDiluido : resumo.porMes;

  const pontos = serie.slice(0, mesesPlot);
  const rotulos = MESES_CURTOS.slice(0, mesesPlot);

  // Previsão do mês corrente — sempre de hoje, independente do ano escolhido nas
  // abas (olhar 2024 não muda o que vai entrar em setembro).
  const previsao = useMemo(() => previsaoMes(lancamentos, hoje), [lancamentos, hoje]);

  const carteira = useMemo(() => distribuicaoCarteira(processos), [processos]);
  const top = useMemo(() => topClientes(lancamentos, clientes, ano, 6), [lancamentos, clientes, ano]);

  const mediaMensal = resumo.mesesDecorridos ? resumo.total / resumo.mesesDecorridos : 0;
  // o "melhor mês" acompanha o gráfico: apontar fevereiro enquanto a tela mostra
  // a curva diluída (onde fevereiro não é mais o pico) seria contradizer o
  // próprio desenho logo acima
  const melhorMes = serie.indexOf(Math.max(...serie));

  // Detalhar o mês só faz sentido nos anos que têm lançamento de verdade. Os
  // anos fechados vieram das planilhas como total agregado por mês: o clique
  // abriria uma lista vazia e pareceria bug.
  const detalharMes = resumo.historico
    ? undefined
    : (i: number) => router.push(`/financeiro?mes=${ano}-${String(i + 1).padStart(2, "0")}`);

  const verFase = (i: number) => router.push(`/processos?fase=${carteira.fatias[i].fase}`);

  if (anos.length === 0) {
    return (
      <div>
        <PageHeader titulo="Desempenho" sub="Evolução, metas e carteira" />
        <EmptyState>Ainda não há recebimentos lançados para montar os gráficos.</EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Desempenho"
        sub="Evolução, metas e carteira"
        acao={
          anos.length > 1 ? (
            <div className="flex gap-1.5">
              {anos.map((a) => (
                <button
                  key={a}
                  onClick={() => setAno(a)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    ano === a ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {/* Número-herói: o faturamento do ano + meta */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recebido em {ano}</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">{brl(resumo.total)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {varAno !== null && (
                <span className={`inline-flex items-center gap-1 font-semibold ${varAno >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {varAno >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {varAno >= 0 ? "+" : ""}
                  {varAno.toFixed(0)}% {rotuloComparacao}
                </span>
              )}
              <span className="tabular-nums">{resumo.nRecebimentos} recebimentos</span>
              <span className="tabular-nums">média {brl(mediaMensal)}/mês</span>
              {resumo.historico && <span className="text-slate-400">da planilha de {ano}</span>}
            </div>
          </div>

          <div className={`min-w-[190px] flex-1 sm:max-w-xs ${ehAnoCorrente ? "" : "hidden"}`}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Meta do ano</p>
              {editando ? (
                <button onClick={confirmarMeta} className="text-slate-400 transition hover:text-emerald-600" title="salvar meta">
                  <Check size={14} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRascunho(String(Math.round(meta)));
                    setEditando(true);
                  }}
                  className="text-slate-400 transition hover:text-slate-900"
                  title="editar meta"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
            {editando ? (
              <input
                autoFocus
                inputMode="decimal"
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarMeta()}
                onBlur={confirmarMeta}
                className="mb-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="150000"
              />
            ) : null}
            <MedidorMeta realizado={resumo.total} meta={meta} projecao={ehAnoCorrente ? projecao : undefined} />
            {ehAnoCorrente && (
              <p className="mt-2 text-xs text-slate-500">
                No ritmo atual, {ano} fecha em <span className="font-semibold tabular-nums text-slate-700">{brl(projecao)}</span>
                {projecao >= meta ? " — acima da meta. 🎯" : ` — faltam ${brl(meta - projecao)} para a meta.`}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Evolução mês a mês */}
      <Card className="p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">📈 Faturamento mês a mês — {ano}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {temDiluido && (
              <div className="flex gap-1">
                {(
                  [
                    [false, "Diluído"],
                    [true, "Como entrou"],
                  ] as const
                ).map(([v, rotulo]) => (
                  <button
                    key={rotulo}
                    onClick={() => setVerCaixa(v)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      verCaixa === v ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            )}
            {melhorMes >= 0 && serie[melhorMes] > 0 && (
              <span className="text-xs text-slate-500">
                melhor mês: <span className="font-semibold text-slate-700">{MESES_CURTOS[melhorMes]}</span>{" "}
                <span className="tabular-nums">{brl(serie[melhorMes])}</span>
              </span>
            )}
          </div>
        </div>
        <GraficoArea
          pontos={pontos}
          rotulos={rotulos}
          ultimoParcial={ehAnoCorrente}
          onSelecionar={detalharMes}
        />
        {/* Diluir muda o desenho, não o dinheiro. Dizer isso na tela é o que
            separa uma leitura mais justa de um gráfico que mente. */}
        {diluindo && (
          <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            <span className="font-semibold">{brl(resumo.totalDiluido)}</span> de{" "}
            {resumo.nDiluidos === 1 ? "um recebimento excepcional" : `${resumo.nDiluidos} recebimentos excepcionais`} está
            espalhado em partes iguais pelos {mesesPlot} meses, para o pico não achatar o resto do ano. O total de {ano}{" "}
            não muda — o dinheiro entrou de uma vez. Toque em <span className="font-semibold">Como entrou</span> para ver
            o mês real.
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          {ehAnoCorrente && `O mês corrente (${MESES_CURTOS[resumo.mesesDecorridos - 1]}) ainda está em curso — por isso aparece esmaecido. `}
          {detalharMes
            ? diluindo
              ? "Toque num mês para ver os recebimentos daquele mês — lá aparece o que entrou de verdade, sem a diluição."
              : "Toque num mês para ver os recebimentos daquele mês."
            : `${ano} veio da planilha de controle, que guarda só o total de cada mês — não há recebimento a abrir.`}
        </p>
      </Card>

      {/* O mês corrente, sempre o de HOJE — olhar 2024 nas abas não muda o que
          vai entrar em setembro.

          O card já se chamou "Previsão", e o nome mentia: a conta só enxerga
          parcela agendada, e a maior parte do dinheiro deste escritório chega
          sem agenda nenhuma. Lido como projeção, o número assustava todo mês. */}
      {ehAnoCorrente && (previsao.previsao > 0 || previsao.atrasadoAnterior > 0) && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              📅 {maiusculaInicial(mesPorExtenso(previsao.mes))} até agora
            </h2>
            <Link href="/cobranca" className="text-xs font-semibold text-brand-700 hover:underline">
              cobrança
            </Link>
          </div>

          <p className="text-3xl font-bold tabular-nums text-slate-900">{brl(previsao.previsao)}</p>
          <p className="text-xs font-medium text-slate-500">garantidos até aqui</p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold tabular-nums text-emerald-700">{brl(previsao.recebido)}</span> já entraram
            {previsao.aReceber > 0 && (
              <>
                {" + "}
                <span className="font-semibold tabular-nums text-amber-700">{brl(previsao.aReceber)}</span> agendados
                para vencer
                <span className="tabular-nums"> ({previsao.quantidade} parcela{previsao.quantidade === 1 ? "" : "s"})</span>
              </>
            )}
          </p>

          {/* O tamanho do próprio ponto cego, medido nos dados do ano em vez de
              afirmado. Sem isto o número passa por projeção de faturamento. */}
          {mediaMensal > 0 && (
            <p className="mt-3 rounded-lg bg-brand-50 px-2.5 py-2 text-xs text-slate-700">
              <span className="font-semibold">Isto é um piso, não a previsão do mês.</span> A conta só enxerga parcela
              agendada.
              {previsao.fatiaSemAgenda !== null && previsao.fatiaSemAgenda > 0.15 && (
                <>
                  {" "}
                  Em {ano}, <span className="font-semibold tabular-nums">{Math.round(previsao.fatiaSemAgenda * 100)}%</span>{" "}
                  do que entrou veio de clientes sem parcela programada — caso novo, acordo fechado no mês, honorário
                  combinado por fora.
                </>
              )}{" "}
              Seus meses fecham em <span className="font-semibold tabular-nums">{brl(mediaMensal)}</span> na média.
            </p>
          )}

          <div className="mt-3 space-y-1.5">
            {previsao.jaVenceu > 0 && (
              <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                <span className="font-semibold tabular-nums">{brl(previsao.jaVenceu)}</span> desse total já passou do
                vencimento — é o que dá para cobrar hoje.
              </p>
            )}
            {previsao.atrasadoAnterior > 0 && (
              <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                {/* Atraso velho fica FORA da conta de propósito: somá-lo daria
                    um número bonito que nunca se cumpre. */}
                Fora desta conta: <span className="font-semibold tabular-nums">{brl(previsao.atrasadoAnterior)}</span>{" "}
                parados de meses anteriores. Não entram porque já não vieram quando deviam — se caírem, é ganho em cima
                disso.
              </p>
            )}
          </div>

          <p className="mt-2 text-xs text-slate-400">
            É faturamento a receber, não lucro: o sistema registra as entradas, não as despesas do escritório — descontar
            custo daqui seria inventar número.
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Carteira ativa por fase — sempre a foto de HOJE, não do ano escolhido */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">⚖️ Carteira ativa {!ehAnoCorrente && <span className="font-normal text-slate-400">(hoje)</span>}</h2>
            <Link href="/processos" className="text-xs font-semibold text-brand-700 hover:underline">
              processos
            </Link>
          </div>
          {carteira.ativos === 0 ? (
            <EmptyState>Nenhum caso ativo no momento.</EmptyState>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-600">
                <span className="text-2xl font-bold tabular-nums text-slate-900">{carteira.ativos}</span> casos em andamento
                <span className="text-slate-400"> · {carteira.encerrados} encerrados</span>
              </p>
              <BarraCarteira fatias={carteira.fatias} onSelecionar={verFase} />
              <p className="mt-3 text-xs text-slate-400">Toque numa fase para ver os casos.</p>
            </>
          )}
        </Card>

        {/* Top clientes */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">🏆 Quem mais faturou em {ano}</h2>
            <Link href="/clientes" className="text-xs font-semibold text-brand-700 hover:underline">
              clientes
            </Link>
          </div>
          {top.length === 0 ? (
            <EmptyState>Sem recebimentos vinculados a cliente neste ano.</EmptyState>
          ) : (
            <ListaBarras itens={top.map((c) => ({ rotulo: c.nome, valor: c.total }))} />
          )}
        </Card>
      </div>

      {/* Comparação entre anos */}
      {anos.length > 1 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-slate-900">📊 Evolução anual</h2>
          <ListaBarras
            itens={anos.map((a) => {
              const r = resumoAno(lancamentos, a, hoje);
              const emCurso = a === anoCorrente;
              return { rotulo: emCurso ? `${a} (em curso)` : a, valor: r.total };
            })}
          />
          <p className="mt-3 text-xs text-slate-500">
            {anoCorrente} ainda está correndo — no ritmo atual fecha em{" "}
            <span className="font-semibold tabular-nums text-slate-700">{brl(projecaoAno(resumoAno(lancamentos, anoCorrente, hoje)))}</span>.
            Anos fechados vieram das planilhas de controle, já sem os lançamentos que não são de cliente.
          </p>
        </Card>
      )}
    </div>
  );
}
