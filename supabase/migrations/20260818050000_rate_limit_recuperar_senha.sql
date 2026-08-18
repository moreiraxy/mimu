-- Recuperação de senha entra no controle de taxa.
--
-- Login e cadastro já tinham teto; a recuperação não tinha nenhum. Um script
-- disparava milhares de e-mails. E o estrago não é só incômodo: o SMTP hoje é
-- um Gmail, com teto de umas 500 mensagens por dia, então esgotar a cota
-- derruba junto a confirmação de cadastro de todo mundo, que é exatamente o
-- apagão de três dias de que acabamos de sair.

alter table public.auth_rate_limit
  drop constraint if exists auth_rate_limit_tipo_check;

alter table public.auth_rate_limit
  add constraint auth_rate_limit_tipo_check
  check (tipo in ('login', 'cadastro', 'chat_ia', 'recuperar_senha'));
