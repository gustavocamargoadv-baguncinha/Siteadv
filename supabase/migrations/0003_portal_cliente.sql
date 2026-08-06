-- ===========================================================================
-- Portal do Cliente — acesso separado por papel
-- ===========================================================================
-- ANTES desta migration, a regra era: "qualquer usuário logado vê tudo"
--   create policy acesso_equipe ... for all to authenticated using (true)
-- Isso serve para um escritório onde todo mundo que loga é da equipe. No
-- momento em que um CLIENTE ganha login, essa mesma regra entregaria a ele os
-- processos criminais de todos os outros clientes — quebra de sigilo
-- profissional e de segredo de justiça.
--
-- Aqui a regra passa a depender do PAPEL:
--   • advogado  → acesso total (como era)
--   • cliente   → SOMENTE LEITURA e SOMENTE do que é dele; nada de financeiro
--
-- Rodar no SQL Editor do Supabase. É idempotente: pode rodar de novo.
-- ===========================================================================

-- 1) Quem é quem ------------------------------------------------------------
create table if not exists perfis (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  papel      text not null check (papel in ('advogado', 'cliente')),
  cliente_id uuid references clientes (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- um perfil de cliente TEM de apontar para uma ficha de cliente; um perfil
  -- de advogado nunca aponta. Sem isso, um cliente sem vínculo cairia numa
  -- regra vazia e o comportamento ficaria indefinido.
  constraint perfil_coerente check (
    (papel = 'cliente'  and cliente_id is not null) or
    (papel = 'advogado' and cliente_id is null)
  )
);

create index if not exists idx_perfis_cliente on perfis (cliente_id);

-- Todo mundo que JÁ tem login hoje é da equipe. Isso preserva o acesso atual
-- do Dr. Gustavo — sem esta linha, rodar a migration o trancaria para fora.
insert into perfis (user_id, papel)
select id, 'advogado' from auth.users
on conflict (user_id) do nothing;

-- 2) Funções de apoio -------------------------------------------------------
-- SECURITY DEFINER: elas consultam "perfis" por fora do RLS. Se consultassem
-- por dentro, a política de "perfis" chamaria a função, que consultaria
-- "perfis"... — recursão infinita.
create or replace function eh_advogado() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where user_id = auth.uid() and papel = 'advogado');
$$;

create or replace function meu_cliente_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select cliente_id from perfis where user_id = auth.uid() and papel = 'cliente';
$$;

-- 3) Políticas ---------------------------------------------------------------
alter table perfis enable row level security;
drop policy if exists perfis_proprio on perfis;
drop policy if exists perfis_equipe on perfis;
-- cada um lê o próprio perfil (é assim que o app descobre para onde mandar o
-- usuário depois do login); o advogado enxerga e administra todos
create policy perfis_proprio on perfis for select to authenticated using (user_id = auth.uid());
create policy perfis_equipe  on perfis for all    to authenticated using (eh_advogado()) with check (eh_advogado());

-- 3.1) Acesso da equipe: continua total, mas agora exige papel de advogado.
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
      'create policy acesso_equipe on %I for all to authenticated using (eh_advogado()) with check (eh_advogado());', t
    );
  end loop;
end $$;

-- 3.2) Acesso do cliente: só leitura, só o que é dele.
-- Tudo que NÃO ganhar política aqui fica inacessível ao cliente — é o caso de
-- lancamentos, contratos_honorarios, timesheet, membros, tarefas, prazos e
-- monitoramentos. O financeiro e o controle interno do escritório não são
-- assunto do cliente.

drop policy if exists cliente_ve_sua_ficha on clientes;
create policy cliente_ve_sua_ficha on clientes
  for select to authenticated
  using (id = meu_cliente_id());

drop policy if exists cliente_ve_seus_processos on processos;
create policy cliente_ve_seus_processos on processos
  for select to authenticated
  using (cliente_id = meu_cliente_id());

drop policy if exists cliente_ve_seus_andamentos on andamentos;
create policy cliente_ve_seus_andamentos on andamentos
  for select to authenticated
  using (exists (
    select 1 from processos p
     where p.id = andamentos.processo_id
       and p.cliente_id = meu_cliente_id()
  ));

drop policy if exists cliente_ve_seus_eventos on eventos_agenda;
create policy cliente_ve_seus_eventos on eventos_agenda
  for select to authenticated
  using (
    cliente_id = meu_cliente_id()
    or exists (
      select 1 from processos p
       where p.id = eventos_agenda.processo_id
         and p.cliente_id = meu_cliente_id()
    )
  );

-- Documento só aparece quando foi MARCADO como visível. O padrão é não mostrar.
drop policy if exists cliente_ve_docs_liberados on documentos;
create policy cliente_ve_docs_liberados on documentos
  for select to authenticated
  using (
    visivel_cliente = true
    and (
      cliente_id = meu_cliente_id()
      or exists (
        select 1 from processos p
         where p.id = documentos.processo_id
           and p.cliente_id = meu_cliente_id()
      )
    )
  );

-- ===========================================================================
-- CONFERIR DEPOIS DE RODAR (não pule):
--   select papel, count(*) from perfis group by papel;   -- você deve estar como 'advogado'
-- E, logado como um cliente de teste, verificar que:
--   select * from lancamentos;  -- deve vir VAZIO
--   select * from processos;    -- só os processos dele
-- ===========================================================================
