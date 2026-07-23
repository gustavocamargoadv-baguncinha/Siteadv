# Publicar a landing page de Audiência de Custódia (Vercel) · grátis

Guia curto e sem "tecniquês". Ao final, a página estará no ar num endereço
que você pode colocar no anúncio do Google e mandar para clientes.

> A página fica no endereço **`SEU-ENDERECO/custodia`** (ex.:
> `camargo-advocacia.vercel.app/custodia`). O anúncio do Google vai apontar
> para esse link.

---

## Passo 1 — Entrar na Vercel

1. Acesse **https://vercel.com**.
2. Clique em **Sign Up** (ou **Log In**) e escolha **Continuar com o GitHub**
   — a mesma conta onde está o repositório `Siteadv`.

## Passo 2 — Importar o projeto

1. No painel, clique em **Add New… → Project**.
2. Na lista, encontre o repositório **`Siteadv`** e clique em **Import**.
3. **Importante (qual versão publicar):** antes de finalizar, abra
   **Settings → Git → Production Branch** e defina como:
   ```
   claude/landing-page-custodia-itapetininga-nxyso4
   ```
   (É a "versão" que contém a landing page. Se pedir para escolher a branch
   já na importação, selecione essa mesma.)
4. Pode deixar todo o resto como está e clicar em **Deploy**.
5. Aguarde ~1 minuto. No fim aparece um endereço tipo
   `https://siteadv.vercel.app`. **Sua página estará em
   `https://siteadv.vercel.app/custodia`.**

> Dica: mesmo antes de definir a branch de produção, a Vercel cria um
> endereço de **pré-visualização** para cada versão enviada — dá para testar
> na hora.

## Passo 3 — Registrar o endereço final (para o Google e o compartilhamento)

Depois que souber o endereço final (o `...vercel.app` ou seu domínio próprio):

1. Na Vercel, vá em **Settings → Environment Variables**.
2. Adicione:
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | o endereço final, ex.: `https://siteadv.vercel.app` |
3. Volte em **Deployments**, abra o mais recente e clique em **Redeploy**.

Isso faz o link ficar bonito quando alguém compartilha a página no WhatsApp
e ajuda o Google a entender o endereço certo.

## Passo 4 (opcional) — Domínio próprio

Se você tiver ou quiser um domínio (ex.: `advocaciacamargo.adv.br`):

1. Vercel → **Settings → Domains → Add** e digite o domínio.
2. A Vercel mostra 1 ou 2 ajustes para fazer no site onde você registrou o
   domínio (Registro.br, GoDaddy etc.). Me chame que eu te acompanho nisso.

---

## Observações

- **A página não guarda dados nem precisa de banco** — é só apresentação e
  botões de contato. Não precisa configurar Supabase para ela funcionar.
- O sistema de gestão do escritório também está nesse mesmo projeto, na
  página inicial (`/`). Ele **não aparece** para quem chega pela campanha
  (não há nenhum link para ele na landing). Se um dia você quiser proteger a
  página inicial com login, é só configurar o Supabase (ver `PUBLICAR.md`).
- Quando o anúncio estiver pronto, o link para usar nele é o
  **`SEU-ENDERECO/custodia`**.

---

## Precisa de mim?

Me avise quando estiver com o endereço da Vercel em mãos que eu confiro se
está tudo certo (SEO, botões, foto, avaliações do Google) e já te ajudo a
montar a campanha no Google Ads.
