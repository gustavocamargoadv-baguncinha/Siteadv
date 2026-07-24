// Leitura dos posts do blog no SERVIDOR, para renderizar a parte pública já
// com o HTML pronto (bom para SEO e para os robôs do Google/AdSense).
//
// Em produção lê do Supabase via API REST com a chave pública (anon) — a RLS
// libera apenas os posts publicados. Sem Supabase configurado, cai nos dados
// de exemplo (DEMO_SEED), para o blog nunca ficar em branco.
//
// As respostas usam revalidação incremental (ISR): a página é servida do cache
// e atualizada a cada poucos minutos, então um post novo aparece sozinho, sem
// precisar de novo deploy.

import type { Post } from "./types";
import { DEMO_SEED } from "./demo-seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const usandoSupabase = Boolean(url && anon);

// Janela de revalidação (segundos) do conteúdo do blog.
export const REVALIDAR = 300;

function postsDemo(): Post[] {
  return (DEMO_SEED.posts as unknown as Post[])
    .filter((p) => p.status === "publicado")
    .sort((a, b) => (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""));
}

async function rest(query: string): Promise<Post[]> {
  if (!usandoSupabase) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      headers: { apikey: anon!, Authorization: `Bearer ${anon!}` },
      next: { revalidate: REVALIDAR },
    });
    if (!res.ok) return [];
    return (await res.json()) as Post[];
  } catch {
    return [];
  }
}

/** Todos os posts publicados, do mais recente ao mais antigo. */
export async function listarPostsPublicados(): Promise<Post[]> {
  if (!usandoSupabase) return postsDemo();
  return rest("posts?status=eq.publicado&order=publicado_em.desc&select=*");
}

/** Um post publicado pelo seu slug (ou null se não existir/estiver em rascunho). */
export async function obterPostPublicado(slug: string): Promise<Post | null> {
  if (!usandoSupabase) return postsDemo().find((p) => p.slug === slug) ?? null;
  const rows = await rest(
    `posts?status=eq.publicado&slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
  );
  return rows[0] ?? null;
}

/** Slugs publicados — para pré-gerar as páginas no build. */
export async function listarSlugsPublicados(): Promise<string[]> {
  const posts = await listarPostsPublicados();
  return posts.map((p) => p.slug);
}
