"use client";

import { CheckCircle2, CircleAlert, Database, Radar, Smartphone, Trash2 } from "lucide-react";
import { supabaseConfigurado } from "@/lib/supabase";
import { resetarDadosDemo } from "@/lib/store";
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

export default function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader titulo="Configurações" sub="Estado do sistema e integrações" />

      <div className="space-y-4">
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
