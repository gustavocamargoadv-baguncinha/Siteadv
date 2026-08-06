"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Scale } from "lucide-react";
import { entrar, getPerfil, getSessao, onAuthChange, supabaseConfigurado, type Perfil } from "@/lib/supabase";
import { PortalCliente } from "@/components/PortalCliente";

// Protege o sistema com login quando o Supabase está configurado (modo nuvem).
// No modo demonstração (sem Supabase), abre direto — não há dados na nuvem.
//
// Quem entra pode ser da equipe ou um cliente: o cliente vai para o portal e o
// app do escritório nem chega a ser montado para ele. Quem de fato barra o
// acesso ao dado é a RLS (migration 0003) — isto aqui é a porta certa, não a
// fechadura.
export function LoginGate({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCarregando(false);
      return;
    }
    getSessao()
      .then((s) => setSessao(s))
      .catch(() => setSessao(null))
      .finally(() => setCarregando(false));
    return onAuthChange((s) => setSessao(s));
  }, []);

  // o papel só faz sentido com sessão; some ao sair
  useEffect(() => {
    if (!supabaseConfigurado || !sessao) {
      setPerfil(null);
      return;
    }
    let vivo = true;
    getPerfil()
      .then((p) => vivo && setPerfil(p))
      // getPerfil já cai no padrão "advogado" sozinho; este catch é a última
      // rede para nunca deixar alguém preso na tela de carregamento
      .catch(() => vivo && setPerfil({ papel: "advogado", cliente_id: null }));
    return () => {
      vivo = false;
    };
  }, [sessao]);

  // modo demo: sem login
  if (!supabaseConfigurado) return <>{children}</>;

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-400">
        <span className="text-sm">Carregando…</span>
      </div>
    );
  }

  if (!sessao) return <TelaLogin />;

  // ainda buscando o papel: não mostra o app do escritório antes de saber quem
  // é — mostrar e depois trocar exibiria o menu interno a um cliente.
  if (!perfil) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-400">
        <span className="text-sm">Carregando…</span>
      </div>
    );
  }

  if (perfil.papel === "cliente") {
    return <PortalCliente nome={sessao.user.user_metadata?.nome as string | undefined} />;
  }

  return <>{children}</>;
}

function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const r = await entrar(email.trim(), senha);
    if (!r.ok) setErro(r.erro ?? "Não foi possível entrar.");
    setEnviando(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="rounded-xl bg-white px-5 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-camargo.png" alt="Gustavo Camargo Advocacia" className="w-44" />
          </div>
          <p className="text-sm text-slate-400">Acesso restrito ao escritório</p>
        </div>

        <form onSubmit={submeter} className="space-y-3 rounded-2xl bg-white p-5 shadow-xl">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          {erro && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
          <Scale size={12} /> Camargo Advocacia — sistema de gestão
        </p>
      </div>
    </div>
  );
}
