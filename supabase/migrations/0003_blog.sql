-- =============================================================================
-- Camargo Advocacia — Blog jurídico ("Radar Penal")
-- Caixa de pautas (monitoramento das fontes oficiais) + posts do blog público.
--
-- Segue o padrão do setup.sql (v2): ids em texto e RLS liberada à equipe
-- logada. A exceção é a LEITURA PÚBLICA dos posts publicados — o blog é aberto.
-- Não apaga nada existente: usa "create table if not exists".
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pautas: sugestões captadas das fontes oficiais (STF, STJ, Câmara, Senado).
-- Matéria-prima da redação — nada aqui vai ao ar sozinho.
-- ---------------------------------------------------------------------------
create table if not exists pautas (
  id text primary key default gen_random_uuid()::text,
  fonte text not null check (fonte in ('stf', 'stj', 'camara', 'senado', 'blogs')),
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

create index if not exists idx_pautas_status on pautas (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Posts: artigos do blog. Só aparecem em /blog quando status = 'publicado'.
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id text primary key default gen_random_uuid()::text,
  titulo text not null,
  slug text not null unique,
  resumo text,
  conteudo text not null default '',
  autor text,
  fonte_url text,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  pauta_id text references pautas (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_publicados on posts (status, publicado_em desc);

-- ---------------------------------------------------------------------------
-- Segurança (RLS)
--  - pautas: só a equipe logada;
--  - posts:  leitura PÚBLICA dos publicados; equipe logada faz tudo.
-- ---------------------------------------------------------------------------
alter table pautas enable row level security;
drop policy if exists pautas_equipe on pautas;
create policy pautas_equipe on pautas for all to authenticated using (true) with check (true);

alter table posts enable row level security;
drop policy if exists posts_publicos on posts;
create policy posts_publicos on posts for select using (status = 'publicado');
drop policy if exists posts_equipe on posts;
create policy posts_equipe on posts for all to authenticated using (true) with check (true);
