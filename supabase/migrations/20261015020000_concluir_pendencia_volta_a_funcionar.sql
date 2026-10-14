-- Concluir pendência estava QUEBRADO desde que a tabela nasceu.
--
-- O SINTOMA, nas palavras dela: "agr as notas em aberto n estão funcionando
-- ta, n to conseguindo concluir tarefas aq!!". Tocar no check não fazia nada:
-- o item saía da tela por um instante (atualização otimista) e voltava.
--
-- A CAUSA. A migration 20261014190000 pendurou em posto_pendencias o gatilho
-- genérico do projeto:
--
--     create trigger set_posto_pendencias_updated_at
--       before update on public.posto_pendencias
--       for each row execute function public.set_updated_at();
--
-- E `public.set_updated_at()` faz exatamente uma coisa: `new.updated_at =
-- now()`. Só que esta tabela não tem `updated_at` — ela tem `atualizada_em`,
-- porque eu nomeei as colunas dela em português. Então TODO update morria com
--
--     42703: record "new" has no field "updated_at"
--
-- Insert funcionava (o gatilho é `before update`), e foi por isso que o defeito
-- passou: criar pendência pela tela e pelo chat funcionava, e a conclusão é o
-- gesto que ninguém testa ao escrever a tela.
--
-- POR QUE UMA FUNÇÃO NOVA, e não renomear a coluna: renomear arrastaria
-- types/database.ts, o hook, o prompt da assistente e os testes — e deixaria
-- `criada_em` em português ao lado de um `updated_at` em inglês na mesma
-- tabela. A função dedicada custa cinco linhas e é honesta sobre o que faz.
--
-- A LIÇÃO, que vale para a próxima tabela deste schema: o gatilho genérico só
-- serve a tabela com coluna chamada `updated_at`. Tabela com nome em português
-- usa esta função.

create or replace function public.set_atualizada_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

comment on function public.set_atualizada_em() is
  'Irmã de set_updated_at() para as tabelas cujas colunas têm nome em português (posto_*). Pendurar set_updated_at() nelas faz TODO update falhar com 42703.';

drop trigger if exists set_posto_pendencias_updated_at on public.posto_pendencias;

create trigger set_posto_pendencias_atualizada_em
  before update on public.posto_pendencias
  for each row execute function public.set_atualizada_em();
