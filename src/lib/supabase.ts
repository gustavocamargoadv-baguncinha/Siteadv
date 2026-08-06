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

// -------------------------------- Papéis ----------------------------------
// Quem entra pode ser da equipe (advogado) ou um cliente vendo só o próprio
// caso. Quem manda é a RLS no banco (migration 0003) — o papel aqui serve para
// levar a pessoa à tela certa, não para proteger dado.

export interface Perfil {
  papel: "advogado" | "cliente";
  cliente_id: string | null;
}

/** Descobre o papel de quem está logado.
 *
 *  Quando não dá para saber (tabela `perfis` ainda não criada — migration 0003
 *  não rodada — ou nenhuma linha para este usuário), assume ADVOGADO. Duas
 *  razões:
 *   • sem isso, rodar o app antes da migration deixaria o Dr. Gustavo preso na
 *     tela de carregamento, trancado fora do próprio sistema;
 *   • assumir advogado aqui não abre brecha: quem entrega dado é a RLS, e um
 *     usuário sem perfil não satisfaz `eh_advogado()` nem `meu_cliente_id()`,
 *     então o banco não devolve nada — ele veria o app vazio, nunca dado alheio.
 *  O portal do cliente só aparece com uma afirmação explícita de papel. */
export async function getPerfil(): Promise<Perfil> {
  const padrao: Perfil = { papel: "advogado", cliente_id: null };
  if (!supabaseConfigurado) return padrao;
  try {
    const { data, error } = await getSupabase().from("perfis").select("papel, cliente_id").maybeSingle();
    if (error || !data) return padrao;
    return { papel: data.papel === "cliente" ? "cliente" : "advogado", cliente_id: data.cliente_id ?? null };
  } catch {
    return padrao;
  }
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "E-mail ainda não confirmado.";
  return msg;
}
