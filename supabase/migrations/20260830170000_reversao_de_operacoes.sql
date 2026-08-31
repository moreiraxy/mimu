-- Escrita pelo WhatsApp que dá para desfazer.
--
-- A Mimu passa a registrar venda, despesa e agendamento por mensagem. O
-- desenho do brief é gravar primeiro e oferecer a saída depois — pedir
-- confirmação antes dobra o número de mensagens e irrita quem está com a mão
-- na massa. O preço desse desenho é que a saída tem que existir de verdade.
--
-- POR QUE REVERSÃO LÓGICA, E NÃO DELETE. Um delete apaga a prova de que a
-- linha existiu. Se a pessoa desfizer por engano, ou se a gente errar o que
-- interpretou, não há de onde voltar. Com `revertida_em` a linha continua lá,
-- fora das contas, e recuperável.
--
-- POR QUE O FILTRO VAI NA POLICY, E NÃO NAS CONSULTAS. São 20 pontos de
-- leitura de `transacoes` e 10 arquivos lendo `agendamentos`. Exigir que cada
-- um lembre de `where revertida_em is null` significa que um dia alguém
-- esquece — e o sintoma seria uma venda desfeita continuar somando no
-- faturamento do mês, sem erro e sem log, descoberto no fechamento. Colocando
-- na policy de SELECT, o banco filtra para TODA consulta que existe hoje e
-- para toda que alguém escrever amanhã.

alter table public.transacoes
  add column if not exists revertida_em timestamptz;

alter table public.agendamentos
  add column if not exists revertida_em timestamptz;

comment on column public.transacoes.revertida_em is
  'Quando foi desfeita. Preenchida = fora de todas as contas, mas recuperável. O filtro é feito pela policy de SELECT, não pelas consultas.';

-- As policies eram uma só, `for all`, com o mesmo `using` valendo para leitura
-- e escrita. Precisam se separar: o SELECT esconde o revertido, mas o UPDATE
-- precisa PODER marcar `revertida_em` — com a condição no `with check`, o
-- próprio ato de desfazer seria recusado.
drop policy if exists "Usuárias gerenciam transações da própria empresa" on public.transacoes;

create policy "Usuárias leem transações não revertidas"
  on public.transacoes for select
  using (public.user_owns_empresa(empresa_id) and revertida_em is null);

create policy "Usuárias inserem transações da própria empresa"
  on public.transacoes for insert
  with check (public.user_owns_empresa(empresa_id));

create policy "Usuárias alteram transações da própria empresa"
  on public.transacoes for update
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

create policy "Usuárias excluem transações da própria empresa"
  on public.transacoes for delete
  using (public.user_owns_empresa(empresa_id));

drop policy if exists "Usuárias gerenciam agendamentos da própria empresa" on public.agendamentos;

create policy "Usuárias leem agendamentos não revertidos"
  on public.agendamentos for select
  using (public.user_owns_empresa(empresa_id) and revertida_em is null);

create policy "Usuárias inserem agendamentos da própria empresa"
  on public.agendamentos for insert
  with check (public.user_owns_empresa(empresa_id));

create policy "Usuárias alteram agendamentos da própria empresa"
  on public.agendamentos for update
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

create policy "Usuárias excluem agendamentos da própria empresa"
  on public.agendamentos for delete
  using (public.user_owns_empresa(empresa_id));

-- O registro do que foi escrito por mensagem, e do que dá para desfazer.
create table public.operacoes_canal (
  id uuid primary key default gen_random_uuid(),
  canal text not null check (canal in ('whatsapp')),
  empresa_id uuid not null references public.empresas (id) on delete cascade,

  -- Qual mensagem gerou. Liga o que foi gravado à conversa que causou, que é
  -- o que permite responder "o que você registrou ontem às 14h?".
  mensagem_id text not null,

  tipo text not null check (tipo in ('entrada', 'saida', 'agendamento')),
  tabela text not null check (tabela in ('transacoes', 'agendamentos')),
  registro_id uuid not null,

  -- O recibo exato que foi enviado. Guardado em vez de remontado: se um dia a
  -- gente mudar como escreve o recibo, o histórico continua contando o que a
  -- pessoa realmente leu — e é sobre isso que ela vai reclamar.
  recibo text not null,

  /*
   * Até quando dá para desfazer.
   *
   * 24 horas. Curto o bastante para "desfazer" nunca alcançar a semana
   * passada, e longo o bastante para pegar o erro que a pessoa só nota à
   * noite, fechando o caixa do dia.
   */
  desfazivel_ate timestamptz not null default (now() + interval '24 hours'),
  desfeita_em timestamptz,

  created_at timestamptz not null default now()
);

