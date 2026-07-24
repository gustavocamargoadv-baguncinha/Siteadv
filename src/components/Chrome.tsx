"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LoginGate } from "@/components/LoginGate";

// Decide a "moldura" da página conforme a rota:
//  • /blog…  → área PÚBLICA do site (blog jurídico). Sem login e sem o menu do
//              escritório — é a única parte aberta a visitantes.
//  • demais  → sistema de gestão, protegido por login e dentro do AppShell.
const ROTAS_PUBLICAS = ["/blog"];

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publica = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (publica) return <>{children}</>;

  return (
    <LoginGate>
      <AppShell>{children}</AppShell>
    </LoginGate>
  );
}
