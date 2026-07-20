import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true quando as credenciais do Supabase estão presentes no ambiente. */
export const supabaseConfigurado = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseConfigurado) {
    throw new Error("Supabase não configurado — defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!client) client = createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

// ------------------------------ Autenticação ------------------------------
// Só é usada quando o Supabase está configurado (modo nuvem). No modo demo
// (localStorage), não há login — o app abre direto.

export async function getSessao(): Promise<Session | null> {
  if (!supabaseConfigurado) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabaseConfigurado) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((_evt, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function entrar(email: string, senha: string): Promise<{ ok: boolean; erro?: string }> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, erro: traduzErro(error.message) };
  return { ok: true };
}

export async function sair(): Promise<void> {
  if (supabaseConfigurado) await getSupabase().auth.signOut();
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "E-mail ainda não confirmado.";
  return msg;
}
