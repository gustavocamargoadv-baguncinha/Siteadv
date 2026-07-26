-- ============================================================================
-- SETUP COMPLETO — Camargo Advocacia  (v2 — ids em texto)
-- Cole TUDO isto de uma vez no SQL Editor do Supabase e clique em RUN.
-- Pode rodar mesmo que você já tenha rodado a versão anterior: as linhas DROP
-- abaixo apagam as tabelas antigas (que ainda estão VAZIAS) e recriam tudo certo.
-- Cria as tabelas + segurança (só quem está LOGADO acessa; público bloqueado).
-- ============================================================================

create extension if not exists "pgcrypto";

-- Apaga as tabelas antigas (vazias) para recriar com o formato de id correto.
drop table if exists monitoramentos, timesheet, lancamentos, contratos_honorarios,
  documentos, tarefas, eventos_agenda, prazos, andamentos, processos,
  clientes, membros cascade;

-- ---------------------------------------------------------------------------
-- Equipe
-- ---------------------------------------------------------------------------
create table membros (
  id text primary key default gen_random_uuid()::text,
  auth_user_id uuid references auth.users (id) on delete set null,
  nome text not null,
  email text not null,
  papel text not null default 'advogado' check (papel in ('admin', 'advogado', 'estagiario', 'secretaria')),
  oab text,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clientes (com qualificação completa para gerar documentos)
-- ---------------------------------------------------------------------------
create table clientes (
  id text primary key default gen_random_uuid()::text,
  portal_user_id uuid references auth.users (id) on delete set null,
  tipo text not null default 'pf' check (tipo in ('pf', 'pj')),
  nome text not null,
  cpf_cnpj text,
  rg text,
  nacionalidade text,
  estado_civil text,
  profissao text,
  email text,
  telefone text,
  endereco text,
  notas text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Processos e andamentos
-- ---------------------------------------------------------------------------
create table processos (
  id text primary key default gen_random_uuid()::text,
  numero_cnj text,
  cliente_id text not null references clientes (id) on delete cascade,
  area text not null default 'criminal',
  tribunal text,
  vara text,
  comarca text,
  fase text,
  situacao text,
  status text not null default 'ativo' check (status in ('ativo', 'suspenso', 'arquivado', 'encerrado')),
  parte_contraria text,
  objeto text,
  valor_causa numeric,
  responsavel_id text references membros (id) on delete set null,
  monitorado boolean not null default false,
  created_at timestamptz not null default now()
);

create table andamentos (
  id text primary key default gen_random_uuid()::text,
  processo_id text not null references processos (id) on delete cascade,
  data date not null default current_date,
  descricao text not null,
  origem text not null default 'manual' check (origem in ('manual', 'tribunal')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Prazos, agenda e tarefas
-- ---------------------------------------------------------------------------
create table prazos (
  id text primary key default gen_random_uuid()::text,
  processo_id text references processos (id) on delete cascade,
  titulo text not null,
  tipo text,
  data_limite date not null,
  data_interna date,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  responsavel_id text references membros (id) on delete set null,
  notas text,
  concluido_em date,
  created_at timestamptz not null default now()
);

create table eventos_agenda (
  id text primary key default gen_random_uuid()::text,
  tipo text not null default 'audiencia' check (tipo in ('audiencia', 'reuniao', 'sustentacao', 'atendimento', 'video', 'outro')),
  titulo text not null,
  processo_id text references processos (id) on delete cascade,
  cliente_id text references clientes (id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz,
  local text,
  link_virtual text,
  notas text,
  created_at timestamptz not null default now()
);

create table tarefas (
  id text primary key default gen_random_uuid()::text,
  titulo text not null,
  descricao text,
  processo_id text references processos (id) on delete cascade,
  responsavel_id text references membros (id) on delete set null,
  data_limite date,
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  status text not null default 'pendente' check (status in ('pendente', 'fazendo', 'concluida')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documentos
-- ---------------------------------------------------------------------------
create table documentos (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  processo_id text references processos (id) on delete cascade,
  cliente_id text references clientes (id) on delete cascade,
  tipo text,
  tamanho bigint,
  storage_path text,
  visivel_cliente boolean not null default false,
  enviado_por text references membros (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Financeiro
-- ---------------------------------------------------------------------------
create table contratos_honorarios (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes (id) on delete cascade,
  processo_id text references processos (id) on delete set null,
  tipo text not null default 'fixo' check (tipo in ('fixo', 'exito', 'hora', 'misto', 'pro_bono')),
  valor_fixo numeric,
  percentual_exito numeric,
  valor_hora numeric,
  descricao text,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now()
);

create table lancamentos (
  id text primary key default gen_random_uuid()::text,
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria text not null,
  cliente_id text references clientes (id) on delete set null,
  processo_id text references processos (id) on delete set null,
  descricao text not null,
  valor numeric not null,
  vencimento date not null,
  pago_em date,
  forma_pagamento text,
  created_at timestamptz not null default now()
);

create table timesheet (
  id text primary key default gen_random_uuid()::text,
  membro_id text references membros (id) on delete set null,
  processo_id text references processos (id) on delete set null,
  descricao text,
  minutos integer not null,
  data date not null default current_date,
  faturavel boolean not null default true,
  created_at timestamptz not null default now()
);

create table monitoramentos (
  id text primary key default gen_random_uuid()::text,
  processo_id text not null references processos (id) on delete cascade,
  provider text not null,
  provider_id text,
  ativo boolean not null default true,
  ultimo_sync timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index idx_processos_cliente on processos (cliente_id);
create index idx_andamentos_processo on andamentos (processo_id, data desc);
create index idx_prazos_data on prazos (status, data_limite);
create index idx_eventos_inicio on eventos_agenda (inicio);
create index idx_lancamentos_venc on lancamentos (vencimento);

-- ---------------------------------------------------------------------------
-- SEGURANÇA (RLS): só usuários LOGADOS acessam. O público (anônimo) é bloqueado.
-- Qualquer pessoa da equipe que você convidar em Authentication tem acesso.
-- O webhook de tribunais usa a chave de serviço, que ignora o RLS.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'membros','clientes','processos','andamentos','prazos','eventos_agenda',
    'tarefas','documentos','contratos_honorarios','lancamentos','timesheet','monitoramentos'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists acesso_equipe on %I;', t);
    execute format(
      'create policy acesso_equipe on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- ============================================================================
-- BLOG "Radar Penal" — pautas (monitoramento) + posts (blog público)
-- Não apaga nada: usa "create table if not exists". A diferença de segurança:
-- os POSTS PUBLICADOS têm leitura pública (o blog é aberto a visitantes).
-- ============================================================================

create table if not exists pautas (
  id text primary key default gen_random_uuid()::text,
  fonte text not null check (fonte in ('stf', 'stj', 'camara', 'senado')),
  externo_id text not null,
  titulo text not null,
  resumo text,
  url text not null,
  data_fonte date,
  tema text,
  status text not null default 'nova' check (status in ('nova', 'arquivada', 'usada')),
  created_at timestamptz not null default now(),
  unique (fonte, externo_id)
);
create index if not exists idx_pautas_status on pautas (status, created_at desc);

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

-- pautas: só a equipe logada.
alter table pautas enable row level security;
drop policy if exists pautas_equipe on pautas;
create policy pautas_equipe on pautas for all to authenticated using (true) with check (true);

-- posts: leitura PÚBLICA dos publicados; a equipe logada faz tudo (inclui rascunhos).
alter table posts enable row level security;
drop policy if exists posts_publicos on posts;
create policy posts_publicos on posts for select using (status = 'publicado');
drop policy if exists posts_equipe on posts;
create policy posts_equipe on posts for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Pronto. Se ainda não fez: Storage → bucket privado "documentos".
-- Seu login já foi criado em Authentication (mantém funcionando).
-- ---------------------------------------------------------------------------
