# T11b — FAQs

Medido em `getComputedStyle` na página original, viewport 1440px.
Seletor no original: `#faqs`.

## Caixa da seção

| Propriedade | Valor |
| --- | --- |
| Dimensões | 1425×977px |
| Padding | `60px 0px` |
| Fundo | `rgb(251, 252, 248)` |
| Container | 1200px, centrado |

A altura de 977px é o critério de aceite: a seção implementada
precisa fechar nela (tolerância 1px) em 1440px de viewport.

## Tipografia

| Texto | Tag | Tamanho / LH | Peso | Tracking | Cor | Família |
| --- | --- | --- | --- | --- | --- | --- |
| FAQs | P | 14px / 18.2px | 500 | normal | `rgb(26, 26, 26)` | Geist Mono |
| Have questions?Find answers. | H2 | 64px / 67.2px | 500 | -2.56px | `rgb(26, 26, 26)` | Inter Display |
| Is there a free trial? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| How accurate is the AI receipt scanning? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| How long does setup actually take? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| Can I switch from Expensify or Ramp? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| What accounting tools does PayFlow connect to? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| Is my financial data secure? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| What happens when I hit the free plan limit? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |
| Do you offer support for Enterprise customers? | H3 | 24px / 31.2px | 500 | -0.72px | `rgb(26, 26, 26)` | Inter Display |

## Imagens

0 imagens, 0 arquivos distintos.
Todas já estão em `public/img/`.

_Sem imagens._

## Superfícies

Cada linha é um elemento com fundo, borda, raio, máscara ou blur. Se o original
tem, o clone precisa ter — inclusive os `::after`.

| Elemento | Caixa | Fundo | Raio | Borda | Extra |
| --- | --- | --- | --- | --- | --- |
| Plus Icon | 40×40px @ x 75.26% y 29.96% | `rgb(26, 26, 26)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 45.54% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 52.91% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 60.28% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 67.65% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 75.02% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 82.39% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |
| Plus Icon | 40×40px @ x 75.26% y 89.76% | `rgba(0, 0, 0, 0)` | 100px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`100px` |

## Movimento

Valores extraídos dos bundles `.mjs` do original — use estes, não escolha outros:

- reveal de texto: tween `500ms`, `cubic-bezier(0.6, 0, 0.4, 1)`, stagger `50ms`
- spring padrão: `bounce 0.2`, `duration 0.4`
- spring alternativo: `stiffness 400`, `damping 50`, `mass 1`
- toda animação desliga em `prefers-reduced-motion`

## Pronto quando

- altura da seção bate em 1440px (tolerância 1px)
- cada texto acima confere em tamanho, LH, peso, tracking, cor e família
- cada imagem confere em posição e tamanho (tolerância 1%) e no `border-radius`
- cada superfície acima existe, com o mesmo fundo, raio, borda e máscara
- funciona em `<744`, `744–1199` e `>=1200` (regras em `all.css`)
