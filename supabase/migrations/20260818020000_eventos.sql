-- Registro do que acontece no produto.
--
-- Existe por causa de três apagões seguidos que ninguém viu acontecer: o
-- cadastro ficou quebrado três dias devolvendo 500, a Mimu ficou muda por
-- horas porque a Groq aposentou o modelo, e o aviso de novo cadastro nunca
-- chegou. Nos três casos o erro existia, estava certo em falhar fechado, e
-- morria no log do servidor, que ninguém acompanha em tempo real.
--
-- A tabela não é analytics. É o mínimo para responder duas perguntas:
-- "alguém conseguiu entrar hoje?" e "o que está falhando agora?".

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),

  -- Texto livre e não enum de propósito: um tipo novo de falha precisa poder
  -- ser registrado no mesmo deploy que o descobre, sem migration no caminho.
  -- Registrar mal é melhor que não registrar.
  tipo text not null,

  -- Os dois são opcionais porque os eventos mais importantes acontecem
  -- justamente quando não há conta: o cadastro que falhou não tem empresa, e
  -- o login recusado não tem usuário.
  empresa_id uuid references public.empresas(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,

  -- Nunca guarda senha, token nem corpo de mensagem. O que serve aqui é o
  -- motivo da falha e o suficiente para reencontrar o caso.
  detalhe jsonb,

  created_at timestamptz not null default now()
);

-- A consulta do painel é sempre "os mais recentes", às vezes filtrando tipo.
create index if not exists eventos_created_at_idx
  on public.eventos (created_at desc);
create index if not exists eventos_tipo_created_at_idx
  on public.eventos (tipo, created_at desc);

alter table public.eventos enable row level security;

-- Ninguém lê pelo cliente. Quem escreve é o servidor com a service role, que
-- ignora RLS; quem lê é o painel admin, também pelo servidor. Sem policy
-- nenhuma, a tabela fica invisível para anon e para usuária logada, que é
-- exatamente o que se quer: aqui tem motivo de falha de conta alheia.

comment on table public.eventos is
  'Trilha de eventos do produto (cadastro, login, falhas). Só o servidor escreve e lê.';
