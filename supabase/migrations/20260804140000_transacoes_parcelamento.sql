-- Agrupa as parcelas de uma mesma compra parcelada. Sem essa coluna não há
-- como distinguir, na página de detalhe, "todas as parcelas desta compra"
-- de outra transação não relacionada que só coincide em descrição/categoria.

alter table public.transacoes
  add column grupo_parcelamento_id uuid;

comment on column public.transacoes.grupo_parcelamento_id is
  'Agrupa as parcelas de uma mesma compra parcelada — todas as linhas de um parcelamento compartilham o mesmo valor aqui.';

create index transacoes_grupo_parcelamento_idx
  on public.transacoes (grupo_parcelamento_id)
  where grupo_parcelamento_id is not null;
