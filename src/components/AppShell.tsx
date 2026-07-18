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
  Home,
  Menu,
  Scale,
  Settings,
  Users,
  UserSquare2,
  Wallet,
  X,
} from "lucide-react";
import { useTable } from "@/lib/hooks";
import type { Prazo } from "@/lib/types";
import { diasAteISO } from "@/lib/format";
import { supabaseConfigurado } from "@/lib/supabase";

const NAV = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/processos", rotulo: "Processos", icone: Briefcase },
  { href: "/agenda", rotulo: "Agenda e Prazos", icone: CalendarDays },
  { href: "/clientes", rotulo: "Clientes", icone: Users },
  { href: "/financeiro", rotulo: "Financeiro", icone: Wallet },
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
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-slate-950">
        <Scale size={20} />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-white">Camargo</p>
        <p className="text-[11px] leading-tight text-slate-400">Advocacia Criminal</p>
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
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pr-3">
              <Logo />
              <button onClick={() => setDrawer(false)} className="rounded-lg p-2 text-slate-400" aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Barra superior */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:pl-64">
        <button onClick={() => setDrawer(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <Scale size={18} className="text-brand-600" />
          <span className="text-sm font-bold text-slate-900">Camargo Adv</span>
        </div>
        <div className="ml-auto">
          <Link href="/agenda" className="relative inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Prazos urgentes">
            <Bell size={20} />
            {urgentes > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {urgentes}
              </span>
            )}
          </Link>
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
