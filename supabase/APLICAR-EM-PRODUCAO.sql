-- ============================================================================
-- MIMU — as seis migrations pendentes, num arquivo só
-- ============================================================================
--
-- Para rodar SEM instalar nada: abra o SQL Editor do Supabase, cole este
-- arquivo inteiro e execute.
--
--   https://supabase.com/dashboard/project/yzebafhugbctcdomtxry/sql/new
--
-- TUDO OU NADA. O arquivo roda dentro de uma transação: se qualquer comando
-- falhar, o Postgres desfaz o resto sozinho e o banco fica exatamente como
-- estava. Não existe meio caminho.
--
-- O QUE ELE MEXE EM DADO DE CLIENTE: um único UPDATE, no fim da primeira
-- migration, que converte assinaturas 'vencida' para o plano gratuito. Rode a
-- conferência abaixo ANTES, para saber quantas contas isso alcança:
--
--   select status, count(*) from public.assinaturas group by status;
--
-- Se aparecer 0 em 'vencida', o UPDATE não toca em ninguém.
--
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Trava contra rodar duas vezes
-- ----------------------------------------------------------------------------
--
-- Rodar de novo já era seguro (a transação desfaz tudo), mas a mensagem era
-- "relation whatsapp_links already exists", que parece defeito e não é. Isto
-- troca por um aviso que explica.
do $ja_rodou$
begin
  if exists (
    select from pg_tables where schemaname = 'public' and tablename = 'whatsapp_links'
  ) then
    raise exception
      'Estas migrations JA foram aplicadas neste banco. Nada foi alterado.'
      using hint = 'Confira com: select tablename from pg_tables where schemaname = ''public'' and tablename in (''whatsapp_links'', ''canal_mensagens'', ''operacoes_canal'');';
  end if;
end
$ja_rodou$;



-- ==========================================================================
-- 20260829120000_plano_gratuito.sql
-- ==========================================================================

-- O plano gratuito: onde a conta pousa quando o teste acaba ou a cobrança
-- falha, em vez da parede que existia antes.
--
-- Nasceu de duas pressões que apontam para o mesmo lugar. A primeira é a App
-- Store: um app que só mostra um bloqueio para quem não paga não se sustenta
-- como produto, e a revisão da Apple avalia o que o app faz, não o que ele
-- faria se alguém pagasse. A segunda é retenção: a parede de /trial-vencido
-- transforma quem não pôde pagar naquele mês em ex-cliente, junto com todo o
-- histórico que ela já tinha registrado.
--
-- O desenho é deliberadamente conservador: o gratuito é um PLANO, não um
-- status novo. Uma conta gratuita é `status = 'ativa'` com
-- `proxima_cobranca = null`, e isso já passa em `acessoLiberado()` sem tocar
-- em uma linha de lib/assinatura.ts — `assinaturaVencida()` devolve false
-- quando não há data de cobrança. Criar um sexto status obrigaria a revisar
-- todo lugar que hoje compara com 'ativa'.

alter table public.assinaturas
  drop constraint if exists assinaturas_plano_check;

alter table public.assinaturas
  add constraint assinaturas_plano_check
  check (plano in ('free', 'basico', 'completo', 'pro', 'premium'));

comment on column public.assinaturas.plano is
  'O que a conta tem direito de usar. ''free'' é o plano gratuito permanente: status ''ativa'' e proxima_cobranca nula. Os pagos e seus preços vivem em lib/planos.ts.';

-- As contas que já estavam vencidas passam para o gratuito.
--
-- Sem isto elas ficariam presas: `assinaturaVencida()` só olha para quem está
-- 'ativa' e `trialVencido()` só para quem está 'trial', então uma linha já
-- marcada 'vencida' nunca mais passa pelo caminho que rebaixa para o
-- gratuito. Ela seguiria sendo redirecionada para /assinar para sempre, e o
-- plano gratuito simplesmente não existiria para quem mais precisa dele.
--
-- 'cancelada' fica de fora de propósito. Vencimento é uma data que passou;
-- cancelamento é uma decisão, e o painel admin também usa esse estado para
-- caso de estorno e contestação. Devolver acesso a essas contas em massa, sem
-- olhar uma a uma, é diferente de devolver a quem só deixou o mês virar.
update public.assinaturas
set
  plano = 'free',
  status = 'ativa',
  proxima_cobranca = null,
  valor_mensal = 0
where status = 'vencida';


-- ==========================================================================
-- 20260830100000_origem_apple.sql
-- ==========================================================================

