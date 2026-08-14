-- Suspensão de conta pelo painel admin.
--
-- Suspender é diferente de cancelar assinatura, e por isso mora em `empresas`
-- e não em `assinaturas.status`. Se fosse um status de assinatura, suspender
-- quem paga apagaria o fato de que ela paga — e reativar depois teria que
-- adivinhar para qual status voltar ('ativa'? 'trial'? com que prazo?).
--
-- Sendo uma coluna à parte, suspender e reativar não encostam na cobrança:
-- a assinatura continua 'ativa' o tempo todo, o acesso é que fica bloqueado.
-- É o mesmo motivo pelo qual "banir" e "cancelar plano" são coisas separadas
-- em qualquer serviço: são decisões de donos diferentes.
alter table public.empresas
  add column suspensa_em timestamptz,
  add column suspensa_motivo text;

comment on column public.empresas.suspensa_em is
  'Quando a conta foi suspensa pelo painel admin. Null = ativa. Bloqueia o acesso sem mexer na assinatura.';

comment on column public.empresas.suspensa_motivo is
  'Motivo registrado pelo admin ao suspender. Só o admin vê.';

-- O gate de acesso consulta isto a cada requisição, filtrando por user_id.
-- Sem índice, é uma varredura na tabela inteira em toda navegação.
create index empresas_suspensa_idx
  on public.empresas (user_id)
  where suspensa_em is not null;
