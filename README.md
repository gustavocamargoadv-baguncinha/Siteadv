# Camargo Advocacia — Sistema de Gestão

Sistema completo de gestão para o escritório, feito para funcionar no computador **e no celular** (PWA instalável).

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Visão geral: prazos urgentes, compromissos, movimentações e recebíveis |
| **Processos** | Cadastro de casos, linha do tempo de andamentos, prazos e financeiro por caso |
| **Agenda e Prazos** | Prazos fatais com alerta de urgência, audiências, reuniões e atendimentos |
| **Clientes** | CRM: contatos, processos, contratos de honorários e situação financeira |
| **Financeiro** | Honorários, parcelas, despesas, inadimplência e resumo do mês |
| **Documentos** | Arquivos por cliente/processo, com controle do que o cliente pode ver |
| **Equipe** | Membros, papéis (admin, advogado, estagiário, secretaria) e carga de trabalho |
| **Portal do Cliente** | O que cada cliente enxerga ao acessar com o próprio login |
| **Tribunais** | Monitoramento automático de movimentações via Escavador ou Judit (opcional) |
| **Blog / Redação** | Blog jurídico público (`/blog`) + caixa de pautas alimentada por monitoramento de STF, STJ, Câmara e Senado (assuntos penais) |

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. **Sem nenhuma configuração o sistema já funciona em modo demonstração**: os dados ficam salvos no navegador (localStorage) e vêm pré-carregados com exemplos realistas para você explorar.

## Instalar como app no celular

1. Publique o site (Vercel é o caminho mais simples: `vercel deploy`, plano gratuito) ou acesse o endereço local pela rede;
2. No celular, abra o endereço no navegador;
3. **iPhone (Safari):** botão compartilhar → *Adicionar à Tela de Início*;
4. **Android (Chrome):** menu ⋮ → *Instalar aplicativo*.

O sistema abre em tela cheia, com ícone próprio, como um aplicativo de verdade.

## Ativar o modo multiusuário (Supabase)

O modo demo é local a um navegador. Para equipe + celular + escritório compartilhando os mesmos dados:

1. Crie um projeto gratuito em [supabase.com](https://supabase.com);
2. No **SQL Editor**, execute `supabase/migrations/0001_schema.sql` (cria tabelas, papéis e regras de segurança, incluindo o recorte do portal do cliente);
3. Em **Storage**, crie o bucket privado `documentos`;
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API);
5. Em **Authentication**, convide os membros da equipe por e-mail e vincule cada um na tabela `membros` (coluna `auth_user_id`).

Com as variáveis presentes, o app troca automaticamente do armazenamento local para o Supabase.

### Portal do cliente

Para dar acesso a um cliente: convide-o em Authentication e preencha `clientes.portal_user_id` com o id do usuário criado. As regras de segurança no banco (RLS) garantem que ele só enxerga os próprios processos, andamentos, compromissos e os documentos marcados como *visível ao cliente*.

## Monitoramento automático de tribunais

Integração pronta para **Escavador** e **Judit.io** (serviços pagos):

1. Contrate o provedor e defina no servidor: `TRIBUNAL_API_PROVIDER` (`escavador` ou `judit`), `TRIBUNAL_API_KEY` e `TRIBUNAL_WEBHOOK_SECRET`;
2. No provedor, aponte o webhook de movimentações para `https://SEU-DOMINIO/api/webhooks/tribunal` enviando o segredo no cabeçalho `x-webhook-secret`;
3. No sistema, clique em **“Monitorar no tribunal”** dentro do processo.

As novas movimentações entram sozinhas na linha do tempo do processo, marcadas como *via tribunal*.

## Blog jurídico "Radar Penal" e monitoramento de pautas

Parte pública do sistema, em **`/blog`** (a única área aberta a visitantes — o resto continua atrás do login). Pensada como um blog informativo de direito penal, no espírito do ConJur.

**Como o conteúdo chega até a redação:** um monitoramento diário garimpa as fontes oficiais e filtra o que é de interesse penal, montando uma **caixa de pautas** em *Blog / Redação*. Nada é publicado sozinho — o advogado revisa, escreve e publica.

- Fontes: **STF** e **STJ** (feeds de notícias) e **Câmara** e **Senado** (APIs de dados abertos, projetos de lei penais);
- O agendador roda por `vercel.json` (cron diário) chamando `GET /api/pautas/coletar`;
- Proteja o endpoint definindo `CRON_SECRET` (a Vercel envia esse valor no cabeçalho `Authorization`);
- Se os feeds de RSS do STF/STJ mudarem de endereço, ajuste `STF_RSS_URL` / `STJ_RSS_URL` sem reprogramar;
- Cada fonte é independente e tolerante a falha: se uma cair, as outras seguem.

No banco: tabelas `pautas` e `posts` (migração `supabase/migrations/0003_blog.sql`). A RLS libera **leitura pública** só dos posts *publicados*; rascunhos e a caixa de pautas ficam restritos à equipe.

> **Nota ética:** o formato é informativo/jornalístico, compatível com o Provimento 205/2021 da OAB (publicidade da advocacia). O rodapé do blog já traz o aviso de que o conteúdo não constitui aconselhamento jurídico.

## Arquitetura

- **Next.js 15 (App Router) + TypeScript + Tailwind** — interface responsiva (desktop e mobile);
- **PWA** — manifesto + service worker: instala no celular e abre offline;
- **Camada de dados intercambiável** (`src/lib/store.ts`) — mesmo código roda com `localStorage` (demo) ou Supabase (produção); a escolha é automática pela presença das variáveis de ambiente;
- **Supabase** — Postgres com row-level security por papel, autenticação e armazenamento de arquivos;
- **Integração de tribunais** (`src/lib/tribunais.ts`) — abstração de provedor + webhook de ingestão;
- **Monitoramento de pautas** (`src/lib/fontes.ts`) — coletores por fonte (STF/STJ/Câmara/Senado) + filtro penal, expostos em `/api/pautas/coletar`.

## Roadmap sugerido

- [ ] Notificações push de prazo (Web Push) e resumo diário por WhatsApp/e-mail
- [ ] Timesheet com cronômetro (tabela `timesheet` já existe no banco)
- [ ] Geração de peças integrada (modelos do escritório)
- [ ] Relatórios: produtividade por advogado, taxa de êxito, fluxo de caixa projetado
- [ ] Assinatura eletrônica de contratos de honorários
