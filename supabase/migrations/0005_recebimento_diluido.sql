-- ===========================================================================
-- Recebimento excepcional — diluir no gráfico sem mexer no caixa
-- ===========================================================================
-- Um caso que levou anos e foi pago de uma vez entra todo num mês só. No
-- gráfico de faturamento isso vira um pico que achata todos os outros meses:
-- a escala se estica para caber os R$ 30.000 de fevereiro e os meses normais,
-- de R$ 10.000, viram traços quase iguais. O ano fica ilegível justamente onde
-- ele deveria ser lido.
--
-- Esta coluna marca esses recebimentos. Ela NÃO muda dinheiro nenhum: todo
-- total do sistema continua contando por `pago_em`, o mês em que o dinheiro
-- realmente entrou. O único lugar que a lê é o gráfico de Desempenho, que
-- oferece espalhar o valor pelos meses do ano — e diz na tela que está fazendo
-- isso, com um botão para ver como entrou de verdade.
--
-- Rodar no SQL Editor do Supabase. É idempotente: pode rodar de novo.
-- ===========================================================================

alter table lancamentos add column if not exists diluido boolean;

-- Diluir só faz sentido no que já entrou: um valor a receber não tem mês de
-- caixa para espalhar.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lancamento_diluido_so_se_pago'
  ) then
    alter table lancamentos
      add constraint lancamento_diluido_so_se_pago
      check (diluido is not true or pago_em is not null);
  end if;
end $$;

comment on column lancamentos.diluido is
  'Recebimento excepcional (trabalho de vários anos pago de uma vez). Não altera nenhum total: apenas autoriza o gráfico de Desempenho a espalhar o valor pelos meses do ano.';
