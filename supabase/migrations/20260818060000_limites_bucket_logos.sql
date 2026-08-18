-- Teto e tipos permitidos no bucket de logos.
--
-- O bucket era público, com `file_size_limit` nulo e `allowed_mime_types`
-- nulo, e o upload saía direto do navegador sem checar nada. Qualquer conta
-- hospedava arquivo de qualquer tipo e de qualquer tamanho na infraestrutura
-- do produto, servido publicamente: um SVG com script fica hospedado sob o
-- domínio do Supabase, e um arquivo de dois gigabytes é custo nosso.
--
-- O limite fica AQUI e não só no navegador porque o upload é direto para o
-- Storage. Validação no cliente serve para dar mensagem boa; ela não é
-- barreira, já que quem quer burlar não usa a nossa tela.
--
-- 2 MB cobre com folga uma logo de negócio de bairro. SVG fica de fora de
-- propósito: é o único formato de imagem que executa script.

update storage.buckets
   set file_size_limit = 2097152,
       allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
 where id = 'logos';
