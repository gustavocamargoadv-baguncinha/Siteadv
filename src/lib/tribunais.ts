// Integração com provedores de monitoramento processual (server-side).
//
// Provedores suportados via variáveis de ambiente:
//   TRIBUNAL_API_PROVIDER = "escavador" | "judit"
//   TRIBUNAL_API_KEY      = token da API do provedor
//
// Fluxo: registrarMonitoramento() cadastra o número CNJ no provedor; o provedor
// passa a enviar as novas movimentações para /api/webhooks/tribunal, que grava
// os andamentos no Supabase (exige SUPABASE_SERVICE_ROLE_KEY no servidor).

export interface ResultadoMonitoramento {
  simulated: boolean;
  provider?: string;
  provider_id?: string;
  motivo?: string;
}

const PROVIDER = process.env.TRIBUNAL_API_PROVIDER;
const API_KEY = process.env.TRIBUNAL_API_KEY;

export async function registrarMonitoramento(numeroCNJ: string): Promise<ResultadoMonitoramento> {
  if (!PROVIDER || !API_KEY) {
    return { simulated: true, motivo: "TRIBUNAL_API_PROVIDER/TRIBUNAL_API_KEY não configurados" };
  }

  try {
    if (PROVIDER === "escavador") {
      // https://api.escavador.com/docs — monitoramento de processo por número CNJ
      const res = await fetch("https://api.escavador.com/api/v2/monitoramentos/processos", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ numero_cnj: numeroCNJ }),
      });
      if (!res.ok) throw new Error(`Escavador respondeu ${res.status}`);
      const data = await res.json();
      return { simulated: false, provider: "escavador", provider_id: String(data?.id ?? "") };
    }

    if (PROVIDER === "judit") {
      // https://docs.judit.io — tracking de processo por número CNJ
      const res = await fetch("https://tracking.prod.judit.io/tracking", {
        method: "POST",
        headers: { "api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ recurrence: 1, search: { search_type: "lawsuit_cnj", search_key: numeroCNJ } }),
      });
      if (!res.ok) throw new Error(`Judit respondeu ${res.status}`);
      const data = await res.json();
      return { simulated: false, provider: "judit", provider_id: String(data?.tracking_id ?? "") };
    }

    return { simulated: true, motivo: `provedor desconhecido: ${PROVIDER}` };
  } catch (e) {
    return { simulated: true, motivo: e instanceof Error ? e.message : "falha ao contatar o provedor" };
  }
}

// Monitoramento por OAB: acompanha TODOS os processos do advogado de uma vez.
// É a forma recomendada — processos novos e audiências entram sozinhos, sem
// precisar cadastrar CNJ por CNJ. O número da OAB vem de TRIBUNAL_OAB
// (ex.: "431515") e o estado de TRIBUNAL_OAB_UF (ex.: "SP").
export async function registrarMonitoramentoOAB(): Promise<ResultadoMonitoramento> {
  const oab = process.env.TRIBUNAL_OAB;
  const uf = process.env.TRIBUNAL_OAB_UF ?? "SP";
  if (!PROVIDER || !API_KEY) {
    return { simulated: true, motivo: "TRIBUNAL_API_PROVIDER/TRIBUNAL_API_KEY não configurados" };
  }
  if (!oab) {
    return { simulated: true, motivo: "TRIBUNAL_OAB não configurado" };
  }

  try {
    if (PROVIDER === "escavador") {
      // https://api.escavador.com/docs — monitoramento de processos por OAB
      const res = await fetch("https://api.escavador.com/api/v2/monitoramentos/oab", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ numero: oab, estado: uf }),
      });
      if (!res.ok) throw new Error(`Escavador respondeu ${res.status}`);
      const data = await res.json();
      return { simulated: false, provider: "escavador", provider_id: String(data?.id ?? "") };
    }

    if (PROVIDER === "judit") {
      const res = await fetch("https://tracking.prod.judit.io/tracking", {
        method: "POST",
        headers: { "api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ recurrence: 1, search: { search_type: "oab", search_key: `${oab}/${uf}` } }),
      });
      if (!res.ok) throw new Error(`Judit respondeu ${res.status}`);
      const data = await res.json();
      return { simulated: false, provider: "judit", provider_id: String(data?.tracking_id ?? "") };
    }

    return { simulated: true, motivo: `provedor desconhecido: ${PROVIDER}` };
  } catch (e) {
    return { simulated: true, motivo: e instanceof Error ? e.message : "falha ao contatar o provedor" };
  }
}
