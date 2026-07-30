-- =============================================================================
-- Adiciona a fonte "blogs" (Blogs consolidados) à caixa de pautas.
-- Rode no SQL Editor do Supabase se você já tinha criado a tabela `pautas`
-- antes desta fonte existir. É seguro e não apaga nada.
-- =============================================================================

alter table pautas drop constraint if exists pautas_fonte_check;
alter table pautas add constraint pautas_fonte_check
  check (fonte in ('stf', 'stj', 'camara', 'senado', 'blogs'));
