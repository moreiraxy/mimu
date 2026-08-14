-- Estado "pendente": conta criada, plano pago escolhido, pagamento ainda não
-- feito.
--
-- Antes só existiam trial / ativa / cancelada / vencida, e isso não dava
-- conta de quem escolhe um plano pago na landing: essa pessoa não está em
-- teste (não pediu teste), não está ativa (não pagou) e não cancelou nada.
--
-- Sem um estado próprio, as duas saídas eram ruins: deixar a conta sem
-- assinatura quebrava o checkout, que precisa de uma assinatura para
-- referenciar no Mercado Pago; e reaproveitar 'cancelada' mandava a pessoa
-- para a tela de "seu período gratuito acabou", que é mentira para quem
-- nunca teve período gratuito.
alter table public.assinaturas
  drop constraint if exists assinaturas_status_check;

alter table public.assinaturas
  add constraint assinaturas_status_check
  check (status in ('trial', 'ativa', 'cancelada', 'vencida', 'pendente'));

comment on column public.assinaturas.status is
  'trial = teste grátis em dia | ativa = pagando | pendente = escolheu plano pago e ainda não pagou | vencida = trial acabou | cancelada = encerrada';
