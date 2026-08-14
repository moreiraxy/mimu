-- Os planos que a landing page vende ('pro' e 'premium') não cabiam na
-- coluna: o check só aceitava 'basico' e 'completo', nomes da primeira
-- versão do produto.
--
-- Na prática isso fazia a assinatura de quem escolhia um plano pago não ser
-- criada, e a pessoa chegava ao checkout sem nada para pagar.
--
-- Os nomes antigos continuam aceitos porque contas criadas antes desta
-- mudança já gravaram 'completo'; tirá-los quebraria essas linhas.
alter table public.assinaturas
  drop constraint if exists assinaturas_plano_check;

alter table public.assinaturas
  add constraint assinaturas_plano_check
  check (plano in ('basico', 'completo', 'pro', 'premium'));

comment on column public.assinaturas.plano is
  'Plano contratado. pro/premium são os vendidos hoje (preço em lib/planos.ts); basico/completo são herdados da primeira versão.';
