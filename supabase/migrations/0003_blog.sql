-- =============================================================================
-- Camargo Advocacia — Blog jurídico ("Radar Penal")
-- Caixa de pautas (monitoramento das fontes oficiais) + posts do blog público.
-- Execute no SQL Editor do Supabase, depois do 0001/0002.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pautas: sugestões de assunto captadas automaticamente das fontes oficiais
-- (STF, STJ, Câmara, Senado). São só matéria-prima para a redação — nada aqui
-- vai ao ar sozinho.
-- ---------------------------------------------------------------------------
create table if not exists pautas (
  id uuid primary key default gen_random_uuid(),
  fonte text not null check (fonte in ('stf', 'stj', 'camara', 'senado')),
  externo_id text not null,               -- id/URL na origem (dedupe)
  titulo text not null,
  resumo text,
  url text not null,
  data_fonte date,
  tema text,
  status text not null default 'nova' check (status in ('nova', 'arquivada', 'usada')),
  created_at timestamptz not null default now(),
  unique (fonte, externo_id)              -- impede pauta duplicada
);

create index if not exists pautas_status_idx on pautas (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Posts: artigos do blog. Só aparecem em /blog quando status = 'publicado'.
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null unique,
  resumo text,
  conteudo text not null default '',
  autor text,
  fonte_url text,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  pauta_id uuid references pautas (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists posts_publicados_idx on posts (status, publicado_em desc);

-- ---------------------------------------------------------------------------
-- Segurança (RLS)
--  - posts PUBLICADOS: leitura liberada a qualquer visitante (blog é público);
--  - rascunhos e pautas: só a equipe autenticada do escritório.
-- ---------------------------------------------------------------------------
alter table pautas enable row level security;
alter table posts enable row level security;

-- Pautas: acesso completo só para membros autenticados do escritório.
drop policy if exists pautas_equipe on pautas;
create policy pautas_equipe on pautas
  for all
  using (auth.uid() in (select auth_user_id from membros where ativo))
  with check (auth.uid() in (select auth_user_id from membros where ativo));

-- Posts: qualquer pessoa (inclusive anônima) lê os publicados.
drop policy if exists posts_leitura_publica on posts;
create policy posts_leitura_publica on posts
  for select
  using (status = 'publicado');

-- Posts: a equipe autenticada lê tudo (inclusive rascunhos) e escreve.
drop policy if exists posts_equipe_leitura on posts;
create policy posts_equipe_leitura on posts
  for select
  using (auth.uid() in (select auth_user_id from membros where ativo));

drop policy if exists posts_equipe_escrita on posts;
create policy posts_equipe_escrita on posts
  for all
  using (auth.uid() in (select auth_user_id from membros where ativo))
  with check (auth.uid() in (select auth_user_id from membros where ativo));
