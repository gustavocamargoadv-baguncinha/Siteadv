// Resolve o endereço público do site, para gerar URLs absolutas (canonical,
// OpenGraph, sitemap). Ordem de preferência:
//   1. NEXT_PUBLIC_SITE_URL — defina quando tiver domínio próprio;
//   2. domínio de produção da Vercel (injetado automaticamente no build);
//   3. localhost (desenvolvimento).

export function baseUrl(): string {
  const explicito = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicito) return explicito.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