comment on table public.operacoes_canal is
  'Escritas feitas por canal de fora do app, com janela de reversão. É daqui que "desfazer" sabe o que desfazer.';

-- O "desfazer" busca a última operação ainda dentro da janela desta empresa.
create index operacoes_canal_desfazer_idx
  on public.operacoes_canal (empresa_id, created_at desc)
  where desfeita_em is null;

alter table public.operacoes_canal enable row level security;

-- A dona vê o que foi escrito em nome dela.
create policy "Usuárias veem as operações da própria empresa"
  on public.operacoes_canal for select
  using (public.user_owns_empresa(empresa_id));

/*
 * E o registro é gravado com a identidade dela, não com service role.
 *
 * Faltava esta policy, e o efeito era o pior possível: a venda entrava e a
 * anotação da operação era recusada — ou seja, gravava SEM saída de reversão,
 * que é exatamente a metade que não pode faltar no desenho "grava primeiro,
 * oferece a saída depois".
 *
 * Podia ser resolvido usando service role aqui, mas isso desligaria o RLS num
 * caminho de escrita. Manter tudo sob a identidade da pessoa é o que faz o
 * isolamento continuar sendo garantido pelo banco.
 */
create policy "Usuárias registram operações da própria empresa"
  on public.operacoes_canal for insert
  with check (public.user_owns_empresa(empresa_id));

-- Marcar como desfeita também é escrita da dona.
create policy "Usuárias marcam operações da própria empresa"
  on public.operacoes_canal for update
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

/*
 * Desfazer, como função do banco.
 *
 * PRECISA SER ASSIM por um detalhe do Postgres que só aparece testando: numa
 * tabela com RLS, o `USING` da policy de SELECT também é aplicado à LINHA NOVA
 * de um UPDATE. Como a nossa policy de leitura esconde o que tem
 * `revertida_em` preenchida, o ato de preencher esse campo tornava a linha
 * invisível — e o Postgres recusava o próprio update com "new row violates
 * row-level security policy". A dona não conseguia desfazer o que era dela.
 *
 * As saídas seriam três, e duas são ruins. Tirar o filtro da policy devolveria
 * a responsabilidade para as 20 consultas que leem `transacoes`, e uma delas
 * um dia esqueceria. Fazer a reversão com service role desligaria o RLS num
 * caminho de escrita.
 *
 * Esta é a terceira: `security definer` roda como dona do schema, então passa
 * pela policy — mas a checagem de quem está pedindo continua existindo, aqui
 * dentro, explícita, na mesma função `user_owns_empresa` que as policies usam.
 * A autorização não sumiu; ela saiu da policy e virou a primeira linha da
 * consulta.
 *
 * De quebra, as duas escritas viram uma transação só: não existe mais o estado
 * intermediário em que a venda foi revertida mas a operação não foi marcada.
 */
create or replace function public.desfazer_operacao_canal(p_operacao_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_op public.operacoes_canal;
begin
  select * into v_op
  from public.operacoes_canal
  where id = p_operacao_id
    -- A checagem de dono. Sem esta linha, qualquer pessoa autenticada
    -- desfaria a operação de qualquer empresa passando o id.
    and public.user_owns_empresa(empresa_id)
    and desfeita_em is null
    and desfazivel_ate > now();

  if not found then
    return false;
  end if;

  if v_op.tabela = 'transacoes' then
    update public.transacoes set revertida_em = now() where id = v_op.registro_id;
  else
    update public.agendamentos set revertida_em = now() where id = v_op.registro_id;
  end if;

  update public.operacoes_canal set desfeita_em = now() where id = v_op.id;
  return true;
end;
$$;

revoke all on function public.desfazer_operacao_canal(uuid) from public, anon;
grant execute on function public.desfazer_operacao_canal(uuid) to authenticated;

comment on function public.desfazer_operacao_canal(uuid) is
  'Desfaz uma operação escrita por canal externo. SECURITY DEFINER porque a policy de SELECT esconde linhas revertidas e isso impediria o próprio UPDATE; a checagem de dono é feita dentro da função.';
