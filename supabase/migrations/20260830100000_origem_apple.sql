-- A Apple entra como terceira origem de cobrança.
--
-- A Mimu passa a vender pelos dois lados: na web pelo Mercado Pago, e dentro
-- do app iOS pelo In-App Purchase, porque a diretriz 3.1.1 exige que
-- assinatura digital consumida no app passe pela Apple. Quem comprou pela
-- Apple só cancela na Apple — é por esta coluna que a tela sabe para onde
-- mandar a pessoa, em vez de oferecer um cancelamento que não funcionaria.
--
-- As DUAS tabelas de uma vez, e é o ponto todo deste arquivo. A migration
-- 20260826150000 existe justamente porque a anterior liberou 'manual' só em
-- `pagamentos` e esqueceu `assinaturas`: a venda criava a conta, registrava o
-- pagamento e falhava ao ativar a assinatura — a pessoa passava a existir sem
-- acesso. Repetir esse erro aqui daria o mesmo sintoma, com quem acabou de
-- pagar na App Store.

alter table public.pagamentos drop constraint if exists pagamentos_origem_check;
alter table public.pagamentos add constraint pagamentos_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual', 'apple'));

alter table public.assinaturas drop constraint if exists assinaturas_origem_check;
alter table public.assinaturas add constraint assinaturas_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual', 'apple'));

-- O identificador que a Apple usa para a assinatura ao longo de toda a vida
-- dela, atravessando renovações. É por ele que a notificação de renovação, de
-- cancelamento e de reembolso encontra a linha aqui — o mesmo papel que
-- `mp_subscription_id` tem no Mercado Pago.
alter table public.assinaturas
  add column if not exists apple_original_transaction_id text;

comment on column public.assinaturas.apple_original_transaction_id is
  'originalTransactionId do StoreKit: estável entre renovações. Por onde as App Store Server Notifications encontram esta assinatura.';

-- Único pelo mesmo motivo do índice equivalente da Cakto: a notificação chega
-- com o id na mão e precisa achar a linha rápido, e uma notificação reenviada
-- não pode virar duas assinaturas.
create unique index if not exists assinaturas_apple_original_transaction_idx
  on public.assinaturas (apple_original_transaction_id)
  where apple_original_transaction_id is not null;

alter table public.pagamentos
  add column if not exists apple_transaction_id text;

comment on column public.pagamentos.apple_transaction_id is
  'transactionId da cobrança na App Store. Mesmo papel que mp_payment_id e cakto_payment_id.';

create unique index if not exists pagamentos_apple_transaction_id_idx
  on public.pagamentos (apple_transaction_id)
  where apple_transaction_id is not null;
