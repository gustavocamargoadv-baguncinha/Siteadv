-- ===========================================================================
-- Remove o depósito de R$ 5.000 que contava o mesmo dinheiro duas vezes
-- ===========================================================================
-- Os R$ 30.000 do Caso Debora foram recebidos em espécie em 28/02/2026 e
-- lançados à mão. Parte desse dinheiro foi ao banco depois, e o extrato de
-- 22/04 trouxe um depósito de R$ 5.000 sem cliente vinculado — que a
-- importação lançou como se fosse uma receita nova.
--
-- Era o mesmo dinheiro contado duas vezes: inflava o faturamento de 2026 em
-- R$ 5.000 e criava um degrau em abril que nunca existiu.
--
-- O depósito de R$ 200 do mesmo dia FICA: ainda não se sabe de onde veio, e
-- apagar por semelhança seria apagar dinheiro de verdade.
--
-- Rodar no SQL Editor do Supabase. É idempotente: se já foi apagado, não faz
-- nada e não dá erro.
-- ===========================================================================

-- Os quatro critérios juntos apontam um único lançamento. `cliente_id is null`
-- é o que protege de acertar um honorário de R$ 5.000 de algum cliente real
-- que por acaso tenha caído na mesma data.
delete from lancamentos
 where descricao   = 'Confirmar de qual cliente/caso é esse depósito'
   and valor       = 5000
   and pago_em     = date '2026-04-22'
   and cliente_id is null;
