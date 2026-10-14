-- O POSTO DE COMANDO: a Mimu deixa de cuidar de caixa de salão e passa a
-- cuidar do dia de quem acumula cinco frentes.
--
-- POR QUE ISTO EXISTE
--
-- O produto antigo supunha uma dona de salão que registra venda e agenda
-- cliente. Ninguém assinou. A pessoa que REALMENTE usa este sistema é sócia do
-- CRM Fortis, vende o CRM para incorporadoras, é Assistente da Gerência de
-- Vendas do Dyego, cuida do marketing da Fortis 360 e ainda é o suporte diário
-- de 44 pessoas e 33 números. O nome Mimu fica; a cabeça muda.
--
-- O QUE É DADO E O QUE É CÓDIGO
--
-- A rotina (os dez blocos das 9:30 às 18:00), as cinco frentes e os seis
-- números pelos quais ela é medida NÃO entram no banco: são a descrição do
-- cargo, vivem em lib/posto/*.ts e mudam por commit, com revisão. O que entra
-- aqui é só o que o dia produz — o que foi feito, o que ficou pendente e
-- quanto deu cada número.
--
-- POR QUE AMARRADO EM empresa_id, E NÃO EM user_id
--
-- Toda tabela deste schema pertence a uma empresa, e a RLS inteira se apoia em
-- public.user_owns_empresa(empresa_id). Inventar aqui um recorte por usuária
-- criaria uma segunda regra de isolamento para manter — e a primeira já é
-- testada (testes/isolamento-por-conta.test.ts). A conta dela é a empresa
-- dela; quando houver equipe, a coluna que falta é `responsavel_id`, não um
-- recorte novo.

-- ---------------------------------------------------------------------------
-- 1. O que ela precisa LEMBRAR
-- ---------------------------------------------------------------------------
--
-- Uma tabela só para quatro coisas que a rotina dela mistura o tempo inteiro:
-- tarefa que ela faz, cobrança que ela precisa fazer em alguém, espera por
-- resposta de outra pessoa, e assunto que depende de aprovação do gerente.
-- Separá-las em quatro tabelas seria quatro telas para a mesma pergunta — "o
-- que está em aberto?" — e é essa pergunta que a tela responde.
create table if not exists public.posto_pendencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,

  titulo text not null,
  detalhe text,

  -- Qual dos cinco cargos esta linha serve. É o que permite responder "para
  -- onde meu tempo está indo", que é a conta que o documento de funções não
  -- fecha: três das cinco frentes não existem no papel.
  frente text not null check (frente in (
    'produto',      -- 1. Sócia-fundadora e responsável pelo produto
    'comercial',    -- 2. Sócia comercial e novos negócios
    'assistencia',  -- 3. Assistente da Gerência de Vendas (equipe Dyego)
    'marketing',    -- 4. Marca Fortis 360 Capital
    'operacao'      -- 5. O que não está em lista nenhuma: suporte à operação
  )),

  tipo text not null default 'tarefa' check (tipo in (
    'tarefa',     -- ela faz
    'cobranca',   -- ela cobra alguém (SLA, documento, resposta)
    'espera',     -- ela depende de alguém e está esperando
    'aprovacao'   -- depende do Dyego: desconto, texto novo, troca de lead...
  )),

  -- De quem ela está esperando, ou a quem ela vai cobrar. Texto livre porque
  -- aqui entram 44 pessoas que não têm cadastro neste sistema.
  com_quem text,

  prazo date,
  -- Lead novo passa na frente de qualquer bloco: é regra escrita do cargo, e
  -- por isso urgência é coluna, não etiqueta.
  urgente boolean not null default false,

  status text not null default 'aberta' check (status in ('aberta', 'feita', 'descartada')),
  concluida_em timestamptz,

  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index if not exists posto_pendencias_abertas_idx
  on public.posto_pendencias (empresa_id, status, prazo);

comment on table public.posto_pendencias is
  'O que está em aberto na vida dela: tarefa, cobrança, espera por resposta e assunto que depende de aprovação do gerente. A frente diz qual dos cinco cargos consumiu o tempo.';

-- ---------------------------------------------------------------------------
-- 2. A rotina do dia, marcada
-- ---------------------------------------------------------------------------
--
-- Uma linha por bloco FEITO, e nada por bloco não feito. A ausência é a
-- resposta: às 12:05 sem linha de 'fila_12' é exatamente o que a tela precisa
-- gritar, e não dá para confundir com "ainda não chegou a hora".
--
-- `dia` é date e vem de dataDeHojeNoBrasil() — nunca de now() no servidor, que
-- roda em UTC e vira o dia às 21h de Brasília (ver lib/datas.ts).
create table if not exists public.posto_rotina_feita (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  dia date not null,
  -- A chave do bloco em lib/posto/rotina.ts. Deliberadamente SEM check
  -- constraint: a rotina é acordo entre ela e o gerente e vai mudar mais rápido
  -- que migration. Chave desconhecida pela tela é ignorada, não quebra.
  bloco text not null,
  nota text,
  feito_em timestamptz not null default now(),
  unique (empresa_id, dia, bloco)
);

comment on table public.posto_rotina_feita is
  'Quais blocos da rotina do dia já foram cumpridos. Só existe linha para bloco FEITO — a falta da linha é o pendente.';

-- ---------------------------------------------------------------------------
-- 3. Os seis números pelos quais ela é medida
-- ---------------------------------------------------------------------------
--
-- Chave + valor em vez de seis colunas, porque a lista dos indicadores é do
-- documento de funções e muda numa conversa com o gerente. Seis colunas
-- obrigariam uma migration para cada conversa dessas.
create table if not exists public.posto_numeros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  dia date not null,
  chave text not null,
  valor numeric not null,
  anotado_em timestamptz not null default now(),
  unique (empresa_id, dia, chave)
);

comment on table public.posto_numeros is
  'Os indicadores do dia (tempo até o primeiro contato, leads qualificados, SLA, resposta de disparo, reativados, e-mails pendentes). Chave e valor, porque a lista vem de acordo com o gerente e muda sem migration.';

-- ---------------------------------------------------------------------------
-- 4. O resumo que vai para o gerente às 17:45
-- ---------------------------------------------------------------------------
--
-- Guardado porque é prova de trabalho entregue: o documento de funções cobra
-- "envia o resumo do dia ao gerente" como bloco de horário, e três meses
-- depois a pergunta vira "o que eu mandei no dia tal".
create table if not exists public.posto_resumos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  dia date not null,
  texto text not null,
  enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (empresa_id, dia)
);

comment on table public.posto_resumos is
  'O resumo do dia enviado ao gerente. `enviado_em` nulo é rascunho montado pela tela e ainda não mandado.';

-- ---------------------------------------------------------------------------
-- updated_at e RLS, iguais ao resto do schema
-- ---------------------------------------------------------------------------
drop trigger if exists set_posto_pendencias_updated_at on public.posto_pendencias;
create trigger set_posto_pendencias_updated_at
  before update on public.posto_pendencias
  for each row execute function public.set_updated_at();

alter table public.posto_pendencias   enable row level security;
alter table public.posto_rotina_feita enable row level security;
alter table public.posto_numeros      enable row level security;
alter table public.posto_resumos      enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['posto_pendencias', 'posto_rotina_feita', 'posto_numeros', 'posto_resumos']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_da_empresa', t);
    execute format(
      'create policy %I on public.%I for all using (public.user_owns_empresa(empresa_id)) with check (public.user_owns_empresa(empresa_id))',
      t || '_da_empresa', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- O módulo novo entra ligado para quem já está aqui
-- ---------------------------------------------------------------------------
--
-- `modulos_ativos` não tem check constraint (ver 20260804120100), então a chave
-- nova não exige alteração de tipo no banco — só em types/index.ts.
--
-- SÓ NA CONTA DELA, e não em todas. As outras contas do banco são trial, teste
-- e a conta de demonstração da revisão da Apple (ver APP-STORE.md): nenhuma
-- delas tem cinco cargos para acompanhar, e ligar o posto ali colocaria na
-- navegação de um revisor da Apple uma tela que fala da rotina de outra pessoa.
update public.empresas e
set modulos_ativos = array_append(e.modulos_ativos, 'posto')
where not (e.modulos_ativos @> array['posto'])
  and exists (
    select 1 from auth.users u
    where u.id = e.user_id
      and u.email = 'rayssa.fortis@gmail.com'
  );

-- ---------------------------------------------------------------------------
-- As fontes de dinheiro dela, prontas para lançar
-- ---------------------------------------------------------------------------
--
-- O controle financeiro PESSOAL dela reaproveita `transacoes` e `categorias`,
-- que já existem e já têm tela, gráfico e RLS testada. O que faltava era o
-- catálogo: as categorias semeadas por `seed_categorias_padrao` são de salão
-- (Corte, Coloração, Manicure), e a pergunta dela é outra — quanto entrou do
-- CRM, quanto entrou do Dyego, quanto entrou de venda, e para onde foi.
--
-- POR QUE SÓ A CONTA DELA. Semear isto em toda empresa encheria a tela de
-- quem vende serviço com categorias que não existem no negócio dela. O recorte
-- por e-mail é feio e é proposital: deixa explícito que esta é a conta de uma
-- pessoa específica, e não uma regra do produto. Quando houver segunda conta
-- com esta cara, isto vira escolha no onboarding.
--
-- `on conflict do nothing` porque a tabela tem unique por (empresa_id, nome,
-- tipo) e esta migration pode rodar depois de ela já ter criado alguma à mão.
insert into public.categorias (empresa_id, nome, tipo)
select e.id, c.nome, c.tipo
from public.empresas e
join auth.users u on u.id = e.user_id
cross join (values
  -- Entradas: as cinco frentes que pagam, mais o que cai fora delas.
  ('CRM Fortis',          'entrada'),  -- participação/retirada do produto
  ('Salário Dyego',       'entrada'),  -- Assistente da Gerência de Vendas
  ('Comissão de venda',   'entrada'),  -- venda do CRM e indicação
  ('Fortis 360',          'entrada'),
  ('Outra entrada',       'entrada'),
  -- Saídas: o que uma operação de software e uma vida custam.
  ('Infraestrutura',      'saida'),    -- servidor, banco, domínio, e-mail
  ('Ferramentas e IA',    'saida'),
  ('Chip e telefonia',    'saida'),    -- os 33 números
  ('Impostos e taxas',    'saida'),
  ('Moradia',             'saida'),
  ('Mercado',             'saida'),
  ('Transporte',          'saida'),
  ('Saúde',               'saida'),
  ('Lazer',               'saida'),
  ('Outra saída',         'saida')
) as c(nome, tipo)
where u.email = 'rayssa.fortis@gmail.com'
on conflict do nothing;
