"use client";

import { useEffect, useReducer, useState } from "react";
import {
  Award, Brain, Briefcase, Coins, Flame, Gavel, HeartHandshake, Lock,
  RotateCcw, Search, Skull, Sparkles, TrendingUp, Trophy, Users,
} from "lucide-react";
import {
  brl, brlCurto, chanceAceite, chanceVitoria, estadoInicial, honorarioDe,
  leituraTecnica, reduzir, carregar, salvar, type Acao,
} from "@/lib/jogo/motor";
import {
  CIDADES, EMOJI_AREA, ESCRITORIOS, ROTULO_AREA, TREINOS,
} from "@/lib/jogo/conteudo";
import type { CasoAtivo, CasoOferta, Estado, FaixaPreco } from "@/lib/jogo/tipos";

const FAIXAS: { id: FaixaPreco; nome: string; hint: string }[] = [
  { id: "conservador", nome: "Conservador", hint: "menor valor, quase certo" },
  { id: "justo", nome: "Justo", hint: "valor de mercado" },
  { id: "ousado", nome: "Ousado", hint: "valor alto, mais risco" },
  { id: "abusivo", nome: "Abusivo", hint: "vale ouro, difícil fechar" },
];

type Aba = "escritorio" | "evoluir" | "submundo" | "registro";

