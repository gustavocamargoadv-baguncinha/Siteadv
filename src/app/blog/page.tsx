import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell, EspacoAnuncio } from "@/components/BlogShell";
import { listarPostsPublicados } from "@/lib/posts-server";
import { dataHoraBR } from "@/lib/format";
import { baseUrl } from "@/lib/site";

export const revalidate = 300;

const TITULO = "Radar Penal — notícias e julgados de direito penal";
const DESCRICAO =
  "Julgados do STF e do STJ e projetos de lei penais em Brasília, explicados sem juridiquês. Por Gustavo Roberto de Camargo (OAB/SP 431.515).";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: `${baseUrl()}/blog`,
    siteName: "Radar Penal",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO },
};

export default async function BlogHome() {
  const posts = await listarPostsPublicados();

  return (
    <BlogShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Últimas do direito penal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Julgados do STF e do STJ e projetos de lei em Brasília, explicados sem juridiquês.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Ainda não há publicações. Volte em breve.
        </p>
      ) : (
        <div className="space-y-8">
          {posts.map((post, i) => (
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
              {i % 3 === 2 && <EspacoAnuncio />}
            </div>
          ))}
        </div>
      )}
    </BlogShell>
  );
}