-- A Apple entra como terceira origem de cobrança.
--
-- A Mimu passa a vender pelos dois lados: na web pelo Mercado Pago, e dentro
-- do app iOS pelo In-App Purchase, porque a diretriz 3.1.1 exige que
-- assinatura digital consumida no app passe pela Apple. Quem comprou pela
-- Apple só cancela na Apple — é por esta coluna que a tela sabe para onde
-- mandar a pessoa, em vez de oferecer um cancelamento que não funcionaria.
--
-- As DUAS tabelas de uma vez, e é o ponto todo deste arquivo. A migration
-- 20260826150000 existe justamente porque a anterior liberou 'manual' só em
-- `pagamentos` e esqueceu `assinaturas`: a venda criava a conta, registrava o
-- pagamento e falhava ao ativar a assinatura — a pessoa passava a existir sem
-- acesso. Repetir esse erro aqui daria o mesmo sintoma, com quem acabou de
-- pagar na App Store.

alter table public.pagamentos drop constraint if exists pagamentos_origem_check;
alter table public.pagamentos add constraint pagamentos_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual', 'apple'));

alter table public.assinaturas drop constraint if exists assinaturas_origem_check;
alter table public.assinaturas add constraint assinaturas_origem_check
  check (origem in ('mercadopago', 'cakto', 'manual', 'apple'));

-- O identificador que a Apple usa para a assinatura ao longo de toda a vida
-- dela, atravessando renovações. É por ele que a notificação de renovação, de
-- cancelamento e de reembolso encontra a linha aqui — o mesmo papel que
-- `mp_subscription_id` tem no Mercado Pago.
alter table public.assinaturas
  add column if not exists apple_original_transaction_id text;

comment on column public.assinaturas.apple_original_transaction_id is
  'originalTransactionId do StoreKit: estável entre renovações. Por onde as App Store Server Notifications encontram esta assinatura.';

-- Único pelo mesmo motivo do índice equivalente da Cakto: a notificação chega
-- com o id na mão e precisa achar a linha rápido, e uma notificação reenviada
-- não pode virar duas assinaturas.
create unique index if not exists assinaturas_apple_original_transaction_idx
  on public.assinaturas (apple_original_transaction_id)
  where apple_original_transaction_id is not null;

alter table public.pagamentos
  add column if not exists apple_transaction_id text;

comment on column public.pagamentos.apple_transaction_id is
  'transactionId da cobrança na App Store. Mesmo papel que mp_payment_id e cakto_payment_id.';

create unique index if not exists pagamentos_apple_transaction_id_idx
  on public.pagamentos (apple_transaction_id)
  where apple_transaction_id is not null;


-- ==========================================================================
-- 20260830140000_whatsapp_links.sql
-- ==========================================================================

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


-- ==========================================================================
-- 20260830150000_rate_limit_whatsapp.sql
-- ==========================================================================

-- O rate limit do vínculo do WhatsApp precisa valer no banco, e não só no tipo
-- do TypeScript.
--
-- `auth_rate_limit.tipo` tem check constraint, e acrescentar o valor novo só
-- em lib/rate-limit.ts fazia o insert falhar. O jeito como falhava é o
-- problema: `registrarTentativa` engole o erro e segue (de propósito — rate
-- limit não pode derrubar um login), então o teto simplesmente não existia e
-- nada avisava. A confirmação de vínculo passaria a aceitar tentativas
-- infinitas, que é justamente o que torna viável chutar um código de 6
-- caracteres.
--
-- Pego pelo teste de isolamento, não por leitura do código.
alter table public.auth_rate_limit
  drop constraint if exists auth_rate_limit_tipo_check;

alter table public.auth_rate_limit
  add constraint auth_rate_limit_tipo_check
  check (tipo in ('login', 'cadastro', 'chat_ia', 'recuperar_senha', 'whatsapp_vinculo'));


-- ==========================================================================
-- 20260830160000_canal_mensagens.sql
-- ==========================================================================

