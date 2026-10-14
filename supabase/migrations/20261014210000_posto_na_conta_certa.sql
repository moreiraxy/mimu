-- O Posto de Comando foi ligado na conta ERRADA. Esta migration conserta.
--
-- O QUE ACONTECEU
--
-- A migration 20261014190000 recortou a conta dela por
-- `auth.users.email = 'rayssa.fortis@gmail.com'`. Esse é o e-mail com que ela
-- ASSINA OS COMMITS deste repositório — não é o e-mail com que ela ENTRA no
-- aplicativo. A conta do app é a empresa "Mimu", de
-- `rayssasan.moreira@gmail.com`, que era a única com login no mesmo dia.
--
-- O e-mail do Git acertou uma conta que existe de verdade ("Imobiliária", sem
-- login desde 28/08/2026), e por isso nada falhou: a migration rodou, o update
-- encontrou uma linha, e o sintoma foi a tela não mudar nada para ela. Erro que
-- acerta um alvo errado não dá erro em lugar nenhum.
--
-- A LIÇÃO, para a próxima vez que uma migration precisar apontar para uma
-- pessoa: o e-mail do commit e o e-mail do login são dados diferentes, de
-- sistemas diferentes. Quando os dois existem, quem decide é `last_sign_in_at`.
--
-- Recortar conta por e-mail dentro de migration continua sendo feio, e continua
-- proposital: deixa explícito que isto é a conta de UMA pessoa e não uma regra
-- do produto. Quando houver segunda conta com esta cara, vira escolha de
-- onboarding, como os outros quatro módulos.

-- ---------------------------------------------------------------------------
-- 1. Ligar o módulo na conta certa
-- ---------------------------------------------------------------------------
update public.empresas e
set modulos_ativos = array_append(e.modulos_ativos, 'posto')
where not (e.modulos_ativos @> array['posto'])
  and exists (
    select 1 from auth.users u
    where u.id = e.user_id
      and u.email = 'rayssasan.moreira@gmail.com'
  );

-- ---------------------------------------------------------------------------
-- 2. Desligar da conta que recebeu por engano
-- ---------------------------------------------------------------------------
--
-- A conta "Imobiliária" é dela também, e justamente por isso o módulo sai: ela
-- não trabalha ali desde agosto, e um posto de comando numa conta abandonada é
-- uma segunda rotina para marcar, com os mesmos cinco cargos, competindo com a
-- de verdade.
update public.empresas e
set modulos_ativos = array_remove(e.modulos_ativos, 'posto')
where e.modulos_ativos @> array['posto']
  and exists (
    select 1 from auth.users u
    where u.id = e.user_id
      and u.email = 'rayssa.fortis@gmail.com'
  );

-- ---------------------------------------------------------------------------
-- 3. As fontes de dinheiro, na conta onde ela lança
-- ---------------------------------------------------------------------------
--
-- Mesmo catálogo da 20261014190000, agora no lugar certo. As categorias que
-- foram para a "Imobiliária" FICAM onde estão: categoria não atrapalha ninguém
-- numa conta sem uso, e apagar linha que uma pessoa pode ter começado a usar é
-- pior que deixar sobrando.
insert into public.categorias (empresa_id, nome, tipo)
select e.id, c.nome, c.tipo
from public.empresas e
join auth.users u on u.id = e.user_id
cross join (values
  ('CRM Fortis',          'entrada'),
  ('Salário Dyego',       'entrada'),
  ('Comissão de venda',   'entrada'),
  ('Fortis 360',          'entrada'),
  ('Outra entrada',       'entrada'),
  ('Infraestrutura',      'saida'),
  ('Ferramentas e IA',    'saida'),
  ('Chip e telefonia',    'saida'),
  ('Impostos e taxas',    'saida'),
  ('Moradia',             'saida'),
  ('Mercado',             'saida'),
  ('Transporte',          'saida'),
  ('Saúde',               'saida'),
  ('Lazer',               'saida'),
  ('Outra saída',         'saida')
) as c(nome, tipo)
where u.email = 'rayssasan.moreira@gmail.com'
on conflict do nothing;
