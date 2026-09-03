-- A Cakto sai do banco.
--
-- A plataforma deixou de ser usada em 03/09/2026 e o código dela já saiu: não
-- há webhook, não há link de checkout, nada escreve 'cakto' em lugar nenhum.
-- O que resta aqui é o banco ainda ACEITAR o valor — e enquanto ele aceita, o
-- código precisa continuar tratando um caso que não acontece mais.
--
-- NÃO CONFIO NUMA CONTAGEM MINHA PARA APAGAR COLUNA. Conferi que a tabela de
-- pagamentos está vazia, mas conferência feita fora da transação é conferência
-- de um instante anterior. Por isso o bloco abaixo levanta exceção se achar
-- qualquer dado da Cakto: numa transação, isso desfaz tudo e o banco fica como
-- estava. Se um dia esta migration falhar aqui, é porque existia dado que eu
-- não vi — e aí a decisão é de gente, não deste arquivo.

begin;

do $tem_dado$
begin
  if exists (
    select 1 from public.pagamentos
     where cakto_payment_id is not null
        or cakto_status is not null
  ) then
    raise exception
      'Existem pagamentos com dados da Cakto. Esta migration apagaria essas colunas.'
      using hint = 'Exporte esses registros antes, ou remova apenas o valor do check constraint.';
  end if;

  if exists (select 1 from public.assinaturas where origem = 'cakto') then
    raise exception 'Existem assinaturas com origem cakto.';
  end if;

  if exists (select 1 from public.pagamentos where origem = 'cakto') then
    raise exception 'Existem pagamentos com origem cakto.';
  end if;
end
$tem_dado$;

-- As colunas que só a Cakto preenchia.
alter table public.pagamentos drop column if exists cakto_payment_id;
alter table public.pagamentos drop column if exists cakto_status;

-- E o valor deixa de ser aceito. A partir daqui, 'cakto' não entra nem por
-- engano nem por código antigo que tenha ficado em algum lugar.
alter table public.pagamentos drop constraint if exists pagamentos_origem_check;
alter table public.pagamentos add constraint pagamentos_origem_check
  check (origem in ('mercadopago', 'manual', 'apple'));

alter table public.assinaturas drop constraint if exists assinaturas_origem_check;
alter table public.assinaturas add constraint assinaturas_origem_check
  check (origem in ('mercadopago', 'manual', 'apple'));

commit;
