import { CustodiaLanding, buildMetadata } from "./custodia/CustodiaLanding";

// Raiz do site — este projeto (Vercel: defesa-em-custodia) é dedicado à
// landing page de captação, então a página inicial é a própria landing de
// audiência de custódia. A rota /custodia continua funcionando com o mesmo
// conteúdo.
export const metadata = buildMetadata("/");

export default function Page() {
  return <CustodiaLanding />;
}
