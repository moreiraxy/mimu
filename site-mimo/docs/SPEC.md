# Spec — clone 1:1 de payflowio.framer.website

Fonte: template gratuito do Framer. Alvo: Bun + Vite + React 19 + Tailwind v4.
Todos os números abaixo saíram de `getComputedStyle` na página original.

## Breakpoints

O original usa três faixas (confirmadas nas media queries do CSS servido):

| Faixa | Largura | Tailwind |
| --- | --- | --- |
| Mobile | `< 744px` | base |
| Tablet | `744px – 1199px` | `md:` |
| Desktop | `>= 1200px` | `lg:` |

Container: `max-width: 1200px`, centrado. Padding lateral 24px (mobile) / 40px (tablet) / 0 (desktop).

## Paleta

| Token | Hex | Uso |
| --- | --- | --- |
| `cream` | `#fbfcf8` | fundo padrão da página |
| `ink` | `#1a1a1a` | texto principal e fundo das seções escuras |
| `ink-soft` | `#242424` | superfícies elevadas no escuro |
| `sand` | `#e9ebe4` | bordas e divisores |

Opacidades usadas sobre `ink` e `cream`: 5%, 10%, 30%, 50%, 70%, 85%.

## Escala tipográfica

Line-height é `1.3 ×` o tamanho na maior parte da página; os displays fogem disso
e estão listados com o valor exato. Tracking negativo cresce com o tamanho.

| Papel | Tamanho / LH | Peso | Tracking | Família |
| --- | --- | --- | --- | --- |
| H1 hero | 64 / 70.4 | 500 | −1.92px | Inter Display |
| H2 seção | 64 / 67.2 | 500 | −2.56px | Inter Display |
| H3 card | 32 / 38.4 | 500 | −0.96px | Inter Display |
| H3 security | 30 / 37.5 | 500 | −0.9px | Inter Display |
| H3 pricing/FAQ | 24 / 31.2 | 500 | −0.72px | Inter Display |
| Stat | 39 / 39 | 500 | −1.17px (−1.56 no hero) | Inter Display |
| Body lg | 20 / 26 | 500 | −0.6px | Inter Display |
| Body md | 18 / 23.4 | 500 | −0.36px | Inter Display |
| Body sm | 16 / 20.8 | 500/600 | −0.32px | Inter Display |
| Caption | 14 / 18.2 | 500 | −0.28px | Inter Display |
| Eyebrow | 14 / 18.2 | 500 | normal | Geist Mono |
| Micro | 12 / 15.6 | 500 | normal | Geist Mono |

## Mapa de seções (desktop, ordem do documento)

Altura total da página: 15278px.

| # | Seção | `id` | Padding vertical | Fundo | Gap interno |
| --- | --- | --- | --- | --- | --- |
| 1 | Header | — | sticky, top 20px | transparente | — |
| 2 | Hero | — | 160 / 120 | cream | 60 |
| 3 | Features | `features` | 120 | ink | 80 |
| 4 | How it works | `How it works` | 120 | ink | 80 |
| 5 | Integrations | `Integrations` | 120 | cream | — |
| 6 | Who we serve | `who-we-serve` | 60 | cream | 60 |
| 7 | Testimonials | `testimonials` | 60 | cream | 60 |
| 8 | Customer Stories | `Customer Stories` | 60 | cream | 60 |
| 9 | Pricing | `Pricing` | 60 | cream | 60 |
| 10 | Security | `Security` | 60 | cream | 60 |
| 11 | FAQs | `faqs` | 60 | cream | 60 |
| 12 | CTA final | `contact` | 60 | cream | 20 |
| 13 | Footer | — | 60 | cream | 120 |

As seções 3 e 4 formam um bloco escuro contínuo; as demais são cream.

## Rotas

| Rota | Origem |
| --- | --- |
| `/` | landing completa |
| `/contact` | formulário de contato |
| `/customer-stories` | índice de cases |
| `/customer-stories/:slug` | `firstogo`, `secondogo`, `thirdogo`, `fourthogo` |
| `/legal/:slug` | `privacy-policy`, `terms-of-service` |

## Metas de performance

O original entrega o runtime do Framer somado a React e a uma lib de motion. Como
o alvo é React puro, o ganho vem de: nenhuma lib de animação, imagens em AVIF/WebP
com `srcset`, `lazy` abaixo da dobra, code-split por rota, e fontes já subsetadas
por `unicode-range` servidas do mesmo domínio.

Alvo: Lighthouse >= 95 em performance e JS inicial abaixo de 100KB comprimido.
