# T07 — Who we serve

Medido em `getComputedStyle` na página original, viewport 1440px.
Seletor no original: `#who-we-serve`.

## Caixa da seção

| Propriedade | Valor |
| --- | --- |
| Dimensões | 1425×963px |
| Padding | `60px 0px` |
| Fundo | `rgb(251, 252, 248)` |
| Container | 1200px, centrado |

A altura de 963px é o critério de aceite: a seção implementada
precisa fechar nela (tolerância 1px) em 1440px de viewport.

## Tipografia

| Texto | Tag | Tamanho / LH | Peso | Tracking | Cor | Família |
| --- | --- | --- | --- | --- | --- | --- |
| Built for every stage | P | 14px / 18.2px | 500 | normal | `rgb(26, 26, 26)` | Geist Mono |
| Grows with you, from day one to scale. | H2 | 64px / 67.2px | 500 | -2.56px | `rgb(26, 26, 26)` | Inter Display |
| Solo & Freelance | P | 16px / 20.8px | 600 | -0.32px | `rgb(251, 252, 248)` | Inter Display |
| Contact us | P | 16px / 20.8px | 600 | -0.32px | `rgb(26, 26, 26)` | Inter Display |
| Growth Stage | P | 16px / 20.8px | 600 | -0.32px | `rgb(26, 26, 26)` | Inter Display |
| Enterprise | P | 16px / 20.8px | 600 | -0.32px | `rgb(26, 26, 26)` | Inter Display |
| 1/3 | P | 16px / 20.8px | 600 | -0.32px | `rgb(26, 26, 26)` | Inter Display |
| Your finances, finally organized | H3 | 32px / 38.4px | 500 | -0.96px | `rgb(26, 26, 26)` | Inter Display |
| Track every deduction. Close the year in minutes,… | P | 20px / 26px | 500 | -0.6px | `rgba(26, 26, 26, 0.7)` | Inter Display |
| Tom Reyes - Founder | P | 16px / 20.8px | 500 | -0.32px | `rgba(251, 252, 248, 0.7)` | Inter Display |

## Imagens

2 imagens, 2 arquivos distintos.
Todas já estão em `public/img/`.

| Arquivo | Caixa renderizada | Raio | object-fit |
| --- | --- | --- | --- |
| `VP4n0N3HEflTYvIgEmpU43TdyJs.jpg` | 379×517px @ x 37.83% y 39.2% | 8px | cover |
| `XiideQNkQlTF7RTg32MWJfJYYzM.png` | 100×26px @ x 67.76% y 41.28% | 0px | contain |

## Superfícies

Cada linha é um elemento com fundo, borda, raio, máscara ou blur. Se o original
tem, o clone precisa ter — inclusive os `::after`.

| Elemento | Caixa | Fundo | Raio | Borda | Extra |
| --- | --- | --- | --- | --- | --- |
| Active | 157×45px @ x 7.89% y 30.39% | `rgb(26, 26, 26)` | 1000px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`1000px`, pad `12px 20px`, gap `16px` |
| Inactive | 137×45px @ x 19.44% y 30.39% | `rgb(255, 255, 255)` | 1000px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`1000px`, pad `12px 20px`, gap `16px` |
| Inactive | 111×45px @ x 29.61% y 30.39% | `rgb(255, 255, 255)` | 1000px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`1000px`, pad `12px 20px`, gap `16px` |
| Content Card | 813×533px @ x 7.89% y 38.37% | `rgb(233, 235, 228)` | 12px | — | pad `8px` |
| DIV | 379×517px @ x 37.83% y 39.2% | `rgba(0, 0, 0, 0)` | 8px | — | — |
| DIV | 379×517px @ x 37.83% y 39.2% | `rgba(0, 0, 0, 0)` | 8px | — | — |
| Testimonial Card | 375×533px @ x 65.8% y 38.37% | `rgb(26, 26, 26)` | 12px | — | pad `28px` |

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
