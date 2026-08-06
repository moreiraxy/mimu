-- Atualiza total_gasto/total_visitas/ultimo_atendimento sempre que uma nova
-- transação de entrada é lançada vinculada a um cliente. Isso, por sua vez,
-- dispara a trigger atualizar_cliente_fiel (que já escuta mudanças nessas
-- colunas desde 20260804120200_clientes.sql), recalculando cliente_fiel
-- automaticamente — sem precisar duplicar essa regra aqui.
--
-- Escopo: só considera INSERT de transações tipo "entrada" (o que o cliente
-- pagou à empresa). Edição/exclusão de uma transação já lançada não reajusta
-- os contadores retroativamente — não foi pedido e evita complexidade de
-- ter que decidir o que fazer com edições parciais.
create or replace function public.atualizar_estatisticas_cliente()
returns trigger
language plpgsql
as $$
begin
  if new.tipo = 'entrada' and new.cliente_id is not null then
    update public.clientes
    set
      total_gasto = total_gasto + new.valor,
      total_visitas = total_visitas + 1,
      ultimo_atendimento = greatest(coalesce(ultimo_atendimento, new.data), new.data)
    where id = new.cliente_id;
  end if;
  return new;
end;
$$;

create trigger trg_atualizar_estatisticas_cliente
  after insert on public.transacoes
  for each row
  execute function public.atualizar_estatisticas_cliente();

-- Critério de cliente_fiel passa a ser >= (antes era >), conforme
-- especificado na task do módulo de Clientes: total_visitas >= 10 ou
-- total_gasto >= 1000.
create or replace function public.atualizar_cliente_fiel()
returns trigger
language plpgsql
as $$
begin
  new.cliente_fiel := (new.total_visitas >= 10 or new.total_gasto >= 1000);
  return new;
end;
$$;
