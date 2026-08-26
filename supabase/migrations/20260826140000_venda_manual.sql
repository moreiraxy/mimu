-- Venda registrada na mão passa a ser uma origem de pagamento.
--
-- Antes só existiam 'mercadopago' e 'cakto', as duas com checkout automático.
-- Mas boa parte da venda no começo acontece por fora: conversa no WhatsApp,
-- Pix direto, combinado pessoalmente. Sem uma origem para isso, não havia onde
-- registrar, e liberar o acesso exigia mexer no banco na mão a cada venda.
--
-- Fica como origem de primeira classe, e não como um 'mercadopago' mentiroso,
-- porque a diferença importa depois: numa conferência de caixa, saber o que
-- entrou por plataforma e o que entrou por fora é a primeira pergunta.
alter table public.pagamentos drop constraint if exists pagamentos_origem_check;
alter table public.pagamentos add constraint pagamentos_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual'));

-- Venda manual não tem id de transação de provedor nenhum. O id gerado na hora
-- do registro vai em `cakto_payment_id`? Não: ganha coluna própria, senão a
-- busca por idempotência da Cakto passaria a topar com linhas que não são dela.
alter table public.pagamentos
  add column if not exists manual_referencia text;

comment on column public.pagamentos.manual_referencia is
  'Identificador da venda manual (ex.: id do Pix, ou uma referência escrita por quem registrou). Serve de chave de idempotência.';

create unique index if not exists pagamentos_manual_referencia_idx
  on public.pagamentos (manual_referencia)
  where manual_referencia is not null;
