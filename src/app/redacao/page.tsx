"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Inbox, Newspaper, RefreshCw, Trash2, Archive, PenLine, Eye } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Pauta, Post, FontePauta } from "@/lib/types";

// Espelho do que /api/pautas/coletar devolve (sem importar o módulo server).
type Candidata = Omit<Pauta, "id" | "status" | "created_at">;
import { getStore } from "@/lib/store";
import { getSupabase, supabaseConfigurado } from "@/lib/supabase";
import { CompartilharBotao } from "@/components/CompartilharBotao";
import { PageHeader, Card, Field, Input, Textarea, BotaoPrimario, Badge, EmptyState } from "@/components/ui";
import { gerarSlug, markdownParaHtml, ROTULO_FONTE, COR_FONTE } from "@/lib/blog";
import { dataBR } from "@/lib/format";

type Aba = "pautas" | "posts";
const AUTOR_PADRAO = "Gustavo Roberto de Camargo";

export default function Redacao() {
  const [aba, setAba] = useState<Aba>("pautas");
  const [editando, setEditando] = useState<Post | null>(null);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <PageHeader
        titulo="Blog / Redação"
        sub="Pautas captadas das fontes oficiais e as publicações do blog Radar Penal."
        acao={
          <Link href="/blog" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Eye size={15} /> Ver o blog
          </Link>
        }
      />

      {editando ? (
        <EditorPost post={editando} onFechar={() => setEditando(null)} />
      ) : (
        <>
          <div className="mb-5 flex gap-2">
            <BotaoAba ativa={aba === "pautas"} onClick={() => setAba("pautas")} icone={<Inbox size={16} />}>
              Caixa de pautas
            </BotaoAba>
            <BotaoAba ativa={aba === "posts"} onClick={() => setAba("posts")} icone={<Newspaper size={16} />}>
              Publicações
            </BotaoAba>
          </div>
          {aba === "pautas" ? <AbaPautas onEscrever={setEditando} /> : <AbaPosts onEditar={setEditando} />}
        </>
      )}
    </div>
  );
}

function BotaoAba({ ativa, onClick, icone, children }: { ativa: boolean; onClick: () => void; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
        ativa ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {icone}
      {children}
    </button>
  );
}

