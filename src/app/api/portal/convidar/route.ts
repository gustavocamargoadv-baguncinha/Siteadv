import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cria o acesso de um cliente ao portal: convida por e-mail e registra o perfil
// ligando aquele login à ficha do cliente.
//
// Roda no servidor porque criar usuário exige a chave de serviço (que ignora a
// RLS) — ela nunca pode ir para o navegador.
//
// Quem chama precisa estar logado como ADVOGADO: o token do usuário vem no
// cabeçalho e é conferido antes de qualquer coisa. Sem essa checagem, a rota
// seria um criador de acessos aberto na internet.

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    return NextResponse.json({ erro: "Supabase não configurado no servidor." }, { status: 501 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "").trim();
  if (!token) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }

  // 1) confere quem está pedindo, usando o token da própria pessoa
  const comoUsuario = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: perfil, error: erroPerfil } = await comoUsuario
    .from("perfis")
    .select("papel")
    .maybeSingle();
  if (erroPerfil || perfil?.papel !== "advogado") {
    return NextResponse.json({ erro: "apenas o escritório pode liberar acesso" }, { status: 403 });
  }

  const { cliente_id, email, nome } = (await req.json()) as {
    cliente_id?: string;
    email?: string;
    nome?: string;
  };
  if (!cliente_id || !email) {
    return NextResponse.json({ erro: "informe cliente_id e email" }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 2) convida (ou reaproveita quem já tem login com esse e-mail)
  let userId: string | null = null;
  const { data: convite, error: erroConvite } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome: nome ?? "" },
  });
  if (convite?.user) {
    userId = convite.user.id;
  } else if (erroConvite && /already|registrado|exists/i.test(erroConvite.message)) {
    const { data: lista } = await admin.auth.admin.listUsers();
    userId = lista?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    if (!userId) {
      return NextResponse.json({ erro: "e-mail já em uso e não foi possível localizá-lo" }, { status: 409 });
    }
  } else {
    return NextResponse.json({ erro: erroConvite?.message ?? "falha ao convidar" }, { status: 500 });
  }

  // 3) amarra o login à ficha do cliente — é isso que a RLS lê
  const { error: erroPerfilNovo } = await admin
    .from("perfis")
    .upsert({ user_id: userId, papel: "cliente", cliente_id }, { onConflict: "user_id" });
  if (erroPerfilNovo) {
    return NextResponse.json({ erro: erroPerfilNovo.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, convidado: email });
}
