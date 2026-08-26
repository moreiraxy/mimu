-- A Mimu passa a cobrar por dois caminhos ao mesmo tempo: o checkout próprio
-- (Mercado Pago, Pix e cartão dentro do app) e o da Cakto, hospedado fora.
--
-- Sem uma coluna de origem, `pagamentos` não sabe dizer quem cobrou o quê. Na
-- prática isso quebra os dois webhooks ao mesmo tempo: cada um varre a tabela
-- procurando o id que recebeu, e sem saber a origem da linha um acabaria
-- mexendo em pagamento do outro.

alter table public.pagamentos
  add column if not exists origem text not null default 'mercadopago'
    check (origem in ('mercadopago', 'cakto'));

comment on column public.pagamentos.origem is
  'Quem processou a cobrança. As linhas anteriores a esta migration são todas do checkout próprio, por isso o default.';

-- Os ids do Mercado Pago ficam exatamente onde estavam. O painel deles cobra
-- um "Payment ID produtivo" lido de `mp_payment_id` para a pontuação de
-- qualidade da integração, que ainda está em aberto — generalizar as colunas
-- agora mexeria justamente no caminho que precisa ficar quieto.
alter table public.pagamentos
  add column if not exists cakto_payment_id text,
  add column if not exists cakto_status text;

comment on column public.pagamentos.cakto_payment_id is
  'Id da transação na Cakto. Mesmo papel que mp_payment_id tem no checkout próprio.';
comment on column public.pagamentos.cakto_status is
  'Status cru devolvido pela Cakto, guardado sem tradução para depuração.';

-- Mesma razão do índice equivalente do Mercado Pago: o webhook chega com o id
-- do provedor na mão e precisa achar a linha rápido. O único garante que uma
-- notificação reenviada não vire pagamento duplicado.
create unique index if not exists pagamentos_cakto_payment_id_idx
  on public.pagamentos (cakto_payment_id)
  where cakto_payment_id is not null;

-- A Cakto também vende no boleto, que o checkout próprio nunca ofereceu. Sem
-- soltar o check, o insert do webhook falharia calado na primeira venda assim.
alter table public.pagamentos
  drop constraint if exists pagamentos_forma_pagamento_check;

alter table public.pagamentos
  add constraint pagamentos_forma_pagamento_check
  check (forma_pagamento in ('pix', 'cartao', 'boleto'));

-- A assinatura precisa saber quem cobra a renovação dela. Cancelar e consultar
-- a próxima cobrança são operações no provedor, e sem isso não dá para saber em
-- qual painel olhar quando a cliente pedir cancelamento.
--
-- Nulo de propósito, sem default: enquanto ninguém pagou (trial e pendente) não
-- existe provedor cobrando, e fingir que existe é pior do que deixar vazio.
alter table public.assinaturas
  add column if not exists origem text
    check (origem in ('mercadopago', 'cakto'));

comment on column public.assinaturas.origem is
  'Provedor que cobra esta assinatura. Nulo enquanto não houve pagamento (trial e pendente).';
