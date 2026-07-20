import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Webhook chamado pelo provedor de monitoramento (Escavador/Judit) quando um
// processo monitorado recebe nova movimentação OU tem audiência designada.
// Grava andamentos e eventos de agenda no Supabase.
//
// Segurança: defina TRIBUNAL_WEBHOOK_SECRET e configure o provedor para enviar
// o mesmo valor no cabeçalho "x-webhook-secret".
//
// Payload aceito (normalizado — o adaptador do provedor converte para este formato):
// {
//   "numero_cnj": "0000000-00.0000.0.00.0000",
//   "classe": "Ação Penal",            // opcional (usado ao criar processo novo)
//   "comarca": "Itapetininga",          // opcional
//   "movimentacoes": [{ "data": "2026-07-18", "descricao": "..." }],
//   "audiencias":    [{ "data": "2026-08-06", "hora": "15:30", "tipo": "Instrução",
//                       "sala": "Sala Criminal", "situacao": "Designada" }]
// }
//
// Quando o CNJ ainda não existe no sistema (monitoramento por OAB traz processos
// novos), o processo é criado automaticamente e vinculado a um cliente marcador
// "a vincular", para o advogado depois associar ao cliente/contratante correto.

const CLIENTE_MARCADOR = "⚙️ Processos monitorados (a vincular)";

async function obterOuCriarClienteMarcador(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.from("clientes").select("id").eq("nome", CLIENTE_MARCADOR).limit(1);
  if (data && data.length) return data[0].id;
  const { data: novo, error } = await sb
    .from("clientes")
    .insert({ tipo: "pf", nome: CLIENTE_MARCADOR, notas: "Criado pelo monitoramento de tribunais. Vincule ao cliente correto." })
    .select("id")
    .single();
  if (error) throw error;
  return novo.id;
}

async function obterOuCriarProcesso(
  sb: SupabaseClient,
  cnjDigitos: string,
  numeroFormatado: string,
  extras: { classe?: string; comarca?: string }
): Promise<string> {
  const { data: procs } = await sb.from("processos").select("id, numero_cnj");
  const achado = (procs ?? []).find((p) => (p.numero_cnj ?? "").replace(/\D/g, "") === cnjDigitos);
  if (achado) return achado.id;

  const clienteId = await obterOuCriarClienteMarcador(sb);
  const { data: novo, error } = await sb
    .from("processos")
    .insert({
      numero_cnj: numeroFormatado,
      cliente_id: clienteId,
      area: "criminal",
      tribunal: "TJSP",
      comarca: extras.comarca ?? null,
      status: "ativo",
      objeto: `Processo captado pelo monitoramento de tribunais${extras.classe ? ` (${extras.classe})` : ""}. Vincular ao cliente.`,
      monitorado: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return novo.id;
}

interface Movimentacao {
  data?: string;
  descricao?: string;
}
interface Audiencia {
  data?: string;
  hora?: string;
  tipo?: string;
  sala?: string;
  situacao?: string;
}

export async function POST(req: NextRequest) {
  const secret = process.env.TRIBUNAL_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { erro: "Supabase não configurado no servidor (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  const numeroFormatado = typeof body?.numero_cnj === "string" ? body.numero_cnj : "";
  const cnj = numeroFormatado.replace(/\D/g, "");
  const movimentacoes: Movimentacao[] = Array.isArray(body?.movimentacoes) ? body.movimentacoes : [];
  const audiencias: Audiencia[] = Array.isArray(body?.audiencias) ? body.audiencias : [];

  if (!cnj || (movimentacoes.length === 0 && audiencias.length === 0)) {
    return NextResponse.json({ erro: "payload inválido: informe numero_cnj e movimentacoes[] e/ou audiencias[]" }, { status: 400 });
  }

  const sb = createClient(url, serviceKey);

  let processoId: string;
  try {
    processoId = await obterOuCriarProcesso(sb, cnj, numeroFormatado, { classe: body?.classe, comarca: body?.comarca });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : "falha ao resolver processo" }, { status: 500 });
  }

  // 1) andamentos
  let andamentosInseridos = 0;
  if (movimentacoes.length) {
    const linhas = movimentacoes
      .filter((m) => m.descricao)
      .map((m) => ({
        processo_id: processoId,
        data: m.data ?? new Date().toISOString().slice(0, 10),
        descricao: m.descricao!,
        origem: "tribunal" as const,
      }));
    if (linhas.length) {
      const { error } = await sb.from("andamentos").insert(linhas);
      if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
      andamentosInseridos = linhas.length;
    }
  }

  // 2) audiências → eventos de agenda (deduplicadas por processo + início)
  let audienciasInseridas = 0;
  if (audiencias.length) {
    const { data: eventos } = await sb.from("eventos_agenda").select("inicio").eq("processo_id", processoId);
    const existentes = new Set((eventos ?? []).map((e) => (e.inicio ?? "").slice(0, 16)));
    const { data: proc } = await sb.from("processos").select("cliente_id").eq("id", processoId).single();

    const novas = audiencias
      .filter((a) => a.data)
      .map((a) => {
        const inicio = `${a.data}T${(a.hora ?? "00:00").padStart(5, "0")}:00`;
        return {
          inicio,
          registro: {
            tipo: "audiencia" as const,
            titulo: `Audiência${a.tipo ? ` — ${a.tipo}` : ""}`,
            processo_id: processoId,
            cliente_id: proc?.cliente_id ?? null,
            inicio,
            local: a.sala ?? null,
            notas: [a.tipo, a.situacao, `Autos ${numeroFormatado}`, "Fonte: monitoramento"].filter(Boolean).join(" · "),
          },
        };
      })
      .filter((x) => !existentes.has(x.inicio.slice(0, 16)));

    if (novas.length) {
      const { error } = await sb.from("eventos_agenda").insert(novas.map((n) => n.registro));
      if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
      audienciasInseridas = novas.length;
    }
  }

  return NextResponse.json({ ok: true, processo_id: processoId, andamentos: andamentosInseridos, audiencias: audienciasInseridas });
}
