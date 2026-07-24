import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/site";

// Regras para os robôs: liberam o blog e mantêm as áreas internas do sistema
// (gestão do escritório) fora dos buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/blog",
      disallow: [
        "/processos",
        "/clientes",
        "/financeiro",
        "/agenda",
        "/documentos",
        "/equipe",
        "/portal",
        "/configuracoes",
        "/redacao",
        "/api/",
      ],
    },
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
