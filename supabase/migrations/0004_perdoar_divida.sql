-- ===========================================================================
-- Perdoar dívida — abrir mão de um honorário sem apagar o histórico
-- ===========================================================================
-- O escritório às vezes decide não cobrar mais: acordo, cliente que sumiu,
-- caso que virou pro bono. Antes disso, a parcela só tinha dois destinos —
-- ficar eternamente vermelha na Cobrança ou ser marcada como "recebida"
-- (mentira que inflaria o faturamento).
--
-- Aqui ela ganha um terceiro estado. A parcela sai da cobrança ativa, MAS
-- continua guardada: o valor perdoado aparece na ficha do cliente e na aba
-- "Perdoados" do Financeiro. Perdão NUNCA conta como receita — os relatórios
-- de desempenho somam apenas `pago_em`, então nada muda lá.
--
-- Reversível: limpar as duas colunas devolve a parcela à cobrança.
--
-- Rodar no SQL Editor do Supabase. É idempotente: pode rodar de novo.
-- ===========================================================================

alter table lancamentos add column if not exists perdoado_em     date;
alter table lancamentos add column if not exists perdoado_motivo text;

-- Incoerência que o app não produz, mas o banco não deve aceitar de ninguém:
-- uma parcela recebida E perdoada ao mesmo tempo. Os dois totais passariam a
-- contar o mesmo dinheiro.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lancamento_pago_ou_perdoado'
  ) then
    alter table lancamentos
      add constraint lancamento_pago_ou_perdoado
      check (pago_em is null or perdoado_em is null);
  end if;
end $$;

-- A Cobrança varre "o que ainda é cobrável": receita sem pagamento e sem
-- perdão. O índice parcial cobre exatamente essa consulta.
create index if not exists idx_lancamentos_cobranca
  on lancamentos (vencimento)
  where tipo = 'receita' and pago_em is null and perdoado_em is null;

comment on column lancamentos.perdoado_em is
  'Data em que o escritório abriu mão de receber. Sai da cobrança ativa e nunca entra no faturamento; null = ainda cobrável.';
comment on column lancamentos.perdoado_motivo is
  'Por que foi perdoado (acordo, cliente sumiu, pro bono…). Opcional.';
