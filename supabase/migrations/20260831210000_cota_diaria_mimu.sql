-- A cota diária da Mimu precisa valer no banco, e não só no tipo do TypeScript.
--
-- `auth_rate_limit.tipo` tem check constraint. Um tipo novo declarado só em
-- lib/rate-limit.ts faz o insert falhar — e falha em silêncio, porque
-- `registrarTentativa` engole o erro de propósito (rate limit não pode
-- derrubar uma resposta da Mimu). O resultado seria a cota nunca subir de
-- zero: TODA conta ficaria com o dia inteiro livre, para sempre, sem nada no
-- log dizendo isso.
--
-- É o mesmo tropeço da migration 20260830150000, e por isso o mesmo remédio.
-- A diferença é o que está do outro lado: ali era um código de vínculo, aqui é
-- a fatura da Groq crescendo com o número de contas gratuitas.
alter table public.auth_rate_limit
  drop constraint if exists auth_rate_limit_tipo_check;

alter table public.auth_rate_limit
  add constraint auth_rate_limit_tipo_check
  check (tipo in ('login', 'cadastro', 'chat_ia', 'recuperar_senha', 'whatsapp_vinculo', 'mimu_dia'));

comment on column public.auth_rate_limit.tipo is
  'Qual teto esta linha conta. ''mimu_dia'' é a cota diária de mensagens da Mimu, identificada pela EMPRESA (e não pelo usuário) porque vale somando app e WhatsApp. Os valores por plano vivem em lib/planos.ts.';

-- As contas gratuitas que já existem precisam RECEBER a assistente.
--
-- O acesso real é a interseção de duas listas: `modulos_ativos`, que é o que a
-- dona escolheu, e o teto do plano em lib/planos.ts. Abrir o teto sem mexer na
-- escolha não muda nada para quem já está aqui — e não muda porque a escolha
-- nunca aconteceu: para uma conta gratuita a Mimu não aparecia na tela de
-- módulos, então não havia como marcá-la. A lista delas diz "não quero" quando
-- na verdade diz "nunca me perguntaram".
--
-- Por isso só as gratuitas. Uma conta paga que tem 'ia' fora da lista fez uma
-- escolha de verdade, num lugar onde a opção estava visível e ligada. Ligar de
-- volta seria desfazer a decisão de outra pessoa.
update public.empresas e
set modulos_ativos = array_append(e.modulos_ativos, 'ia')
where not (e.modulos_ativos @> array['ia'])
  and exists (
    select 1
    from public.assinaturas a
    where a.empresa_id = e.id
      and a.plano = 'free'
  );
