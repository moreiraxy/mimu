-- Assinatura passa a saber se é mensal ou anual.
--
-- Antes não sabia, e o cálculo da próxima cobrança era `+1 mês` fixo em dois
-- lugares. Quem pagasse doze meses adiantado ficava com a renovação marcada
-- para daqui a trinta dias, e o gate de assinatura cobraria de novo de quem já
-- tinha pago o ano.
--
-- Isso não é problema só do checkout externo: venda feita na mão, por fora de
-- qualquer plataforma, cai no mesmo cálculo.
--
-- `valor_mensal` continua com o nome que tem, mas passa a guardar o valor
-- COBRADO na periodicidade escolhida. Renomear a coluna quebraria o painel
-- admin, as rotas de pagamento e a view `admin_contas` de uma vez; o
-- comentário abaixo evita a leitura errada.
alter table public.assinaturas
  add column if not exists periodicidade text not null default 'mensal'
    check (periodicidade in ('mensal', 'anual'));

comment on column public.assinaturas.periodicidade is
  'mensal ou anual. Decide de quanto em quanto tempo a próxima cobrança cai.';

comment on column public.assinaturas.valor_mensal is
  'Valor cobrado na periodicidade da assinatura, não necessariamente por mês. Numa anual, guarda o valor do ano.';

-- Quem já existe é mensal, que é o único que existia até agora.
