-- De onde veio cada mensagem da conversa com a Mimu.
--
-- O histórico do chat mistura, na mesma linha do tempo, o que foi digitado no
-- app e o que foi mandado pelo WhatsApp — e é assim que tem que ser: é a mesma
-- Mimu, com a mesma memória, e quem manda "quanto vendi hoje?" pelo WhatsApp
-- de manhã quer que a Mimu do app saiba disso à tarde.
--
-- O que faltava era PODER DIZER de onde cada mensagem veio. Sem isso, a tela de
-- conversas recentes só consegue mostrar uma lista sem origem, e a pessoa não
-- reconhece a própria conversa: ela lembra de ter falado no WhatsApp, não de
-- ter falado "com a Mimu".
--
-- `default 'app'` cobre tudo que já existe. Antes desta coluna o único canal
-- que gravava aqui pelo app era o app, e o WhatsApp entrou depois — chutar
-- 'app' para o histórico antigo erra pouco e nunca deixa a coluna nula.
alter table public.conversas_mimu
  add column if not exists canal text not null default 'app'
  check (canal in ('app', 'whatsapp'));

comment on column public.conversas_mimu.canal is
  'Por onde a mensagem passou. Serve à tela de conversas recentes; a Mimu lê o histórico inteiro independente do canal.';

-- O índice existente é (empresa_id, created_at), que já serve à leitura da
-- conversa. Este serve à lista de conversas recentes agrupada por canal, que é
-- uma consulta diferente e roda numa tela que a pessoa abre com pressa.
create index if not exists conversas_mimu_canal_idx
  on public.conversas_mimu (empresa_id, canal, created_at desc);