// Chip de filtro por fonte, com contador.
function ChipFiltro({ ativo, onClick, n, children }: { ativo: boolean; onClick: () => void; n: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        ativo ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
      <span className={`rounded-full px-1.5 text-[10px] ${ativo ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{n}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Caixa de pautas
// ---------------------------------------------------------------------------
function AbaPautas({ onEscrever }: { onEscrever: (p: Post) => void }) {
  const { rows, refresh, insert, update } = useTable<Pauta>("pautas");
  const posts = useTable<Post>("posts");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FontePauta | "todas">("todas");

  const novas = rows.filter((p) => p.status === "nova");
  const arquivadas = rows.filter((p) => p.status !== "nova");

  // Contagem por fonte, para os botões de filtro.
  const contagem = (f: FontePauta) => novas.filter((p) => p.fonte === f).length;
  const novasFiltradas = filtro === "todas" ? novas : novas.filter((p) => p.fonte === filtro);

  async function buscar() {
    setBuscando(true);
    setAviso(null);
    try {
      // Envia o token do usuário logado para o servidor autorizar a coleta
      // (o endpoint é protegido pelo CRON_SECRET em produção).
      const headers: Record<string, string> = {};
      if (supabaseConfigurado) {
        const { data } = await getSupabase().auth.getSession();
        if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch("/api/pautas/coletar", { method: "POST", headers });
      const data = await res.json();
      if (data.persisted) {
        // Supabase: o servidor já gravou; só recarregamos a lista.
        await refresh();
        setAviso(`${data.inseridas ?? 0} nova(s) pauta(s). Fontes: STF ${data.porFonte?.stf ?? 0}, STJ ${data.porFonte?.stj ?? 0}, Câmara ${data.porFonte?.camara ?? 0}, Senado ${data.porFonte?.senado ?? 0}, Blogs ${data.porFonte?.blogs ?? 0}.`);
      } else {
        // Modo demo: gravamos localmente o que ainda não existe.
        const existentes = new Set(rows.map((p) => `${p.fonte}::${p.externo_id}`));
        const candidatas: Candidata[] = data.candidatas ?? [];
        let n = 0;
        for (const c of candidatas) {
          if (existentes.has(`${c.fonte}::${c.externo_id}`)) continue;
          await insert({ ...c, status: "nova" } as Partial<Pauta>);
          n++;
        }
        setAviso(
          n > 0
            ? `${n} nova(s) pauta(s) captada(s).`
            : candidatas.length === 0
            ? "Nenhuma pauta nova encontrada agora (as fontes oficiais podem estar indisponíveis a partir deste ambiente)."
            : "Nada novo — as pautas encontradas já estavam na caixa."
        );
        if (data.erros?.length) {
          setAviso((a) => `${a ?? ""} Fontes com falha: ${data.erros.map((e: { fonte: string }) => e.fonte.toUpperCase()).join(", ")}.`);
        }
      }
    } catch (e) {
      setAviso(`Falha ao buscar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBuscando(false);
    }
  }

  async function escreverDaPauta(p: Pauta) {
    const titulo = p.titulo.replace(/\s+—\s+.*$/, "").slice(0, 140) || p.titulo;
    const novo = await getStore().insert<Post>("posts", {
      titulo,
      slug: gerarSlug(titulo) + "-" + Math.random().toString(36).slice(2, 6),
      resumo: p.resumo ?? "",
      conteudo: `> Pauta captada em ${ROTULO_FONTE[p.fonte]}${p.data_fonte ? ` (${dataBR(p.data_fonte)})` : ""}.\n\n${p.resumo ?? ""}\n\n## O que foi decidido\n\n\n\n## Por que isso importa para a defesa\n\n\n\n*Este texto tem caráter informativo e não constitui aconselhamento jurídico.*`,
      autor: AUTOR_PADRAO,
      fonte_url: p.url,
      status: "rascunho",
      pauta_id: p.id,
    });
    await update(p.id, { status: "usada" });
    await posts.refresh();
    onEscrever(novo);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BotaoPrimario onClick={buscar}>
          <RefreshCw size={16} className={buscando ? "animate-spin" : ""} />
          {buscando ? "Buscando…" : "Buscar novas pautas"}
        </BotaoPrimario>
        <p className="text-xs text-slate-500">STF · STJ · Câmara · Senado — filtrado por assuntos penais.</p>
      </div>
      {aviso && <p className="mb-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">{aviso}</p>}

      {novas.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <ChipFiltro ativo={filtro === "todas"} onClick={() => setFiltro("todas")} n={novas.length}>
            Todas
          </ChipFiltro>
          {(["stf", "stj", "camara", "senado", "blogs"] as FontePauta[]).map((f) => (
            <ChipFiltro key={f} ativo={filtro === f} onClick={() => setFiltro(f)} n={contagem(f)}>
              {ROTULO_FONTE[f]}
            </ChipFiltro>
          ))}
        </div>
      )}

      {novas.length === 0 ? (
        <EmptyState>Nenhuma pauta na fila. Clique em “Buscar novas pautas”.</EmptyState>
      ) : novasFiltradas.length === 0 ? (
        <EmptyState>Nenhuma pauta desta fonte na fila.</EmptyState>
      ) : (
        <div className="space-y-3">
          {novasFiltradas.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge cor={COR_FONTE[p.fonte]}>{ROTULO_FONTE[p.fonte]}</Badge>
                {p.tema && <Badge cor="cinza">{p.tema}</Badge>}
                {p.data_fonte && <span className="text-xs text-slate-400">{dataBR(p.data_fonte)}</span>}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{p.titulo}</h3>
              {p.resumo && <p className="mt-1 text-sm text-slate-600">{p.resumo}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={() => escreverDaPauta(p)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                  <PenLine size={14} /> Escrever post
                </button>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <ExternalLink size={14} /> Fonte
                </a>
                <CompartilharBotao
                  titulo={p.titulo}
                  resumo={p.resumo}
                  url={p.url}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                />
                <button onClick={() => update(p.id, { status: "arquivada" })} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                  <Archive size={14} /> Arquivar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {arquivadas.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">
            {arquivadas.length} pauta(s) arquivada(s) / já usada(s)
          </summary>
          <div className="mt-3 space-y-2">
            {arquivadas.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-slate-500">
                <Badge cor={COR_FONTE[p.fonte]}>{ROTULO_FONTE[p.fonte]}</Badge>
                <span className="truncate">{p.titulo}</span>
                {p.status === "usada" && <Badge cor="verde">virou post</Badge>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publicações (lista de posts)
// ---------------------------------------------------------------------------
function AbaPosts({ onEditar }: { onEditar: (p: Post) => void }) {
  const { rows, insert } = useTable<Post>("posts");
  const ordenados = [...rows].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  async function novo() {
    const p = await insert({
      titulo: "Novo post",
      slug: "novo-post-" + Math.random().toString(36).slice(2, 6),
      resumo: "",
      conteudo: "",
      autor: AUTOR_PADRAO,
      status: "rascunho",
    });
    onEditar(p);
  }

  return (
    <div>
      <div className="mb-4">
        <BotaoPrimario onClick={novo}>
          <PenLine size={16} /> Novo post
        </BotaoPrimario>
      </div>
      {ordenados.length === 0 ? (
        <EmptyState>Nenhum post ainda. Crie um do zero ou a partir de uma pauta.</EmptyState>
      ) : (
        <div className="space-y-2">
          {ordenados.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              <button onClick={() => onEditar(p)} className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">{p.titulo}</p>
                {p.resumo && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.resumo}</p>}
              </button>
              {p.status === "publicado" ? <Badge cor="verde">publicado</Badge> : <Badge cor="ambar">rascunho</Badge>}
              {p.status === "publicado" && (
                <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Ver no blog">
                  <Eye size={16} />
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor de post
// ---------------------------------------------------------------------------
function EditorPost({ post, onFechar }: { post: Post; onFechar: () => void }) {
  const { update, remove } = useTable<Post>("posts");
  const [titulo, setTitulo] = useState(post.titulo);
  const [slug, setSlug] = useState(post.slug);
  const [resumo, setResumo] = useState(post.resumo ?? "");
  const [conteudo, setConteudo] = useState(post.conteudo);
  const [fonteUrl, setFonteUrl] = useState(post.fonte_url ?? "");
  const [autor, setAutor] = useState(post.autor ?? AUTOR_PADRAO);
  const [preview, setPreview] = useState(false);
  const [salvo, setSalvo] = useState<string | null>(null);

  async function salvar(publicar?: boolean) {
    const status: Post["status"] = publicar === undefined ? post.status : publicar ? "publicado" : "rascunho";
    const patch: Partial<Post> = {
      titulo: titulo.trim(),
      slug: slug.trim() || gerarSlug(titulo),
      resumo: resumo.trim(),
      conteudo,
      fonte_url: fonteUrl.trim() || undefined,
      autor: autor.trim() || undefined,
      status,
    };
    if (status === "publicado" && !post.publicado_em) patch.publicado_em = new Date().toISOString();
    await update(post.id, patch);
    setSalvo(publicar === true ? "Publicado!" : publicar === false ? "Voltou para rascunho." : "Salvo.");
    setTimeout(() => setSalvo(null), 2500);
  }

  async function excluir() {
    if (!confirm("Excluir este post definitivamente?")) return;
    await remove(post.id);
    onFechar();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onFechar} className="text-sm font-semibold text-brand-600 hover:text-brand-700">← Voltar</button>
        <button onClick={excluir} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700">
          <Trash2 size={15} /> Excluir
        </button>
      </div>

      <Card className="space-y-4 p-4">
        <Field rotulo="Título" obrigatorio>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={() => !post.slug || slug === post.slug ? setSlug(gerarSlug(titulo)) : null} />
        </Field>
        <Field rotulo="Endereço (slug)">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        <Field rotulo="Resumo (aparece na listagem e no Google)">
          <Textarea rows={2} value={resumo} onChange={(e) => setResumo(e.target.value)} />
        </Field>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Texto (Markdown: ## título, **negrito**, - lista, [link](url))</span>
            <button onClick={() => setPreview((v) => !v)} className="text-xs font-semibold text-brand-600">
              {preview ? "Editar" : "Pré-visualizar"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[200px] rounded-lg border border-slate-200 bg-white p-4">
              <div className="prose-blog" dangerouslySetInnerHTML={{ __html: markdownParaHtml(conteudo) }} />
            </div>
          ) : (
            <Textarea rows={14} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field rotulo="Autor">
            <Input value={autor} onChange={(e) => setAutor(e.target.value)} />
          </Field>
          <Field rotulo="Link da fonte oficial (opcional)">
            <Input value={fonteUrl} onChange={(e) => setFonteUrl(e.target.value)} placeholder="https://…" />
          </Field>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BotaoPrimario onClick={() => salvar()}>Salvar</BotaoPrimario>
        {post.status === "publicado" ? (
          <button onClick={() => salvar(false)} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Despublicar
          </button>
        ) : (
          <button onClick={() => salvar(true)} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Publicar
          </button>
        )}
        {salvo && <span className="text-sm font-semibold text-emerald-600">{salvo}</span>}
      </div>
    </div>
  );
}
