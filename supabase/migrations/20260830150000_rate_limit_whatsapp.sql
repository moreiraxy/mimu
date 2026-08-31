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
