# Publicar o sistema e ativar a integração com os tribunais

Guia passo a passo, em ordem. São **3 etapas**: (1) banco na nuvem, (2) site no ar,
(3) monitoramento dos tribunais. As duas primeiras são **gratuitas**.

Ao final, o sistema fica acessível de qualquer aparelho (você e a equipe), com os
dados sincronizados, e as audiências/movimentações entram sozinhas.

---

## Etapa 1 — Banco de dados na nuvem (Supabase) · grátis

1. Acesse **https://supabase.com** e crie uma conta (pode entrar com o Google).
2. Clique em **New project**. Dê um nome (ex.: `camargo-adv`), defina uma senha
   forte para o banco e escolha a região **South America (São Paulo)**.
3. Espere ~2 minutos até o projeto ficar pronto.
4. No menu lateral, abra **SQL Editor** → **New query**. Cole e rode, **um de cada vez**:
   - o conteúdo de `supabase/migrations/0001_schema.sql`
   - depois `supabase/migrations/0002_qualificacao_clientes.sql`
   (clique em **Run** em cada um; deve aparecer "Success").
5. No menu **Storage**, clique em **New bucket**, nome **`documentos`**, deixe
   como **Private**, e confirme.
6. No menu **Project Settings → API**, copie e me envie (ou guarde):
   - **Project URL** → vira `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → vira `SUPABASE_SERVICE_ROLE_KEY` (essa é secreta, só no servidor)

---

## Etapa 2 — Site no ar (Vercel) · grátis

1. Acesse **https://vercel.com** e entre com a mesma conta do GitHub onde está este
   repositório.
2. Clique em **Add New… → Project** e selecione o repositório `Siteadv`.
3. Em **Environment Variables**, adicione (copiando da Etapa 1):
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
4. Clique em **Deploy** e aguarde. No fim, você recebe um endereço tipo
   `https://camargo-adv.vercel.app`.
5. Abra esse endereço no computador. Vá em **Configurações** e rode, na ordem:
   **Importar dados da planilha 2026 → Importar contratos do ZapSign → Importar
   audiências do e-SAJ**. Agora tudo está no Supabase (não mais só no navegador).
6. No **celular**, abra o mesmo endereço e use **Adicionar à Tela de Início**
   (iPhone/Safari) ou **Instalar aplicativo** (Android/Chrome).

> A partir daqui o sistema já é multiusuário e sincronizado. As Etapas 1 e 2
> valem mesmo que você nunca contrate a integração paga.

---

## Etapa 3 — Monitoramento automático dos tribunais (Escavador por OAB) · pago

Isto faz os processos novos e as audiências entrarem sozinhos, sem lançamento manual.

1. Crie conta em **https://www.escavador.com** e ative o produto de
   **Monitoramento / API** (confirme com eles o plano por OAB e o preço atual).
2. Pegue seu **token de API** no painel do Escavador.
3. Defina um **segredo** qualquer para o webhook (ex.: invente uma senha longa).
4. Na **Vercel → Settings → Environment Variables**, adicione:
   | Nome | Valor |
   |---|---|
   | `TRIBUNAL_API_PROVIDER` | `escavador` |
   | `TRIBUNAL_API_KEY` | seu token do Escavador |
   | `TRIBUNAL_WEBHOOK_SECRET` | o segredo que você inventou |
   | `TRIBUNAL_OAB` | `431515` |
   | `TRIBUNAL_OAB_UF` | `SP` |
   Depois **Redeploy** o projeto para aplicar.
5. No painel do Escavador, cadastre o **webhook / callback** apontando para:
   `https://SEU-ENDERECO.vercel.app/api/webhooks/tribunal`
   e configure para enviar o cabeçalho `x-webhook-secret` com o mesmo segredo.
6. Acione o monitoramento por OAB uma vez (faço isso com você, ou por uma chamada
   `POST` para `https://SEU-ENDERECO.vercel.app/api/tribunais/monitorar-oab`).

Pronto: cada nova movimentação vira um andamento na linha do tempo do processo, e
cada audiência designada entra na Agenda automaticamente. Processos ainda não
cadastrados aparecem vinculados a um cliente "a vincular", para você associar ao
contratante certo.

> **Sobre o formato:** o Escavador manda os dados no padrão dele; quando você tiver
> o token e um primeiro retorno real, eu ajusto o "tradutor" (`src/lib/tribunais.ts`
> e `src/app/api/webhooks/tribunal/route.ts`) para casar exatamente com os campos
> que eles enviam. A estrutura já está pronta para isso.

---

## Precisa de mim?

Me envie as chaves da Etapa 1 (ou me chame quando estiver nelas) que eu configuro a
Vercel, valido o deploy e testo o webhook de ponta a ponta com você.
