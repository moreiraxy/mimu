-- A Mimu passa a gravar pelo app, não só pelo WhatsApp.
--
-- Pedido dela (19/10/2026): "dê autonomia para a IA fazer anotações, criar
-- coisa na agenda e tudo".
--
-- O que existia: pelo WhatsApp a Mimu GRAVA e oferece desfazer (o desenho do
-- brief, em lib/mimu/registro.ts). Dentro do app ela fazia o contrário —
-- devolvia um cartão "Confirma pra mim:" e esperava um toque. Duas cabeças
-- para a mesma frase, e a do app era a mais burocrática justamente onde ela
-- está com a mão na massa.
--
-- E tinha um defeito escondido nisso: pendência ("lembra de cobrar o Marcos")
-- não tinha caminho de confirmação no app. A mensagem caía na pergunta genérica
-- "Você quis dizer que recebeu um pagamento, pagou alguma coisa ou quer marcar
-- um horário?" — ou seja, o lembrete não era anotado e ela ainda levava um
-- "não entendi" na cara.
--
-- A trava para ligar o app no mesmo caminho era aqui: `operacoes_canal.canal`
-- só aceitava 'whatsapp'. Sem 'app', toda escrita automática pelo app falharia
-- no CHECK — e falharia DEPOIS de gravar a pendência ou o compromisso, deixando
-- o registro sem linha de reversão. É por isso que isto é migração e não só
-- código: a janela de desfazer é o que torna a autonomia aceitável.

alter table public.operacoes_canal
  drop constraint if exists operacoes_canal_canal_check;

alter table public.operacoes_canal
  add constraint operacoes_canal_canal_check
  check (canal in ('whatsapp', 'app'));

comment on column public.operacoes_canal.canal is
  'De onde veio a escrita automática: whatsapp ou app. O app entrou em 19/10/2026, quando a Mimu passou a gravar direto também dentro do sistema, com a mesma janela de desfazer.';
