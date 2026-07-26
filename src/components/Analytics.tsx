"use client";

import Script from "next/script";
import { useEffect } from "react";

// Rastreamento de conversões do Google Ads para a landing.
// Fica INERTE até você definir as variáveis na Vercel:
//   NEXT_PUBLIC_GADS_ID            -> ex.: AW-123456789
//   NEXT_PUBLIC_GADS_WHATSAPP_LABEL-> o "rótulo" da conversão de WhatsApp
//   NEXT_PUBLIC_GADS_CALL_LABEL    -> (opcional) rótulo da conversão de ligação
// Sem NEXT_PUBLIC_GADS_ID definido, nada é carregado (não afeta o site).
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;
const WHATS_LABEL = process.env.NEXT_PUBLIC_GADS_WHATSAPP_LABEL;
const CALL_LABEL = process.env.NEXT_PUBLIC_GADS_CALL_LABEL;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export function Analytics() {
  useEffect(() => {
    if (!GADS_ID) return;

    function onClick(e: MouseEvent) {
      const alvo = e.target as HTMLElement | null;
      const link = alvo?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!window.gtag) return;

      if (href.includes("wa.me") && WHATS_LABEL) {
        window.gtag("event", "conversion", { send_to: `${GADS_ID}/${WHATS_LABEL}` });
      } else if (href.startsWith("tel:") && CALL_LABEL) {
        window.gtag("event", "conversion", { send_to: `${GADS_ID}/${CALL_LABEL}` });
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!GADS_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GADS_ID}');
        `}
      </Script>
    </>
  );
}
