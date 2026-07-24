"use client";

import Link from "next/link";
import { useTable } from "@/lib/hooks";
import type { Post } from "@/lib/types";
import { BlogShell, EspacoAnuncio } from "@/components/BlogShell";
import { dataHoraBR } from "@/lib/format";

export default function BlogHome() {
  const { rows, loading } = useTable<Post>("posts");
  const publicados = rows
    .filter((p) => p.status === "publicado")
    .sort((a, b) => (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""));

  return (
    <BlogShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Últimas do direito penal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Julgados do STF e do STJ e projetos de lei em Brasília, explicados sem juridiquês.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : publicados.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Ainda não há publicações. Volte em breve.
        </p>
      ) : (
        <div className="space-y-8">
          {publicados.map((post, i) => (
            <div key={post.id}>
              <article className="group">
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700">
                    {post.titulo}
                  </h2>
                </Link>
                {post.publicado_em && (
                  <p className="mt-1 text-xs text-slate-400">
                    {dataHoraBR(post.publicado_em)}
                    {post.autor ? ` · ${post.autor}` : ""}
                  </p>
                )}
                {post.resumo && <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.resumo}</p>}
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Ler mais →
                </Link>
              </article>
              {/* um anúncio a cada 3 posts */}
              {i % 3 === 2 && <EspacoAnuncio />}
            </div>
          ))}
        </div>
      )}
    </BlogShell>
  );
}
