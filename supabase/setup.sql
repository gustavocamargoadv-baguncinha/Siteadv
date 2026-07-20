-- ============================================================================
-- SETUP COMPLETO — Camargo Advocacia
-- Cole TUDO isto de uma vez no SQL Editor do Supabase e clique em RUN.
-- Cria as tabelas e ativa a segurança: só quem estiver LOGADO acessa os dados
-- (o público é bloqueado). O login é criado em Authentication (convite por e-mail).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Equipe
-- ---------------------------------------------------------------------------
create table if not exists membros (
  id uuid primary key default gen_random_uuid(),
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
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
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
create table if not exists processos (
  id uuid primary key default gen_random_uuid(),
  numero_cnj text,
  cliente_id uuid not null references clientes (id) on delete cascade,
  area text not null default 'criminal',
  tribunal text,
  vara text,
  comarca text,
  fase text,
  status text not null default 'ativo' check (status in ('ativo', 'suspenso', 'arquivado', 'encerrado')),
  parte_contraria text,
  objeto text,
  valor_causa numeric,
  responsavel_id uuid references membros (id) on delete set null,
  monitorado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists andamentos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos (id) on delete cascade,
  data date not null default current_date,
  descricao text not null,
  origem text not null default 'manual' check (origem in ('manual', 'tribunal')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Prazos, agenda e tarefas
-- ---------------------------------------------------------------------------
create table if not exists prazos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid references processos (id) on delete cascade,
  titulo text not null,
  tipo text,
  data_limite date not null,
  data_interna date,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  responsavel_id uuid references membros (id) on delete set null,
  notas text,
  concluido_em date,
  created_at timestamptz not null default now()
);

create table if not exists eventos_agenda (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'audiencia' check (tipo in ('audiencia', 'reuniao', 'sustentacao', 'atendimento', 'outro')),
  titulo text not null,
  processo_id uuid references processos (id) on delete cascade,
  cliente_id uuid references clientes (id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz,
  local text,
  link_virtual text,
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  processo_id uuid references processos (id) on delete cascade,
  responsavel_id uuid references membros (id) on delete set null,
  data_limite date,
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  status text not null default 'pendente' check (status in ('pendente', 'fazendo', 'concluida')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documentos
-- ---------------------------------------------------------------------------
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  processo_id uuid references processos (id) on delete cascade,
  cliente_id uuid references clientes (id) on delete cascade,
  tipo text,
  tamanho bigint,
  storage_path text,
  visivel_cliente boolean not null default false,
  enviado_por uuid references membros (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Financeiro
-- ---------------------------------------------------------------------------
create table if not exists contratos_honorarios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  processo_id uuid references processos (id) on delete set null,
  tipo text not null default 'fixo' check (tipo in ('fixo', 'exito', 'hora', 'misto', 'pro_bono')),
  valor_fixo numeric,
  percentual_exito numeric,
  valor_hora numeric,
  descricao text,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now()
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria text not null,
  cliente_id uuid references clientes (id) on delete set null,
  processo_id uuid references processos (id) on delete set null,
  descricao text not null,
  valor numeric not null,
  vencimento date not null,
  pago_em date,
  forma_pagamento text,
  created_at timestamptz not null default now()
);

create table if not exists timesheet (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid references membros (id) on delete set null,
  processo_id uuid references processos (id) on delete set null,
  descricao text,
  minutos integer not null,
  data date not null default current_date,
  faturavel boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists monitoramentos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos (id) on delete cascade,
  provider text not null,
  provider_id text,
  ativo boolean not null default true,
  ultimo_sync timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists idx_processos_cliente on processos (cliente_id);
create index if not exists idx_andamentos_processo on andamentos (processo_id, data desc);
create index if not exists idx_prazos_data on prazos (status, data_limite);
create index if not exists idx_eventos_inicio on eventos_agenda (inicio);
create index if not exists idx_lancamentos_venc on lancamentos (vencimento);

-- ---------------------------------------------------------------------------
-- SEGURANÇA (RLS): só usuários LOGADOS acessam. O público (anônimo) é bloqueado.
-- Modelo simples para começar: qualquer pessoa da equipe que você convidar em
-- Authentication tem acesso. (Papéis finos e portal do cliente entram depois.)
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

-- ---------------------------------------------------------------------------
-- Depois de rodar este script:
-- 1. Storage → crie o bucket privado "documentos" (se ainda não criou).
-- 2. Authentication → Users → Add user → crie o SEU login (e-mail + senha).
--    É com esse e-mail/senha que você entra no sistema.
-- 3. Para dar acesso a alguém da equipe, é só criar outro usuário aqui.
-- ---------------------------------------------------------------------------
