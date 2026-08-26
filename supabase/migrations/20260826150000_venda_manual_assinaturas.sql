-- A origem 'manual' também precisa valer em `assinaturas`.
--
-- A migration anterior liberou só `pagamentos`, e `assinaturas` tem a própria
-- coluna `origem` com a mesma lista. O efeito era o pior tipo de meio caminho:
-- a venda manual criava a conta e o registro de pagamento, e falhava na hora de
-- ativar a assinatura. A pessoa passava a existir sem acesso.
--
-- Arquivo separado de propósito: a migration anterior já foi aplicada, e
-- acrescentar linhas nela não a executa de novo.
alter table public.assinaturas drop constraint if exists assinaturas_origem_check;
alter table public.assinaturas add constraint assinaturas_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual'));
