import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Chrome } from "@/components/Chrome";
import { RegisterSW } from "@/components/RegisterSW";
import { baseUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: "Camargo Advocacia — Gestão",
  description: "Sistema de gestão do escritório: processos, prazos, clientes, financeiro, documentos e portal do cliente.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Camargo Adv",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111c34",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <RegisterSW />
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
