# Mimu

PWA de gestão para microempreendedores brasileiros de bairro — salões, barbearias, mercadinhos, lanchonetes. Registra vendas, acompanha faturamento, agenda e clientes, com uma assistente de IA que fala como uma amiga, não como um sistema.

## Stack

- **Front-end:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Banco de dados / Auth:** Supabase (PostgreSQL + Supabase Auth)
- **IA:** API da Groq (Llama 3.3 70B)
- **Deploy:** Vercel

## Estrutura de pastas

```
mimu/
├── app/            # Rotas (App Router), layout raiz, manifest e ícone do PWA
├── components/     # Componentes reutilizáveis (ex.: Logo, ui/Button)
├── lib/            # Clients do Supabase, Groq e helpers
├── hooks/          # Custom hooks (ex.: useSupabaseUser)
├── types/          # Tipos TypeScript, incluindo types/database.ts (gerado pelo Supabase)
├── public/         # Assets estáticos
└── brand/          # Brand book e sistema de design original da Mimu (referência)
```

## Setup local

### Pré-requisitos

- Node.js ≥ 18.18
- Uma conta [Supabase](https://supabase.com) (projeto criado)
- Uma chave de API da [Groq](https://console.groq.com)

### Passos

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha os valores:

   ```bash
   cp .env.example .env.local
   ```

   | Variável | Onde encontrar |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API, no painel do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (uso restrito a servidor) |
   | `GROQ_API_KEY` | console.groq.com → API Keys |

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

### Autenticação

O fluxo de auth (`/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`) usa Supabase Auth + Server Actions. Depois de aplicar as migrations (veja [`supabase/migrations`](./supabase/migrations)), configure em **Authentication → URL Configuration** no painel do Supabase:

- **Site URL**: `http://localhost:3000` (e a URL de produção, quando fizer deploy)
- **Redirect URLs**: adicione `http://localhost:3000/dashboard` e `http://localhost:3000/redefinir-senha` (mais os equivalentes de produção)

Sem isso, os links enviados por e-mail (confirmação de cadastro e recuperação de senha) não vão redirecionar corretamente.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | Roda o ESLint |
| `npm run format` | Formata o projeto com Prettier |
| `npm run format:check` | Verifica formatação sem alterar arquivos |
| `npm run typecheck` | Verifica tipos com `tsc --noEmit` |

## Identidade visual

A marca está totalmente configurada no [`tailwind.config.ts`](./tailwind.config.ts), extraída do brand book em [`brand/`](./brand):

| Token | Hex | Uso |
| --- | --- | --- |
| `coral` | `#FF6B5B` | Cor principal — CTAs, ícone, contato direto com a Mimu |
| `verde` | `#2DBE8C` | Entradas, sucesso, faturamento positivo |
| `ambar` | `#F4A653` | Alertas e pendências (nunca erro grave) |
| `fundo` | `#F7F6F3` | Background do app |
| `escuro` | `#1E1E2E` | Texto principal / modo escuro — nunca preto puro |

Cada token de cor também tem variações de apoio (`coral.light`, `verde.dark`, `neutro.border` etc.) espelhando exatamente as usadas no sistema de design original. Border radius customizado: `rounded-card` (16px) e `rounded-button` (12px).

Tipografia: **Nunito** (pesos 400–800), carregada via `next/font/google` em [`app/layout.tsx`](./app/layout.tsx) — a mesma fonte usada em todas as telas do brand book.

O ícone do PWA ([`app/icon.svg`](./app/icon.svg)) e o manifest ([`app/manifest.ts`](./app/manifest.ts)) usam o "M" de duas curvas da marca sobre fundo coral. Para publicação nas lojas (iOS/Android), exporte rasters PNG em 512×512 a partir do mesmo SVG, seguindo as specs de ícone documentadas no brand book.

## Tom de voz

A Mimu fala como uma amiga que entende do negócio — nunca como um painel financeiro genérico. Evite termos técnicos ("erro", "banco de dados", "módulo"); prefira linguagem de conversa, calorosa e direta. Detalhes completos em [`brand/Mimu Sistema de Design.dc.html`](<./brand/Mimu Sistema de Design.dc.html>).
