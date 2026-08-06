# Migrations — Mimu

Schema completo do banco de dados da Mimu, em ordem de aplicação. Os arquivos são numerados por timestamp (convenção do Supabase CLI) e devem rodar nessa ordem.

| Arquivo | Conteúdo |
| --- | --- |
| `20260804120000_extensions_and_helpers.sql` | Extensão `pgcrypto` e trigger genérica `set_updated_at()` |
| `20260804120100_empresas.sql` | Tabela `empresas` + função `user_owns_empresa()` (usada nas policies de RLS das demais tabelas) |
| `20260804120200_clientes.sql` | Tabela `clientes` + trigger que recalcula `cliente_fiel` |
| `20260804120300_agendamentos.sql` | Tabela `agendamentos` |
| `20260804120400_transacoes.sql` | Tabela `transacoes` + FK cruzada `agendamentos.transacao_id` |
| `20260804120500_metas.sql` | Tabela `metas` |
| `20260804120600_conversas_mimu.sql` | Tabela `conversas_mimu` (histórico do chat com a IA) |
| `20260804120700_alertas_mimu.sql` | Tabela `alertas_mimu` (notificações proativas) |
| `20260804120800_handle_new_user.sql` | Trigger em `auth.users` que cria a `empresa` automaticamente no cadastro, lendo `nome_negocio` do metadata do signup |
| `20260804130000_onboarding_fields.sql` | `empresas.onboarding_concluido`, `empresas.clientes_por_semana_media` e novo default `'{}'` para `modulos_ativos` (nenhum módulo começa ativo — a escolha é do onboarding) |
| `20260804140000_transacoes_parcelamento.sql` | `transacoes.grupo_parcelamento_id` — agrupa as parcelas de uma mesma compra parcelada |
| `20260804150000_clientes_faltas.sql` | `clientes.faltas` + trigger que incrementa automaticamente quando um agendamento vira `nao_compareceu` |
| `20260804160000_clientes_estatisticas_e_fidelidade.sql` | Trigger que atualiza `total_gasto`/`total_visitas`/`ultimo_atendimento` ao inserir uma transação de entrada vinculada a um cliente (dispara `atualizar_cliente_fiel` em cadeia); critério de `cliente_fiel` passa de `>` para `>=` |

## Modelo de dados

```
auth.users
   └─ empresas (user_id)
        ├─ clientes (empresa_id)
        │     └─ agendamentos (cliente_id, nullable)
        │     └─ transacoes (cliente_id, nullable)
        ├─ agendamentos (empresa_id) ──┐
        ├─ transacoes (empresa_id)     ├─ referência cruzada 1:1 opcional
        │     └─ agendamento_id ───────┘  (transacao_id / agendamento_id)
        ├─ metas (empresa_id)
        ├─ conversas_mimu (empresa_id)
        └─ alertas_mimu (empresa_id)
```

## Segurança (RLS)

Todas as tabelas têm Row Level Security habilitado. `empresas` é filtrada diretamente por `auth.uid() = user_id`; todas as demais tabelas pertencem a uma `empresa_id` e usam a função `public.user_owns_empresa(empresa_id)` para confirmar que a empresa pertence ao usuário autenticado antes de liberar `select/insert/update/delete`. Isso garante que uma usuária nunca acesse dados de outra empresa, mesmo lendo direto pela API do Supabase.

## Como aplicar

### Opção 1 — Supabase CLI (recomendado)

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
```

### Opção 2 — SQL Editor do painel Supabase

Cole o conteúdo de cada arquivo, na ordem da tabela acima, em Project → SQL Editor → New query, e execute um de cada vez.

## Depois de aplicar

Regenere os tipos TypeScript para manter `types/database.ts` sincronizado com o schema real:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
```

## Automações já incluídas

- **`updated_at` automático** em `empresas`, `clientes`, `agendamentos` e `transacoes` via trigger `set_updated_at()`.
- **`cliente_fiel` automático**: recalculado em `clientes` sempre que `total_visitas` ou `total_gasto` mudam — vira `true` quando `total_visitas >= 10` ou `total_gasto >= 1000`.
- **Estatísticas do cliente automáticas**: `total_gasto`, `total_visitas` e `ultimo_atendimento` são atualizados sempre que uma transação `entrada` com `cliente_id` é inserida (ver `20260804160000`).

## Fora de escopo (decisão consciente)

- Editar ou excluir uma transação já lançada **não** reajusta retroativamente `total_gasto`/`total_visitas`/`ultimo_atendimento` do cliente — só o `INSERT` de uma nova entrada dispara a atualização.
- `clientes.saldo_fiado` não é tocado por essa trigger — "Registrar pagamento" no perfil do cliente é uma ação explícita da aplicação (cria a transação de recebimento e abate o saldo em duas escritas), não uma regra automática baseada em categoria da transação.
