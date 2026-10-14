-- "tira tudo que não faz parte do meu posto" — palavras dela, 14/10/2026.
--
-- A conta dela carregava os cinco módulos do produto antigo. Produtos, estoque,
-- compras e fornecedores são de salão e mercearia: ela não tem estoque nenhum,
-- e cada um deles é um item no menu e um atalho no painel disputando espaço com
-- o que ela usa de verdade.
--
-- O QUE SAI: 'estoque' (as quatro telas acima).
--
-- O QUE FICA, e por quê:
--   financeiro — é o controle das finanças pessoais dela, que ela pediu
--   agenda     — o calendário, que ela pediu de volta duas vezes no mesmo dia
--   clientes   — NÃO sai, e isso é decisão com motivo: a agenda guarda com quem
--                é o compromisso, e a tela de novo agendamento busca por
--                cliente. Desligar 'clientes' deixaria o campo "com quem"
--                apontando para uma rota que o middleware rebate. Se ela quiser
--                fora, o caminho é tirar o campo primeiro, não o módulo.
--   ia         — a Mimu
--   posto      — o posto de comando
--
-- NADA É APAGADO. Os 2 clientes, 2 produtos, 7 agendamentos e 26 transações da
-- conta continuam no banco: desligar módulo esconde a tela, não destrói
-- histórico. Religar em Minha Empresa → Módulos devolve tudo como estava.

update public.empresas e
set modulos_ativos = array_remove(e.modulos_ativos, 'estoque')
where e.modulos_ativos @> array['estoque']
  and exists (
    select 1 from auth.users u
    where u.id = e.user_id
      and u.email = 'rayssasan.moreira@gmail.com'
  );
