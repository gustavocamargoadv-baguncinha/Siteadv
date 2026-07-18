-- =============================================================================
-- Camargo Advocacia — schema do sistema de gestão
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Depois crie o bucket "documentos" em Storage.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Equipe (vinculada ao usuário de login via auth_user_id)
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
-- Clientes (portal_user_id liga o cliente ao login dele no portal)
-- ---------------------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  portal_user_id uuid references auth.users (id) on delete set null,
  tipo text not null default 'pf' check (tipo in ('pf', 'pj')),
  nome text not null,
  cpf_cnpj text,
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
-- Documentos (arquivos no bucket "documentos" do Storage)
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

-- Timesheet (horas trabalhadas — base para honorários por hora; UI futura)
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

-- Registro dos monitoramentos junto ao provedor de tribunais
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
-- Segurança (RLS)
--   Equipe: acesso conforme papel. Cliente do portal: enxerga só o que é dele.
-- ---------------------------------------------------------------------------
alter table membros enable row level security;
alter table clientes enable row level security;
alter table processos enable row level security;
alter table andamentos enable row level security;
alter table prazos enable row level security;
alter table eventos_agenda enable row level security;
alter table tarefas enable row level security;
alter table documentos enable row level security;
alter table contratos_honorarios enable row level security;
alter table lancamentos enable row level security;
alter table timesheet enable row level security;
alter table monitoramentos enable row level security;

-- Usuário logado pertence à equipe?
create or replace function is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros m
    where m.auth_user_id = auth.uid() and m.ativo
  );
$$;

-- Usuário logado é admin ou advogado? (financeiro completo)
create or replace function is_lawyer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros m
    where m.auth_user_id = auth.uid() and m.ativo and m.papel in ('admin', 'advogado')
  );
$$;

-- id do cliente vinculado ao usuário do portal (null para a equipe)
create or replace function portal_cliente_id()
returns uuid language sql stable security definer set search_path = public as $$
  select c.id from clientes c where c.portal_user_id = auth.uid() limit 1;
$$;

-- Equipe: acesso total às tabelas operacionais
create policy equipe_membros on membros for all using (is_team()) with check (is_team());
create policy equipe_clientes on clientes for all using (is_team()) with check (is_team());
create policy equipe_processos on processos for all using (is_team()) with check (is_team());
create policy equipe_andamentos on andamentos for all using (is_team()) with check (is_team());
create policy equipe_prazos on prazos for all using (is_team()) with check (is_team());
create policy equipe_eventos on eventos_agenda for all using (is_team()) with check (is_team());
create policy equipe_tarefas on tarefas for all using (is_team()) with check (is_team());
create policy equipe_documentos on documentos for all using (is_team()) with check (is_team());
create policy equipe_timesheet on timesheet for all using (is_team()) with check (is_team());
create policy equipe_monitoramentos on monitoramentos for all using (is_team()) with check (is_team());

-- Financeiro: apenas admin/advogado
create policy adv_contratos on contratos_honorarios for all using (is_lawyer()) with check (is_lawyer());
create policy adv_lancamentos on lancamentos for all using (is_lawyer()) with check (is_lawyer());

-- Portal do cliente: somente leitura do que é dele
create policy portal_proprio_cliente on clientes for select using (portal_user_id = auth.uid());
create policy portal_processos on processos for select using (cliente_id = portal_cliente_id());
create policy portal_andamentos on andamentos for select using (
  processo_id in (select p.id from processos p where p.cliente_id = portal_cliente_id())
);
create policy portal_eventos on eventos_agenda for select using (cliente_id = portal_cliente_id());
create policy portal_documentos on documentos for select using (
  visivel_cliente and cliente_id = portal_cliente_id()
);

-- ---------------------------------------------------------------------------
-- Depois de rodar este script:
-- 1. Storage → crie o bucket privado "documentos";
-- 2. Authentication → convide os membros da equipe por e-mail;
-- 3. Insira cada membro em "membros" preenchendo auth_user_id com o id do
--    usuário criado (Authentication → Users);
-- 4. Para dar acesso ao portal a um cliente, convide-o por e-mail e preencha
--    clientes.portal_user_id com o id do usuário dele.
-- ---------------------------------------------------------------------------
