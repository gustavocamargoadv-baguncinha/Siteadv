import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BlogShell, EspacoAnuncio } from "@/components/BlogShell";
import { AutorBio } from "@/components/AutorBio";
import { CompartilharBotao } from "@/components/CompartilharBotao";
import { obterPostPublicado, listarSlugsPublicados } from "@/lib/posts-server";
import { markdownParaHtml } from "@/lib/blog";
import { dataHoraBR } from "@/lib/format";
import { baseUrl } from "@/lib/site";

export const revalidate = 300;

// Pré-gera no build as páginas dos posts já publicados. Posts criados depois
// são renderizados sob demanda e cacheados (ISR).
export async function generateStaticParams() {
  const slugs = await listarSlugsPublicados();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await obterPostPublicado(slug);
  if (!post) return { title: "Publicação não encontrada — Radar Penal" };

  const desc = post.resumo || post.titulo;
  const canonical = `/blog/${post.slug}`;
  return {
    title: `${post.titulo} — Radar Penal`,
    description: desc,
    authors: post.autor ? [{ name: post.autor }] : undefined,
    alternates: { canonical },
    openGraph: {
      title: post.titulo,
      description: desc,
      url: `${baseUrl()}${canonical}`,
      siteName: "Radar Penal",
      locale: "pt_BR",
      type: "article",
      publishedTime: post.publicado_em,
      authors: post.autor ? [post.autor] : undefined,
    },
    twitter: { card: "summary_large_image", title: post.titulo, description: desc },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await obterPostPublicado(slug);
  if (!post) notFound();

  // Dados estruturados (schema.org/NewsArticle) para resultados ricos no Google.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.titulo,
    description: post.resumo || undefined,
    datePublished: post.publicado_em,
    author: post.autor ? { "@type": "Person", name: post.autor } : undefined,
    publisher: { "@type": "Organization", name: "Radar Penal" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl()}/blog/${post.slug}` },
    articleSection: "Direito Penal",
    inLanguage: "pt-BR",
  };

  return (
    <BlogShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <article>
        {/* selo de identidade */}
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Direito Penal</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{post.titulo}</h1>
        {/* filete dourado que dá identidade */}
        <div className="mt-3 h-1 w-16 rounded-full bg-brand-500" />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {post.publicado_em && (
            <p className="text-xs text-slate-400">
              {dataHoraBR(post.publicado_em)}
              {post.autor ? ` · ${post.autor}` : ""}
            </p>
          )}
          <CompartilharBotao titulo={post.titulo} resumo={post.resumo} url={`${baseUrl()}/blog/${post.slug}`} />
        </div>

        <EspacoAnuncio />

        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: markdownParaHtml(post.conteudo) }} />

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {post.fonte_url && (
            <a
              href={post.fonte_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={15} /> Ver a fonte oficial
            </a>
          )}
          <CompartilharBotao
            titulo={post.titulo}
            resumo={post.resumo}
            url={`${baseUrl()}/blog/${post.slug}`}
            rotulo="Compartilhar este artigo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            iconSize={15}
          />
        </div>

        <AutorBio />

        <EspacoAnuncio />
      </article>
    </BlogShell>
  );
}
