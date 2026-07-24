import type { MetadataRoute } from "next";
import { listarPostsPublicados } from "@/lib/posts-server";
import { baseUrl } from "@/lib/site";

export const revalidate = 300;

// Mapa do site para os buscadores — só a parte pública (o blog).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const posts = await listarPostsPublicados();

  return [
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.publicado_em ? new Date(p.publicado_em) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
