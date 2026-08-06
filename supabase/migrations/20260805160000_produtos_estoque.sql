-- Módulo Produtos e Estoque.
-- produtos + movimentacoes_estoque (histórico e origem da verdade do saldo
-- de estoque) + fornecedores + compras/compras_itens (dar entrada em
-- estoque a partir de uma compra). Só aparece pra quem ativou "estoque" em
-- empresas.modulos_ativos (checado na aplicação, como os demais módulos).

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  descricao text,
  preco_venda numeric(12, 2),
  preco_custo numeric(12, 2),
  categoria text,
  codigo_barras text,
  quantidade_estoque integer not null default 0,
  quantidade_minima integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.produtos is 'Produtos vendidos/estocados por uma empresa.';

create index produtos_empresa_id_idx on public.produtos (empresa_id);

create trigger set_updated_at
  before update on public.produtos
  for each row
  execute function public.set_updated_at();

alter table public.produtos enable row level security;

create policy "Usuárias gerenciam produtos da própria empresa"
  on public.produtos
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Movimentações de estoque — histórico completo e única forma de mudar
-- produtos.quantidade_estoque (nunca é editada direto pela aplicação).
-- "entrada"/"saida" são deltas (sempre positivos em quantidade, o tipo
-- decide a direção); "ajuste" grava o valor absoluto correto do estoque
-- (correção manual — "na verdade tem X unidades").
create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade integer not null check (quantidade >= 0),
  motivo text,
  created_at timestamptz not null default now()
);

comment on table public.movimentacoes_estoque is 'Histórico de entradas/saídas/ajustes de estoque — fonte da verdade de produtos.quantidade_estoque.';

create index movimentacoes_estoque_empresa_id_idx on public.movimentacoes_estoque (empresa_id, created_at desc);
create index movimentacoes_estoque_produto_id_idx on public.movimentacoes_estoque (produto_id, created_at desc);

alter table public.movimentacoes_estoque enable row level security;

create policy "Usuárias gerenciam movimentações da própria empresa"
  on public.movimentacoes_estoque
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

create or replace function public.aplicar_movimentacao_estoque()
returns trigger
language plpgsql
as $$
begin
  if new.tipo = 'entrada' then
    update public.produtos
    set quantidade_estoque = quantidade_estoque + new.quantidade
    where id = new.produto_id;
  elsif new.tipo = 'saida' then
    update public.produtos
    set quantidade_estoque = greatest(0, quantidade_estoque - new.quantidade)
    where id = new.produto_id;
  elsif new.tipo = 'ajuste' then
    update public.produtos
    set quantidade_estoque = new.quantidade
    where id = new.produto_id;
  end if;
  return new;
end;
$$;

create trigger trg_aplicar_movimentacao_estoque
  after insert on public.movimentacoes_estoque
  for each row
  execute function public.aplicar_movimentacao_estoque();

-- Fornecedores

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.fornecedores is 'Fornecedores de uma empresa.';

create index fornecedores_empresa_id_idx on public.fornecedores (empresa_id);

create trigger set_updated_at
  before update on public.fornecedores
  for each row
  execute function public.set_updated_at();

alter table public.fornecedores enable row level security;

create policy "Usuárias gerenciam fornecedores da própria empresa"
  on public.fornecedores
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Compras (nota de entrada de um fornecedor) e seus itens.

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  data date not null default current_date,
  valor_total numeric(12, 2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table public.compras is 'Compras registradas de um fornecedor — cada item dá entrada automática em estoque.';

create index compras_empresa_id_idx on public.compras (empresa_id, data desc);
create index compras_fornecedor_id_idx on public.compras (fornecedor_id);

alter table public.compras enable row level security;

create policy "Usuárias gerenciam compras da própria empresa"
  on public.compras
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- compras_itens não tem empresa_id próprio — a posse é sempre checada via
-- compras.empresa_id (join obrigatório nas policies abaixo).
create table public.compras_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(12, 2) not null default 0
);

comment on table public.compras_itens is 'Itens de uma compra — cada linha gera uma entrada de estoque automaticamente.';

create index compras_itens_compra_id_idx on public.compras_itens (compra_id);
create index compras_itens_produto_id_idx on public.compras_itens (produto_id);

alter table public.compras_itens enable row level security;

create policy "Usuárias gerenciam itens de compra da própria empresa"
  on public.compras_itens
  for all
  using (
    exists (
      select 1 from public.compras c
      where c.id = compra_id and public.user_owns_empresa(c.empresa_id)
    )
  )
  with check (
    exists (
      select 1 from public.compras c
      where c.id = compra_id and public.user_owns_empresa(c.empresa_id)
    )
  );

-- Cada item de compra vira uma entrada de estoque — único ponto que precisa
-- saber que "comprar de um fornecedor" e "dar entrada manual" são a mesma
-- coisa pro saldo do produto.
create or replace function public.registrar_entrada_por_compra()
returns trigger
language plpgsql
as $$
declare
  v_empresa_id uuid;
begin
  select empresa_id into v_empresa_id from public.compras where id = new.compra_id;

  insert into public.movimentacoes_estoque (empresa_id, produto_id, tipo, quantidade, motivo)
  values (v_empresa_id, new.produto_id, 'entrada', new.quantidade, 'Compra');

  return new;
end;
$$;

create trigger trg_registrar_entrada_por_compra
  after insert on public.compras_itens
  for each row
  execute function public.registrar_entrada_por_compra();

-- Novo tipo de alerta proativo: estoque baixo.

alter table public.alertas_mimu
  drop constraint alertas_mimu_tipo_check;

alter table public.alertas_mimu
  add constraint alertas_mimu_tipo_check
  check (tipo in (
    'sem_venda',
    'agendamento_pendente',
    'conta_vencida',
    'meta_risco',
    'recorde',
    'cliente_sumiu',
    'estoque_baixo'
  ));
