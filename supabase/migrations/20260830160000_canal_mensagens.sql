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
