-- O vínculo entre um número de WhatsApp e uma conta da Mimu.
--
-- A Mimu passa a atender pelo WhatsApp, e a pergunta que esta tabela responde
-- é a única que importa: de quem é este número que acabou de mandar mensagem?
-- Errar isso é mostrar o faturamento de uma cliente para outra.
--
-- POR QUE NÃO BASTA O NÚMERO. Número de telefone não é identidade: chip é
-- clonado, celular é roubado, e operadora recicla número desativado depois de
-- alguns meses — quem receber o número antigo de uma cliente herdaria o acesso
-- ao negócio dela. Por isso o vínculo SEMPRE nasce de dentro do app, com
-- sessão autenticada, e o WhatsApp só confirma o que já foi pedido de lá.
--
-- O fluxo, e a razão de cada metade:
--   1. Dentro do app, com sessão, a pessoa pede para conectar → nasce a linha
--      aqui com um código e um prazo, e SEM telefone (ainda não sabemos qual é)
--   2. Ela manda o código para o número da Mimu
--   3. O backend casa código + número, grava o telefone e marca verificado_em
--
-- O passo 3 é o único do produto inteiro que roda sem sessão, porque não pode
-- ter: quem manda a mensagem não tem cookie nenhum. É por isso que ele é
-- estreito de propósito — casa um código e grava um telefone, mais nada.

create table public.whatsapp_links (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  -- Guardado além da empresa porque é ele que vira `auth.uid()` na hora de
  -- responder: o handler do WhatsApp monta um client com a identidade desta
  -- pessoa, e é assim que o RLS continua valendo num canal sem login.
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Nulo até o passo 3. No passo 1 ninguém sabe qual número a pessoa vai usar,
  -- e pedir para ela digitar seria uma chance a mais de erro de digitação
  -- virar vínculo com o número errado.
  telefone text,

  -- Só dígitos, com DDI. Normalizado na aplicação antes de gravar: o WhatsApp
  -- entrega em formatos diferentes conforme o aparelho, e comparar formatos
  -- diferentes é não achar o vínculo que existe.
  codigo text not null,
  codigo_expira_em timestamptz not null,

  verificado_em timestamptz,
  -- Revogação é lógica, nunca delete: precisa continuar existindo o registro
  -- de que aquele número teve acesso, e até quando.
  revogado_em timestamptz,
  created_at timestamptz not null default now(),
  -- Existe porque a trigger set_updated_at() abaixo escreve nela. Sem a
  -- coluna, TODO update na tabela falha com "record new has no field
  -- updated_at" — o que quebrava a confirmação do vínculo inteira.
  updated_at timestamptz not null default now()
);

comment on table public.whatsapp_links is
  'Vínculo entre número de WhatsApp e conta. Criado de dentro do app (com sessão) e confirmado por código enviado ao número da Mimu.';

-- Um número ativo pertence a UMA conta, e o banco garante.
--
-- Sem este índice, dois vínculos verificados para o mesmo telefone fariam a
-- busca devolver um dos dois — e qual, ninguém controla. Na prática seria uma
-- pessoa vendo o negócio da outra, de forma intermitente, que é o defeito mais
-- difícil de reproduzir e o mais caro de descobrir.
create unique index whatsapp_links_telefone_ativo_idx
  on public.whatsapp_links (telefone)
  where telefone is not null and verificado_em is not null and revogado_em is null;

-- Código pendente é único enquanto vale. Dois pendentes iguais fariam o passo
-- 3 casar com a conta errada.
create unique index whatsapp_links_codigo_pendente_idx
  on public.whatsapp_links (codigo)
  where verificado_em is null and revogado_em is null;

create index whatsapp_links_empresa_idx on public.whatsapp_links (empresa_id);

create trigger set_updated_at_whatsapp_links
  before update on public.whatsapp_links
  for each row
  execute function public.set_updated_at();

alter table public.whatsapp_links enable row level security;

-- Mesma forma das outras tabelas: a pessoa enxerga o que é da empresa dela.
-- Serve para a tela de "conectar WhatsApp" mostrar o estado e permitir revogar.
create policy "Usuárias veem os vínculos da própria empresa"
  on public.whatsapp_links
  for select
  using (public.user_owns_empresa(empresa_id));

-- Criar o pedido de vínculo exige sessão, e é o ponto todo: é isto que impede
-- alguém de vincular um número sem provar antes que é dono da conta.
create policy "Usuárias criam vínculo da própria empresa"
  on public.whatsapp_links
  for insert
  with check (public.user_owns_empresa(empresa_id));

-- Revogar também. Update só do que é da própria empresa.
create policy "Usuárias revogam vínculo da própria empresa"
  on public.whatsapp_links
  for update
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Não há policy de DELETE de propósito: revogação é lógica. O histórico de
-- quem teve acesso ao negócio não pode ser apagável por quem usa o app.
