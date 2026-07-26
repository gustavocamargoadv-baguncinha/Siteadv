import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Este projeto (Vercel: defesa-em-custodia) é dedicado à landing page. Só a
// página inicial e /custodia devem ficar acessíveis. Qualquer outra rota
// (telas do sistema de gestão, APIs) é redirecionada para a raiz, para não
// expor nada além da landing no domínio da campanha.
const ROTAS_LIBERADAS = new Set(["/", "/custodia"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ROTAS_LIBERADAS.has(pathname)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Roda em todas as rotas de navegação, exceto os internos do Next
  // (_next), o favicon e qualquer arquivo com extensão (imagens, logo,
  // ícones, manifest, service worker), que devem continuar servindo normal.
  matcher: ["/((?!_next/|favicon.ico|.*\\..*).*)"],
};
