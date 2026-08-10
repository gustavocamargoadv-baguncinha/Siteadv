// Rotas públicas do site — páginas de captação (landing pages) que ficam
// FORA do login e FORA do menu do sistema de gestão. Servem para campanhas
// (Google Ads, busca orgânica) e precisam abrir para qualquer visitante,
// mesmo com o Supabase configurado no modo nuvem.
export const ROTAS_PUBLICAS = ["/", "/custodia", "/criminal"];

export function rotaPublica(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
