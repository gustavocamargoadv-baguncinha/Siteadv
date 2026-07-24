import { CustodiaLanding, buildMetadata } from "./CustodiaLanding";

// Rota /custodia — serve a mesma landing da raiz. O canonical aponta para a
// raiz para concentrar o SEO em um único endereço.
export const metadata = buildMetadata("/");

export default function Page() {
  return <CustodiaLanding />;
}
