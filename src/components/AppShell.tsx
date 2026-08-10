"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  FolderOpen,
  HandCoins,
  Home,
  LogOut,
  Menu,
  MoonStar,
  Settings,
  TrendingUp,
  Users,
  UserSquare2,
  Wallet,
  X,
} from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Prazo } from "@/lib/types";
import { diasAteISO } from "@/lib/format";
import { sair, supabaseConfigurado } from "@/lib/supabase";

const NAV = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/fechar-dia", rotulo: "Fechar o dia", icone: MoonStar },
  { href: "/processos", rotulo: "Processos", icone: Briefcase },
  { href: "/agenda", rotulo: "Agenda e Prazos", icone: CalendarDays },
  { href: "/clientes", rotulo: "Clientes", icone: Users },
  { href: "/financeiro", rotulo: "Financeiro", icone: Wallet },
  { href: "/desempenho", rotulo: "Desempenho", icone: TrendingUp },
  { href: "/cobranca", rotulo: "Cobrança", icone: HandCoins },
  { href: "/documentos", rotulo: "Documentos", icone: FolderOpen },
  { href: "/equipe", rotulo: "Equipe", icone: UserSquare2 },
  { href: "/portal", rotulo: "Portal do Cliente", icone: FileText },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

const NAV_MOBILE = NAV.slice(0, 5);

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const { rows: prazos } = useTable<Prazo>("prazos");
  const urgentes = prazos.filter((p) => p.status === "pendente" && diasAteISO(p.data_limite) <= 7).length;

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, rotulo, icone: Icone }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            ativo(pathname, href)
              ? "bg-brand-600/20 text-brand-300"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icone size={18} />
          {rotulo}
        </Link>
      ))}
    </nav>
  );

  const Logo = () => (
    <div className="px-4 py-5">
      {/* logo em cartão claro (o menu é escuro; as letras marinho precisam de fundo claro) */}
      <div className="rounded-xl bg-white px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-camargo.png" alt="Gustavo Camargo Advocacia" className="mx-auto w-full max-w-[168px]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-950 md:flex">
        <Logo />
        <NavLinks />
        <div className="px-5 py-4 text-[11px] text-slate-500">
          {supabaseConfigurado ? "Conectado ao Supabase" : "Modo demonstração (dados locais)"}
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pr-2">
              <Logo />
              <button
                onClick={() => setDrawer(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Barra superior.
          O app roda como PWA com status bar translúcida (`black-translucent` +
          `viewportFit: cover`): o relógio e a bateria do iPhone desenham POR CIMA
          da página. Sem reservar a `safe-area-inset-top`, eles caíam em cima do
          botão do menu — daí a impressão de que o canto não clicava.
          O branco sobe atrás da status bar e a barra de verdade fica abaixo dela. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] md:pl-64">
        <div className="flex h-14 items-center gap-1 px-2 sm:px-4">
          {/* 44×44: alvo de toque mínimo confortável no celular. O ícone fica
              opticamente na mesma posição de antes; o que cresce é a área. */}
          <button
            onClick={() => setDrawer(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex min-w-0 items-center md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-camargo.png" alt="Gustavo Camargo Advocacia" className="h-7 w-auto" />
          </div>
          <div className="ml-auto flex items-center">
            <Link
              href="/agenda"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
              aria-label="Prazos urgentes"
            >
              <Bell size={20} />
              {urgentes > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4.5 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {urgentes}
                </span>
              )}
            </Link>
            {supabaseConfigurado && (
              <button
                onClick={() => sair()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-4 pb-24 pt-5 md:pb-8 md:pl-64">
        <div className="mx-auto max-w-6xl md:px-4">{children}</div>
      </main>

      {/* Navegação inferior mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_MOBILE.map(({ href, rotulo, icone: Icone }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              ativo(pathname, href) ? "text-brand-600" : "text-slate-500"
            }`}
          >
            <Icone size={20} />
            {rotulo.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
