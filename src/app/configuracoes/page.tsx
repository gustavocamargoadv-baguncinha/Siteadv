"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarPlus, CheckCircle2, CircleAlert, Copy, Database, FileSignature, FileSpreadsheet, RefreshCw, Radar, Smartphone, Trash2 } from "lucide-react";
import { supabaseConfigurado } from "@/lib/supabase";
import {
  atualizarMovimentacoesDataJud,
  gerarParcelasVincendas,
  importarAudienciasEsaj,
  importarCasosWhatsapp,
  importarContratosZapsign,
  importarDados2026,
  resetarDadosDemo,
  type ResultadoAudiencias,
  type ResultadoCasos,
  type ResultadoContratos,
  type ResultadoDataJud,
  type ResultadoImportacao,
  type ResultadoVincendas,
} from "@/lib/store";
import { CASOS_WHATSAPP } from "@/lib/import-casos";
import { CLIENTES_2026, LANCAMENTOS_2026 } from "@/lib/import-2026";
import { CONTRATOS_ZAPSIGN } from "@/lib/import-contratos";
import { AUDIENCIAS_ESAJ } from "@/lib/import-audiencias";
import { brl } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";

function Item({ ok, titulo, children }: { ok: boolean; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      {ok ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <CircleAlert size={20} className="mt-0.5 shrink-0 text-amber-500" />
      )}
      <div>
        <p className="text-sm font-semibold text-slate-900">{titulo}</p>
        <div className="mt-0.5 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}

function ImportarPlanilha() {
  const totalReceitas = LANCAMENTOS_2026.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor ?? 0), 0);
  const [limpar, setLimpar] = useState(true);
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  async function importar() {
    const msg = limpar
      ? "Isto vai APAGAR os dados de exemplo atuais e importar os dados reais da sua planilha 2026. Continuar?"
      : "Importar os dados da planilha 2026 junto com os dados atuais?";
    if (!confirm(msg)) return;
    setRodando(true);
    try {
      const r = await importarDados2026(limpar);
      setResultado(r);
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <FileSpreadsheet size={16} /> Migrar da planilha (controle 2026)
      </h2>
      <p className="text-sm text-slate-600">
        Traz para o Financeiro os <b>{LANCAMENTOS_2026.length} recebimentos</b> de janeiro a junho de 2026
        ({brl(totalReceitas)}) e cadastra os <b>{CLIENTES_2026.length} clientes</b> correspondentes. Os
        lançamentos entram já marcados como recebidos (Pix), na data de cada pagamento.
      </p>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={limpar} onChange={(e) => setLimpar(e.target.checked)} className="h-4 w-4 accent-brand-600" />
        Apagar os dados de exemplo antes de importar (recomendado na primeira vez)
      </label>
      <div>
        <button
          onClick={importar}
          disabled={rodando}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {rodando ? "Importando…" : "Importar dados da planilha 2026"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ Importação concluída: {resultado.clientesNovos} clientes e {resultado.lancamentosNovos} lançamentos adicionados.
          {resultado.jaImportados > 0 && ` (${resultado.jaImportados} clientes já existiam e foram mantidos.)`}
          <br />
          <a href="/financeiro" className="font-semibold underline">Ver no Financeiro →</a>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Observações da planilha: alguns nomes vêm truncados do extrato do banco (ex.: “ANA CAROLINE D”) — dá para
        renomear em cada cliente. Um depósito em espécie de R$ 5.200 entrou sem cliente vinculado, para você confirmar a origem.
      </p>
    </Card>
  );
}

function ImportarContratos() {
  const totalContratado = CONTRATOS_ZAPSIGN.reduce((s, c) => s + c.valor, 0);
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoContratos | null>(null);

  async function importar() {
    if (!confirm("Importar os 25 contratos do ZapSign? Isso cadastra/atualiza clientes, cria os processos e registra os contratos de honorários.")) return;
    setRodando(true);
    try {
      setResultado(await importarContratosZapsign());
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <FileSignature size={16} /> Importar contratos (ZapSign)
      </h2>
      <p className="text-sm text-slate-600">
        Traz os <b>{CONTRATOS_ZAPSIGN.length} contratos</b> assinados ({brl(totalContratado)} contratados). Para cada um: o
        contratante vira cliente (com CPF, RG, endereço e contato do contrato), o defendido e os autos viram um processo, e
        o valor entra como contrato de honorários — <b>com o saldo em aberto</b> calculado sobre o que já foi pago. Nenhum
        pagamento é recriado.
      </p>
      <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
        Importe <b>depois</b> dos dados da planilha 2026, para os nomes truncados serem completados em vez de duplicados.
      </p>
      <div>
        <button
          onClick={importar}
          disabled={rodando}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {rodando ? "Importando…" : "Importar contratos do ZapSign"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ {resultado.clientesEnriquecidos} clientes completados, {resultado.clientesNovos} novos, {resultado.processosNovos} processos e{" "}
          {resultado.contratosNovos} contratos registrados. <a href="/processos" className="font-semibold underline">Ver processos →</a>
        </div>
      )}
    </Card>
  );
}

function ImportarCasos() {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCasos | null>(null);

  async function importar() {
    if (!confirm("Importar os casos das conversas? Complementa clientes que já existem (sem duplicar), cria processos, andamentos, audiências e os pagamentos que faltavam, e remove o João Luiz e o 'Gustavo Rob' (você).")) return;
    setRodando(true);
    try {
      setResultado(await importarCasosWhatsapp());
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Database size={16} /> Importar casos das conversas
      </h2>
      <p className="text-sm text-slate-600">
        Traz os <b>{CASOS_WHATSAPP.length} casos</b> reconstruídos das conversas (Valdeci, Vagner, Kauã, Leonardo, David, Alison, Wagner):
        <b> complementa</b> o cliente que já existe (casando por CPF/nome, <b>sem duplicar</b>), cria o processo, os andamentos, as
        audiências/vídeos e os pagamentos que faltavam. Também <b>remove</b> os não-clientes (João Luiz de O e "Gustavo Rob").
      </p>
      <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
        Pode rodar mais de uma vez sem duplicar. Alguns comprovantes vinham só como foto (sem valor escrito) — esses <b>não</b>
        foram lançados; confira Roselina e Wagner e lance manualmente se faltar.
      </p>
      <div>
        <button
          onClick={importar}
          disabled={rodando}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {rodando ? "Importando…" : "Importar casos das conversas"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ {resultado.clientesComplementados} clientes complementados, {resultado.clientesNovos} novos, {resultado.processosNovos} processos,{" "}
          {resultado.andamentosNovos} andamentos, {resultado.eventosNovos} audiências e {resultado.pagamentosNovos} pagamentos.{" "}
          {resultado.removidos} não-clientes removidos. <a href="/processos" className="font-semibold underline">Ver processos →</a>
        </div>
      )}
    </Card>
  );
}

function ImportarAudiencias() {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAudiencias | null>(null);

  async function importar() {
    setRodando(true);
    try {
      setResultado(await importarAudienciasEsaj());
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <CalendarClock size={16} /> Importar audiências (e-SAJ)
      </h2>
      <p className="text-sm text-slate-600">
        Lança na agenda as <b>{AUDIENCIAS_ESAJ.length} audiências</b> do painel do e-SAJ (TJSP). As que já têm processo
        cadastrado (dos contratos) são vinculadas automaticamente ao processo e ao cliente.
      </p>
      <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
        Importe <b>depois</b> dos contratos, para o vínculo com os processos acontecer.
      </p>
      <div>
        <button
          onClick={importar}
          disabled={rodando}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {rodando ? "Importando…" : "Importar audiências do e-SAJ"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ {resultado.novas} audiências na agenda ({resultado.vinculadas} vinculadas a processos).{" "}
          <a href="/agenda" className="font-semibold underline">Ver agenda →</a>
        </div>
      )}
    </Card>
  );
}

function AtualizarDataJud() {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDataJud | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function atualizar() {
    setRodando(true);
    setErro(null);
    try {
      setResultado(await atualizarMovimentacoesDataJud());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "falha ao consultar o DataJud");
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <RefreshCw size={16} /> Movimentações automáticas (DataJud/CNJ)
      </h2>
      <p className="text-sm text-slate-600">
        Busca as movimentações dos seus processos direto na <b>API oficial e gratuita do CNJ</b> e lança na linha do
        tempo de cada processo. Sem custo e sem cadastro. Rode quando quiser atualizar; no ar (publicado), dá para
        automatizar a checagem diária.
      </p>
      <div>
        <button
          onClick={atualizar}
          disabled={rodando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw size={15} className={rodando ? "animate-spin" : ""} /> {rodando ? "Consultando…" : "Buscar movimentações agora"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ {resultado.processosConsultados} processos consultados, {resultado.andamentosNovos} movimentações novas.
          {resultado.erros > 0 && ` (${resultado.erros} não retornaram — normal para autos sigilosos ou muito recentes.)`}
        </div>
      )}
      {erro && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Não foi possível consultar: {erro}</div>}
    </Card>
  );
}

function GerarVincendas() {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoVincendas | null>(null);

  async function gerar() {
    if (!confirm("Gerar as parcelas a vencer dos contratos no Financeiro? (Pode rodar de novo quando quiser — ele refaz as parcelas futuras.)")) return;
    setRodando(true);
    try {
      setResultado(await gerarParcelasVincendas());
    } finally {
      setRodando(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <CalendarPlus size={16} /> Gerar parcelas a vencer (contratos)
      </h2>
      <p className="text-sm text-slate-600">
        Lê os contratos, desconta o que cada cliente já pagou e lança no Financeiro as <b>parcelas que ainda vão vencer</b>
        {" "}(mensais, a partir do dia da assinatura de cada contrato). Não duplica o que já entrou. Assim você vê os
        recebimentos futuros em <b>A receber</b>.
      </p>
      <div>
        <button
          onClick={gerar}
          disabled={rodando}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {rodando ? "Gerando…" : "Gerar parcelas a vencer"}
        </button>
      </div>
      {resultado && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ {resultado.parcelasGeradas} parcelas futuras lançadas ({resultado.contratos} contratos com saldo).{" "}
          <a href="/financeiro" className="font-semibold underline">Ver no Financeiro →</a>
        </div>
      )}
    </Card>
  );
}

function GoogleAgenda() {
  const [origin, setOrigin] = useState("");
  const [copiado, setCopiado] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const urlModelo = `${origin || "https://seu-site.vercel.app"}/api/calendar/feed?token=SEU_TOKEN`;

  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <CalendarCheck size={16} /> Google Agenda (audiências no celular)
      </h2>
      <p className="text-sm text-slate-600">
        Suas audiências e compromissos podem aparecer no seu <b>Google Agenda</b> (com alarme), atualizando sozinhos.
        Você assina o link abaixo <b>uma vez</b> — sem instalar nada.
      </p>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
        <li>
          Na <b>Vercel</b> → Settings → Environment Variables, crie <span className="font-mono text-xs">CALENDAR_FEED_TOKEN</span> com
          uma senha longa que você inventar (ex.: <span className="font-mono text-xs">camargo-2026-x9f2</span>) e faça <b>Redeploy</b>.
        </li>
        <li>
          Monte seu link trocando <span className="font-mono text-xs">SEU_TOKEN</span> pela senha que criou:
          <div className="mt-1 flex items-center gap-2">
            <code className="block flex-1 overflow-x-auto rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100">{urlModelo}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(urlModelo);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1500);
              }}
              className="shrink-0 rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
              title="Copiar"
            >
              <Copy size={15} />
            </button>
          </div>
          {copiado && <span className="text-xs text-emerald-700">copiado!</span>}
        </li>
        <li>
          No computador, abra o <b>Google Agenda</b> → menu <b>Outras agendas</b> (＋) → <b>De URL</b> → cole o link → <b>Adicionar agenda</b>.
        </li>
        <li>Pronto! No celular, ative essa agenda no app do Google Agenda. As audiências aparecem com alarme 2h antes.</li>
      </ol>
      <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
        O Google atualiza o feed de tempos em tempos (pode levar algumas horas para uma audiência nova aparecer). O link é
        secreto — só compartilhe com você mesmo.
      </p>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader titulo="Configurações" sub="Estado do sistema e integrações" />

      <div className="space-y-4">
        <GoogleAgenda />
        <ImportarPlanilha />
        <ImportarContratos />
        <ImportarCasos />
        <GerarVincendas />
        <ImportarAudiencias />
        <AtualizarDataJud />

        <Card className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Database size={16} /> Backend (Supabase)</h2>
          <Item ok={supabaseConfigurado} titulo={supabaseConfigurado ? "Conectado ao Supabase" : "Modo demonstração (dados locais)"}>
            {supabaseConfigurado ? (
              "Os dados são gravados no banco na nuvem, com login por usuário e acesso de qualquer dispositivo."
            ) : (
              <>
                Os dados ficam salvos apenas neste navegador. Para ativar o modo multiusuário na nuvem:
                <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs">
                  <li>Crie um projeto gratuito em <span className="font-mono">supabase.com</span>;</li>
                  <li>Execute o script <span className="font-mono">supabase/migrations/0001_schema.sql</span> no SQL Editor;</li>
                  <li>Crie o bucket <span className="font-mono">documentos</span> no Storage;</li>
                  <li>Defina <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> e <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> nas variáveis de ambiente (veja <span className="font-mono">.env.example</span>).</li>
                </ol>
              </>
            )}
          </Item>
        </Card>

        <Card className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Radar size={16} /> Monitoramento de tribunais</h2>
          <Item ok={false} titulo="Integração com provedor de andamentos">
            O botão &quot;Monitorar no tribunal&quot; em cada processo registra o interesse; para captura automática de
            movimentações, contrate um provedor (Escavador, Judit.io ou similar), defina{" "}
            <span className="font-mono">TRIBUNAL_API_PROVIDER</span> e <span className="font-mono">TRIBUNAL_API_KEY</span> no
            servidor e aponte o webhook do provedor para <span className="font-mono">/api/webhooks/tribunal</span>. As novas
            movimentações entram sozinhas na linha do tempo de cada processo.
          </Item>
        </Card>

        <Card className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Smartphone size={16} /> App no celular (PWA)</h2>
          <Item ok titulo="Instalável no iPhone e Android">
            Abra o site no navegador do celular e use <strong>“Adicionar à Tela de Início”</strong> (iPhone: botão de
            compartilhar no Safari; Android: menu ⋮ do Chrome). O sistema abre em tela cheia, com ícone próprio, como um
            aplicativo.
          </Item>
        </Card>

        {!supabaseConfigurado && (
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Trash2 size={16} /> Dados de demonstração</h2>
            <p className="mb-3 text-sm text-slate-600">
              Apaga tudo que está salvo neste navegador e restaura os dados de exemplo.
            </p>
            <button
              onClick={() => {
                if (confirm("Apagar os dados locais e restaurar os exemplos?")) resetarDadosDemo();
              }}
              className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Restaurar dados de exemplo
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
