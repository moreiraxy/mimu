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