-- Toda mensagem que chega por um canal de fora do app.
--
-- Serve a duas exigências de uma vez, e por isso é uma tabela só:
--
-- IDEMPOTÊNCIA (4.3). O WhatsApp reentrega mensagem quando não recebe
-- confirmação a tempo. Sem uma marca de "esta já passou por aqui", a mesma
-- venda entraria duas vezes, o relatório do mês sairia errado e a pessoa
-- perderia a confiança no canal — que é o ativo mais difícil de recuperar num
-- produto de gestão.
--
-- LOG DE INTERAÇÃO (4.7). Sem registro não há como investigar "a Mimu não me
-- respondeu ontem" nem medir se o canal está de pé.
--
-- O TELEFONE ENTRA MASCARADO, e nunca inteiro. O número completo já vive em
-- `whatsapp_links`, onde é necessário para descobrir de quem é a mensagem.
-- Aqui ele seria só conveniência de depuração, e log é o lugar que mais
-- vaza: vai para console, para ferramenta de erro, para captura de tela em
-- conversa de suporte.
--
-- O CONTEÚDO DA MENSAGEM NÃO ENTRA. É a conversa de negócio de alguém, e
-- registrar aqui duplicaria em texto plano o que já está em `conversas_mimu`
-- com RLS.

create table public.canal_mensagens (
  id uuid primary key default gen_random_uuid(),

  -- Qual canal. Existe desde já com um valor só porque o adaptador é plugável
  -- por desenho: quando a API oficial da Meta entrar no lugar do Baileys, ou
  -- quando surgir outro canal, esta coluna é o que separa os históricos.
  canal text not null check (canal in ('whatsapp')),

  -- O id que o canal deu à mensagem. É a chave de idempotência.
  mensagem_id text not null,

  -- Ex.: 5511*****89. Ver o comentário do cabeçalho.
  remetente_mascarado text not null,

  -- Nulo quando o número não está vinculado a conta nenhuma — que é
  -- justamente o caso que mais interessa acompanhar, para saber quantas
  -- pessoas tentaram usar o canal sem ter conectado.
  empresa_id uuid references public.empresas (id) on delete set null,

  recebida_em timestamptz not null,
  processada_em timestamptz,

  -- Em que deu. Sem isto o log responde "chegou" mas não "funcionou".
  resultado text check (
    resultado in ('respondida', 'nao_vinculada', 'ignorada', 'falhou')
  ),

  created_at timestamptz not null default now()
);

comment on table public.canal_mensagens is
  'Mensagens recebidas por canais de fora do app (hoje WhatsApp). Serve de trava de idempotência e de log operacional. Telefone mascarado, conteúdo nunca gravado.';

-- A trava de idempotência propriamente dita.
--
-- É o índice ÚNICO que garante, e não a checagem antes de inserir: entre ler
-- e escrever cabe uma segunda entrega da mesma mensagem, e duas checagens
-- simultâneas passariam as duas. Aqui o banco recusa a segunda.
create unique index canal_mensagens_idempotencia_idx
  on public.canal_mensagens (canal, mensagem_id);

create index canal_mensagens_empresa_idx
  on public.canal_mensagens (empresa_id, recebida_em desc);

alter table public.canal_mensagens enable row level security;

-- Sem policy nenhuma, de propósito: RLS ligado e nenhuma regra significa que
-- só a service role alcança. É dado operacional do sistema, não dado da
-- cliente — e negar por padrão custa nada aqui.


-- ==========================================================================
-- 20260830170000_reversao_de_operacoes.sql
-- ==========================================================================

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


-- ============================================================================
-- Registra as migrations como aplicadas
-- ============================================================================
--
-- O Supabase guarda em `supabase_migrations.schema_migrations` quais já
-- rodaram. Aplicando pelo SQL Editor, essa tabela não fica sabendo — e um
-- `supabase db push` no futuro tentaria aplicar tudo de novo, quebrando em
-- "already exists".
--
-- `on conflict do nothing` para poder rodar este arquivo duas vezes sem erro.

insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260829120000', 'plano_gratuito'),
  ('20260830100000', 'origem_apple'),
  ('20260830140000', 'whatsapp_links'),
  ('20260830150000', 'rate_limit_whatsapp'),
  ('20260830160000', 'canal_mensagens'),
  ('20260830170000', 'reversao_de_operacoes')
on conflict (version) do nothing;

commit;

-- ============================================================================
-- Conferência — rode DEPOIS, separado
-- ============================================================================
--
-- select tablename from pg_tables
--  where schemaname = 'public'
--    and tablename in ('whatsapp_links', 'canal_mensagens', 'operacoes_canal');
--   -> tem que devolver as três
--
-- select pg_get_constraintdef(oid) from pg_constraint
--  where conname = 'assinaturas_plano_check';
--   -> tem que incluir 'free'
--
-- select policyname, cmd from pg_policies where tablename = 'transacoes';
--   -> tem que ter quatro linhas (SELECT, INSERT, UPDATE, DELETE)
