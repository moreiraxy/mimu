-- Push do aplicativo iOS entra na mesma tabela do Web Push.
--
-- Duas tabelas seria o caminho fácil e errado: quem envia um alerta quer
-- "avisar esta empresa", não "avisar os navegadores e depois os iPhones dela".
-- Com tabelas separadas, cada consumidor precisaria lembrar das duas — e o dia
-- que alguém esquecer, metade das pessoas simplesmente não recebe, sem erro.
--
-- O que muda por transporte:
--   web  -> endpoint é a URL do serviço de push do navegador, com p256dh+auth
--   apns -> endpoint é o token do aparelho, e não há par de chaves
alter table public.push_subscriptions
  add column tipo text not null default 'web'
  check (tipo in ('web', 'apns'));

-- Deixam de ser obrigatórias porque APNs não tem par de chaves. A coerência
-- volta logo abaixo, por transporte, em vez de sumir.
alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth drop not null;

-- Inscrição web SEM as chaves é inútil: o envio falharia na hora de cifrar.
-- Melhor recusar na gravação do que descobrir no alerta que não chegou.
alter table public.push_subscriptions
  add constraint push_subscriptions_web_exige_chaves
  check (tipo <> 'web' or (p256dh is not null and auth is not null));

comment on column public.push_subscriptions.tipo is
  'Transporte: web (Web Push + VAPID) ou apns (aplicativo iOS). Define como endpoint é lido.';

comment on table public.push_subscriptions is
  'Inscrições de push por dispositivo. Web Push (navegador) e APNs (app iOS) na mesma tabela.';
