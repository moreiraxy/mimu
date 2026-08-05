# Migrations — Mimu

Schema completo do banco de dados da Mimu, em ordem de aplicação. Os arquivos são numerados por timestamp (convenção do Supabase CLI) e devem rodar nessa ordem.

| Arquivo | Conteúdo |
| --- | --- |
| `20260804120000_extensions_and_helpers.sql` | Extensão `pgcrypto`, trigger genérica `set_updated_at()` e função `user_owns_empresa()` usada nas policies de RLS |
| `20260804120100_empresas.sql` | Tabela `empresas` |
| `20260804120200_clientes.sql` | Tabela `clientes` + trigger que recalcula `cliente_fiel` |
| `20260804120300_agendamentos.sql` | Tabela `agendamentos` |
| `20260804120400_transacoes.sql` | Tabela `transacoes` + FK cruzada `agendamentos.transacao_id` |
| `20260804120500_metas.sql` | Tabela `metas` |
| `20260804120600_conversas_mimu.sql` | Tabela `conversas_mimu` (histórico do chat com a IA) |
| `20260804120700_alertas_mimu.sql` | Tabela `alertas_mimu` (notificações proativas) |
| `20260804120800_handle_new_user.sql` | Trigger em `auth.users` que cria a `empresa` automaticamente no cadastro, lendo `nome_negocio` do metadata do signup |

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
- **`cliente_fiel` automático**: recalculado em `clientes` sempre que `total_visitas` ou `total_gasto` mudam — vira `true` quando `total_visitas > 10` ou `total_gasto > 1000`.

## Fora de escopo (decisão consciente)

Os contadores `clientes.total_gasto`, `clientes.total_visitas` e `clientes.ultimo_atendimento` **não** são atualizados automaticamente a partir de `transacoes`/`agendamentos` — a regra de quais transações contam (ex.: só `entrada` concluída? desconsiderar estorno?) é uma decisão de produto que não estava especificada. Esses campos devem ser atualizados pela aplicação (ou por uma trigger futura, uma vez definida a regra).
