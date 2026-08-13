-- Estende o rate limit pra cobrir o chat da Mimu.
--
-- Motivo: /api/mimu/chat dispara DUAS chamadas ao Groq por mensagem
-- (classificação de intenção + resposta). A rota exigia sessão, mas não
-- tinha nenhum limite de frequência — uma usuária logada podia repetir em
-- laço e consumir a cota da API sem teto. O limite de login/cadastro já
-- existia (lib/rate-limit.ts) e só faltava aceitar este tipo.
--
-- Os valores existentes ficam intactos; a checagem só ganha mais um caso.

alter table public.auth_rate_limit
  drop constraint if exists auth_rate_limit_tipo_check;

alter table public.auth_rate_limit
  add constraint auth_rate_limit_tipo_check
  check (tipo in ('login', 'cadastro', 'chat_ia'));

comment on table public.auth_rate_limit is
  'Tentativas de login/cadastro (por e-mail ou IP) e mensagens do chat da Mimu (por usuária), pra impor limite por hora. Só acessível via service role.';
