-- Adiciona a coluna "situacao" (fase do caso) à tabela de processos.
-- Rode isto UMA VEZ no SQL Editor do Supabase se você já tinha criado o
-- banco antes desta atualização. É seguro: não apaga nada e não dá erro
-- se a coluna já existir.

alter table processos add column if not exists situacao text;
