-- Fecha três falhas críticas encontradas na auditoria de segurança.
--
-- As políticas destas tabelas eram `for all`, o que vale para leitura E
-- escrita. Como todas guardam algo "da empresa", pareceu natural na época. O
-- erro foi tratar assinatura e pagamento como dado DA cliente: eles são o
-- registro comercial SOBRE ela, e quem escreve ali é o servidor, nunca o
-- navegador.
--
-- Confirmado explorando com a chave pública, autenticada como cliente comum:
--   1. update em assinaturas virava status ativa, plano premium, valor 0 e
--      trial até 2099. Acesso vitalício ao plano mais caro sem checkout.
--   2. update em empresas limpava suspensa_em. Conta expulsa voltava sozinha.
--   3. insert em pagamentos gravava um pagamento "aprovado" falso.
--
-- Antes desta migration, as rotas de pagamento e o onboarding gravavam com a
-- sessão da cliente. Foram movidos para a service role, senão revogar a
-- escrita aqui quebraria o checkout.

-- 1. Assinatura: a cliente lê a própria, e só.
drop policy if exists "Usuárias gerenciam a própria assinatura" on public.assinaturas;
create policy "Usuárias leem a própria assinatura" on public.assinaturas
  for select using (user_owns_empresa(empresa_id));
revoke insert, update, delete on public.assinaturas from authenticated, anon;

-- 2. Pagamento: idem. O histórico financeiro não pode ser escrito por quem
--    é cobrado por ele.
drop policy if exists "Usuárias gerenciam os próprios pagamentos" on public.pagamentos;
create policy "Usuárias leem os próprios pagamentos" on public.pagamentos
  for select using (user_owns_empresa(empresa_id));
revoke insert, update, delete on public.pagamentos from authenticated, anon;

-- 3. Empresa: a política continua valendo (a cliente edita o próprio negócio),
--    mas RLS não sabe distinguir coluna. Quem faz isso é privilégio de coluna.
--
--    A lista é branca e não preta de propósito: coluna nova nasce fechada. Se
--    fosse uma lista de proibições, cada coluna futura entraria liberada e o
--    buraco voltaria em silêncio.
revoke update on public.empresas from authenticated, anon;
grant update (
  nome,
  tipo_negocio,
  telefone,
  endereco,
  logo_url,
  horario_funcionamento,
  meta_mensal,
  meta_diaria,
  tema,
  config_alertas,
  clientes_por_semana_media,
  onboarding_concluido
) on public.empresas to authenticated;

-- Fora da lista, e é o ponto: `suspensa_em` e `suspensa_motivo` (só o painel
-- admin suspende), `modulos_ativos` (é o que separa os planos), `id` e
-- `user_id` (trocar isso seria assumir outra conta).
--
-- `modulos_ativos` sai do alcance da cliente, então a tela de Minha Empresa
-- passa a salvar módulo pelo servidor. Ver app/(dashboard)/minha-empresa.

-- Inserir empresa nunca foi coisa do navegador: quem cria é o gatilho de
-- cadastro, que roda como dono e não passa por isto.
revoke insert, delete on public.empresas from authenticated, anon;