export default function JogoPage() {
  const [estado, dispatch] = useReducer(
    (e: Estado, a: Acao) => reduzir(e, a),
    undefined as unknown as Estado,
    () => estadoInicial(),
  );
  const [pronto, setPronto] = useState(false);
  const [aba, setAba] = useState<Aba>("escritorio");
  const [negociando, setNegociando] = useState<CasoOferta | null>(null);
  const [protocolando, setProtocolando] = useState<CasoAtivo | null>(null);

  // Carrega salve na montagem (client-side).
  useEffect(() => {
    const salvo = carregar();
    if (salvo) dispatch({ tipo: "carregar", estado: salvo });
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pronto) salvar(estado);
  }, [estado, pronto]);

  // Evita divergência de hidratação (o estado inicial é aleatório).
  if (!pronto) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-20 text-sm text-slate-400">
        Carregando o escritório…
      </div>
    );
  }

  const esc = ESCRITORIOS[estado.escritorioNivel];
  const cidade = CIDADES.find((c) => c.id === estado.cidadeId)!;
  const feedContagem = estado.feed.length;

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho estado={estado} onReiniciar={() => { if (confirm("Recomeçar do zero? O progresso será perdido.")) dispatch({ tipo: "reiniciar" }); }} />

      <BarraStatus estado={estado} esc={esc} cidade={cidade} />

      <Abas aba={aba} setAba={setAba} feedContagem={feedContagem} temCrime={!!estado.crime && estado.preso <= 0} />

      <div className="mt-4">
        {estado.preso > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <Lock size={20} />
            <div>
              <p className="font-bold">Você está preso.</p>
              <p>Faltam {estado.preso} dia(s). Encerre os dias para cumprir a pena — os casos param enquanto isso.</p>
            </div>
          </div>
        )}

        {aba === "escritorio" && (
          <AbaEscritorio estado={estado} esc={esc} onNegociar={setNegociando} onProtocolar={setProtocolando} dispatch={dispatch} />
        )}
        {aba === "evoluir" && <AbaEvoluir estado={estado} dispatch={dispatch} />}
        {aba === "submundo" && <AbaSubmundo estado={estado} dispatch={dispatch} />}
        {aba === "registro" && <AbaRegistro estado={estado} />}
      </div>

      {negociando && (
        <ModalNegociar estado={estado} oferta={negociando} onFechar={() => setNegociando(null)}
          onConfirmar={(faixa) => { dispatch({ tipo: "aceitar", ofertaId: negociando.id, faixa }); setNegociando(null); }} />
      )}
      {protocolando && (
        <ModalProtocolar estado={estado} caso={protocolando} onFechar={() => setProtocolando(null)}
          onConfirmar={(tesesIds) => { dispatch({ tipo: "protocolar", casoId: protocolando.id, tesesIds }); setProtocolando(null); }} />
      )}

      {estado.encerrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <Skull className="mx-auto mb-3 text-red-600" size={40} />
            <h2 className="text-xl font-bold text-slate-900">Fim de jogo</h2>
            <p className="mt-2 text-sm text-slate-600">
              As dívidas afundaram o escritório. Você chegou ao dia {estado.dia} com {estado.vitorias} vitórias e {estado.derrotas} derrotas.
            </p>
            <button onClick={() => dispatch({ tipo: "reiniciar" })}
              className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Recomeçar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------- Cabeçalho
function Cabecalho({ estado, onReiniciar }: { estado: Estado; onReiniciar: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Gavel size={22} className="text-brand-600" /> Vida de Advogado
        </h1>
        <p className="text-sm text-slate-500">Dia {estado.dia} · Nível {estado.nivel} · {estado.vitorias}V / {estado.derrotas}D</p>
      </div>
      <button onClick={onReiniciar} title="Recomeçar"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        <RotateCcw size={14} /> Recomeçar
      </button>
    </div>
  );
}

// -------------------------------------------------------------- Barra de status
function BarraStatus({ estado, esc, cidade }: { estado: Estado; esc: (typeof ESCRITORIOS)[number]; cidade: (typeof CIDADES)[number] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica icone={<Coins size={16} />} rotulo="Caixa" valor={brl(estado.dinheiro)} destaque={estado.dinheiro < 0} />
        <div className="flex items-center gap-2">
          <span className="text-amber-500"><Flame size={16} /></span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Energia</p>
            <div className="mt-0.5 flex gap-1">
              {Array.from({ length: estado.energiaMax + esc.energiaBonus }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < estado.energia ? "bg-amber-400" : "bg-slate-200"}`} />
              ))}
            </div>
          </div>
        </div>
        <Metrica icone={<Trophy size={16} />} rotulo="XP" valor={`${estado.xp}/${estado.nivel * 100}`} />
        <Metrica icone={<Briefcase size={16} />} rotulo="Escritório" valor={esc.nome.split(" ")[0]} sub={cidade.nome} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Atributo icone={<Award size={14} />} rotulo="Reputação" valor={estado.reputacao} cor="bg-violet-500" />
        <Atributo icone={<HeartHandshake size={14} />} rotulo="Carisma" valor={estado.carisma} cor="bg-rose-500" />
        <Atributo icone={<Brain size={14} />} rotulo="Técnica" valor={estado.tecnica} cor="bg-sky-500" />
      </div>
    </div>
  );
}

function Metrica({ icone, rotulo, valor, sub, destaque }: { icone: React.ReactNode; rotulo: string; valor: string; sub?: string; destaque?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icone}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{rotulo}</p>
        <p className={`truncate text-sm font-bold ${destaque ? "text-red-600" : "text-slate-900"}`}>{valor}</p>
        {sub && <p className="truncate text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function Atributo({ icone, rotulo, valor, cor }: { icone: React.ReactNode; rotulo: string; valor: number; cor: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1">{icone} {rotulo}</span>
        <span className="font-bold text-slate-700">{Math.round(valor)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Abas
function Abas({ aba, setAba, feedContagem, temCrime }: { aba: Aba; setAba: (a: Aba) => void; feedContagem: number; temCrime: boolean }) {
  const itens: { id: Aba; nome: string; badge?: boolean }[] = [
    { id: "escritorio", nome: "Escritório" },
    { id: "evoluir", nome: "Evoluir" },
    { id: "submundo", nome: "Submundo", badge: temCrime },
    { id: "registro", nome: "Registro" },
  ];
  return (
    <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
      {itens.map((it) => (
        <button key={it.id} onClick={() => setAba(it.id)}
          className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${aba === it.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          {it.nome}
          {it.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------------- Aba Escritório
function AbaEscritorio({ estado, esc, onNegociar, onProtocolar, dispatch }: {
  estado: Estado; esc: (typeof ESCRITORIOS)[number];
  onNegociar: (o: CasoOferta) => void; onProtocolar: (c: CasoAtivo) => void; dispatch: (a: Acao) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Casos ativos */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Briefcase size={16} /> Casos em andamento
          <span className="ml-1 text-xs font-normal text-slate-400">{estado.ativos.length}/{esc.slots}</span>
        </h2>
        {estado.ativos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Nenhum caso em andamento. Aceite um caso abaixo.
          </p>
        ) : (
          <div className="space-y-2">
            {estado.ativos.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <span>{EMOJI_AREA[c.area]}</span>{c.titulo}
                    </p>
                    <p className="text-xs text-slate-500">{c.cliente} · {ROTULO_AREA[c.area]} · honorário {brlCurto(c.honorario)}</p>
                    <p className="mt-0.5 text-[11px] text-amber-600">Protocolar até o dia {c.diaLimite}</p>
                  </div>
                  <button onClick={() => onProtocolar(c)}
                    className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
                    Trabalhar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Novos casos */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Sparkles size={16} /> Novos casos na porta
        </h2>
        {estado.preso > 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Nada chega enquanto você está preso.
          </p>
        ) : estado.ofertas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Sem novos casos hoje. Encerre o dia para novas oportunidades.
          </p>
        ) : (
          <div className="space-y-2">
            {estado.ofertas.map((o) => (
              <CartaoOferta key={o.id} estado={estado} oferta={o} onNegociar={onNegociar} dispatch={dispatch} />
            ))}
          </div>
        )}
      </section>

      <button onClick={() => dispatch({ tipo: "encerrar-dia" })}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]">
        🌙 Encerrar o dia {estado.dia} · custo {brlCurto(esc.aluguel + estado.estagiarios * 40)}
      </button>
    </div>
  );
}

function CartaoOferta({ estado, oferta, onNegociar, dispatch }: {
  estado: Estado; oferta: CasoOferta; onNegociar: (o: CasoOferta) => void; dispatch: (a: Acao) => void;
}) {
  const leitura = oferta.analisado ? leituraTecnica(estado, oferta) : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <span>{EMOJI_AREA[oferta.area]}</span>{oferta.titulo}
          </p>
          <p className="text-xs text-slate-500">{oferta.cliente} · {ROTULO_AREA[oferta.area]}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">≈ {brlCurto(oferta.valorBase)}</p>
          <p className="text-[10px] text-slate-400">{"⚫".repeat(oferta.complexidade)}<span className="text-slate-200">{"⚫".repeat(5 - oferta.complexidade)}</span></p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{oferta.resumo}</p>

      {leitura && (
        <div className={`mt-2 rounded-lg p-2 text-xs ${leitura.buxaRevelada ? "bg-red-50 text-red-700" : "bg-sky-50 text-sky-800"}`}>
          {leitura.buxaRevelada ? (
            <p className="font-semibold">⚠️ Caso buxa! {oferta.sinal}</p>
          ) : (
            <p>🔎 Leitura: chance estimada de vitória <b>{Math.round(leitura.chanceEstim * 100)}%</b>. {oferta.sinal}</p>
          )}
          {!oferta.aceitaEntrada && <p className="mt-1 font-medium">💸 Cliente não quer pagar entrada.</p>}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        {!oferta.analisado && (
          <button onClick={() => dispatch({ tipo: "analisar", ofertaId: oferta.id })}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Search size={13} /> Analisar (1⚡)
          </button>
        )}
        <button onClick={() => onNegociar(oferta)}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
          Negociar honorário
        </button>
        <button onClick={() => dispatch({ tipo: "recusar", ofertaId: oferta.id })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          Recusar
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Aba Evoluir
function AbaEvoluir({ estado, dispatch }: { estado: Estado; dispatch: (a: Acao) => void }) {
  const esc = ESCRITORIOS[estado.escritorioNivel];
  const prox = ESCRITORIOS[estado.escritorioNivel + 1];
  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><TrendingUp size={16} /> Treinar o personagem</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TREINOS.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{t.nome}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t.descricao}</p>
              <button onClick={() => dispatch({ tipo: "treinar", treinoId: t.id })} disabled={estado.dinheiro < t.custo}
                className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-40">
                +{t.ganho} {t.atributo} · {brlCurto(t.custo)} · {t.energia}⚡
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Users size={16} /> Estagiários</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm text-slate-700">Na equipe: <b>{estado.estagiarios}</b> / {esc.maxEstagiarios}</p>
          <p className="mt-0.5 text-xs text-slate-500">Cada estagiário reforça a técnica nos casos (custa R$ 40/dia de salário).</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => dispatch({ tipo: "contratar-estagiario" })}
              disabled={estado.estagiarios >= esc.maxEstagiarios || estado.dinheiro < 3000}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-40">
              Contratar · R$ 3k
            </button>
            <button onClick={() => dispatch({ tipo: "demitir-estagiario" })} disabled={estado.estagiarios <= 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              Dispensar
            </button>
          </div>
          {esc.maxEstagiarios === 0 && <p className="mt-2 text-[11px] text-amber-600">Amplie o escritório para poder contratar.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Briefcase size={16} /> Escritório</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-900">{esc.nome}</p>
          <p className="text-xs text-slate-500">{esc.descricao}</p>
          <p className="mt-1 text-[11px] text-slate-400">Vagas de casos: {esc.slots} · Aluguel {brlCurto(esc.aluguel)}/dia</p>
          {prox ? (
            <button onClick={() => dispatch({ tipo: "upgrade-escritorio" })} disabled={estado.dinheiro < prox.custoUpgrade}
              className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40">
              Mudar para “{prox.nome}” · {brl(prox.custoUpgrade)}
            </button>
          ) : <p className="mt-2 text-xs font-semibold text-emerald-600">Você está no topo. 🏛️</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">📍 Localidade</h2>
        <div className="space-y-2">
          {CIDADES.map((c) => (
            <div key={c.id} className={`rounded-xl border p-3 ${c.id === estado.cidadeId ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.nome} {c.id === estado.cidadeId && <span className="text-xs text-brand-600">(atual)</span>}</p>
                  <p className="text-xs text-slate-500">{c.descricao}</p>
                </div>
                {c.id !== estado.cidadeId && (
                  <button onClick={() => dispatch({ tipo: "mudar-cidade", cidadeId: c.id })} disabled={estado.dinheiro < c.custoMudanca}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                    {c.custoMudanca === 0 ? "Ir" : brlCurto(c.custoMudanca)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------- Aba Submundo
function AbaSubmundo({ estado, dispatch }: { estado: Estado; dispatch: (a: Acao) => void }) {
  if (estado.preso > 0) return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Atrás das grades não há negócios. Cumpra a pena.</p>;
  if (!estado.crime) return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Ninguém do submundo apareceu hoje. Ufa. 😅</p>;
  const c = estado.crime;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-red-800"><Skull size={18} /> {c.titulo}</p>
      <p className="mt-2 text-sm text-red-900/80">{c.descricao}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Ganho</p><p className="font-bold text-emerald-600">{brl(c.ganho)}</p></div>
        <div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Se for pego</p><p className="font-bold text-red-600">-{brlCurto(c.multa)} · {c.penaDias}d preso</p></div>
      </div>
      <p className="mt-2 text-[11px] text-red-700/80">Reputação alta atrai olhares; técnica ajuda a não deixar rastro. Ao ser pego: multa, cadeia e reputação despencando.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => dispatch({ tipo: "crime-aceitar" })}
          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">Topar (2⚡)</button>
        <button onClick={() => dispatch({ tipo: "crime-recusar" })}
          className="flex-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">Recusar</button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Aba Registro
function AbaRegistro({ estado }: { estado: Estado }) {
  const cor = { bom: "text-emerald-700 bg-emerald-50", ruim: "text-red-700 bg-red-50", crime: "text-purple-700 bg-purple-50", neutro: "text-slate-600 bg-slate-50" };
  if (estado.feed.length === 0) return <p className="text-center text-sm text-slate-500">Sem registros ainda.</p>;
  return (
    <ul className="space-y-1.5">
      {estado.feed.map((f) => (
        <li key={f.id} className={`rounded-lg px-3 py-2 text-xs ${cor[f.tipo]}`}>
          <span className="font-semibold text-slate-400">D{f.dia} · </span>{f.texto}
        </li>
      ))}
    </ul>
  );
}

// -------------------------------------------------------------- Modal negociar
function ModalNegociar({ estado, oferta, onFechar, onConfirmar }: {
  estado: Estado; oferta: CasoOferta; onFechar: () => void; onConfirmar: (f: FaixaPreco) => void;
}) {
  const [faixa, setFaixa] = useState<FaixaPreco>("justo");
  const honorario = honorarioDe(oferta, faixa);
  const aceite = chanceAceite(estado, oferta, faixa);
  return (
    <Overlay onFechar={onFechar}>
      <h3 className="text-base font-bold text-slate-900">Negociar honorário</h3>
      <p className="text-xs text-slate-500">{oferta.cliente} · {oferta.titulo}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {FAIXAS.map((f) => (
          <button key={f.id} onClick={() => setFaixa(f.id)}
            className={`rounded-xl border p-2.5 text-left transition ${faixa === f.id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300"}`}>
            <p className="text-sm font-bold text-slate-900">{f.nome}</p>
            <p className="text-[11px] text-slate-500">{f.hint}</p>
            <p className="mt-1 text-sm font-bold text-brand-700">{brl(honorarioDe(oferta, f.id))}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Honorário</span><b className="text-slate-900">{brl(honorario)}</b></div>
        <div className="flex justify-between"><span className="text-slate-500">Entrada (se fechar)</span><b className="text-slate-900">{oferta.aceitaEntrada ? brl(Math.round(honorario * 0.3)) : "recusada 💸"}</b></div>
        <div className="mt-1.5">
          <div className="flex justify-between text-xs"><span className="text-slate-500">Chance do cliente aceitar</span><b className="text-slate-900">{Math.round(aceite * 100)}%</b></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${aceite > 0.6 ? "bg-emerald-500" : aceite > 0.35 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${aceite * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onFechar} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
        <button onClick={() => onConfirmar(faixa)} disabled={estado.energia < 1}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
          Propor (1⚡)
        </button>
      </div>
    </Overlay>
  );
}

// -------------------------------------------------------------- Modal protocolar
function ModalProtocolar({ estado, caso, onFechar, onConfirmar }: {
  estado: Estado; caso: CasoAtivo; onFechar: () => void; onConfirmar: (ids: string[]) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const chance = chanceVitoria(estado, caso, sel);
  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <Overlay onFechar={onFechar}>
      <h3 className="text-base font-bold text-slate-900">Montar a tese</h3>
      <p className="text-xs text-slate-500">{caso.titulo} · {caso.cliente}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{caso.resumo}</p>

      <p className="mt-3 text-xs font-semibold text-slate-700">Escolha as teses que você vai sustentar:</p>
      <div className="mt-2 space-y-1.5">
        {caso.teses.map((t) => (
          <button key={t.id} onClick={() => alternar(t.id)}
            className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left text-xs transition ${sel.includes(t.id) ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${sel.includes(t.id) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>
              {sel.includes(t.id) && "✓"}
            </span>
            <span className="text-slate-700">{t.texto}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <div className="flex justify-between text-xs"><span className="text-slate-500">Chance de ganhar o caso</span><b className="text-slate-900">{Math.round(chance * 100)}%</b></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full ${chance > 0.6 ? "bg-emerald-500" : chance > 0.35 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${chance * 100}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Teses coerentes elevam a chance; teses equivocadas derrubam. Técnica e reputação também pesam.</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onFechar} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Voltar</button>
        <button onClick={() => onConfirmar(sel)} disabled={estado.energia < 2 || sel.length === 0}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
          Protocolar (2⚡)
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onFechar }: { children: React.ReactNode; onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onFechar}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
