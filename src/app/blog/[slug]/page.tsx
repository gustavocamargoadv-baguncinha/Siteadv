"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Post } from "@/lib/types";
import { BlogShell, EspacoAnuncio } from "@/components/BlogShell";
import { markdownParaHtml } from "@/lib/blog";
import { dataHoraBR } from "@/lib/format";

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { rows, loading } = useTable<Post>("posts");
  const post = rows.find((p) => p.slug === slug && p.status === "publicado");

  return (
    <BlogShell>
      <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft size={16} /> Voltar
      </Link>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : !post ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Publicação não encontrada.
        </div>
      ) : (
        <article>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{post.titulo}</h1>
          {post.publicado_em && (
            <p className="mt-2 text-xs text-slate-400">
              {dataHoraBR(post.publicado_em)}
              {post.autor ? ` · ${post.autor}` : ""}
            </p>
          )}

          <EspacoAnuncio />

          <div
            className="prose-blog"
            dangerouslySetInnerHTML={{ __html: markdownParaHtml(post.conteudo) }}
          />

          {post.fonte_url && (
            <a
              href={post.fonte_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={15} /> Ver a fonte oficial
            </a>
          )}

          <EspacoAnuncio />
        </article>
      )}
    </BlogShell>
  );
}
