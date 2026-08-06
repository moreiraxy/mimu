-- Recalcula clientes.frequencia_media_dias sempre que um agendamento passa a
-- (ou já entra) concluído: média das diferenças em dias entre os
-- agendamentos concluídos do cliente, do mais antigo pro mais recente.
-- Destrava os alertas "cliente sumido" (dashboard e app/api/mimu/proativo),
-- que já tinham a lógica pronta mas nunca disparavam porque essa coluna
-- nunca era escrita.

create or replace function public.atualizar_frequencia_media_cliente()
returns trigger
language plpgsql
as $$
declare
  media numeric;
begin
  if new.cliente_id is null then
    return new;
  end if;

  select avg(diferenca) into media
  from (
    select
      (data_hora::date - lag(data_hora::date) over (order by data_hora))::numeric as diferenca
    from public.agendamentos
    where cliente_id = new.cliente_id and status = 'concluido'
  ) dias_entre_atendimentos
  where diferenca is not null;

  if media is not null then
    update public.clientes
    set frequencia_media_dias = round(media)
    where id = new.cliente_id;
  end if;

  return new;
end;
$$;

-- INSERT: cobre o caso raro de um agendamento já nascer concluído.
create trigger trg_frequencia_media_insert
  after insert on public.agendamentos
  for each row
  when (new.status = 'concluido')
  execute function public.atualizar_frequencia_media_cliente();

-- UPDATE: o caso normal — agendamento passa a concluído.
create trigger trg_frequencia_media_update
  after update on public.agendamentos
  for each row
  when (new.status = 'concluido' and old.status is distinct from new.status)
  execute function public.atualizar_frequencia_media_cliente();
