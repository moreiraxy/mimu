# T11c — CTA final

Medido em `getComputedStyle` na página original, viewport 1440px.
Seletor no original: `#contact`.

## Caixa da seção

| Propriedade | Valor |
| --- | --- |
| Dimensões | 1425×563px |
| Padding | `60px 0px` |
| Fundo | `rgb(251, 252, 248)` |
| Container | 1200px, centrado |

A altura de 563px é o critério de aceite: a seção implementada
precisa fechar nela (tolerância 1px) em 1440px de viewport.

## Tipografia

| Texto | Tag | Tamanho / LH | Peso | Tracking | Cor | Família |
| --- | --- | --- | --- | --- | --- | --- |
| Ready to take back your time? | H2 | 64px / 67.2px | 500 | -2.56px | `rgb(251, 252, 248)` | Inter Display |
| Get a free demo | P | 16px / 20.8px | 500 | -0.32px | `rgb(26, 26, 26)` | Inter Display |

## Imagens

1 imagens, 1 arquivos distintos.
Todas já estão em `public/img/`.

| Arquivo | Caixa renderizada | Raio | object-fit |
| --- | --- | --- | --- |
| `AeRcUuogo8PqQ4xMEzB8fSQo3c.jpg` | 1200×443px @ x 7.89% y 10.65% | 12px | cover |

## Superfícies

Cada linha é um elemento com fundo, borda, raio, máscara ou blur. Se o original
tem, o clone precisa ter — inclusive os `::after`.

| Elemento | Caixa | Fundo | Raio | Borda | Extra |
| --- | --- | --- | --- | --- | --- |
| Container | 1200×443px @ x 7.89% y 10.65% | `rgba(0, 0, 0, 0)` | 12px | — | pad `120px 0px`, gap `20px` |
| DIV | 1200×443px @ x 7.89% y 10.65% | `rgba(0, 0, 0, 0)` | 12px | — | — |
| Overlay | 1200×709px @ x 7.82% y 10.65% | `rgba(0, 0, 0, 0)` | 0px | — | bg-size `auto`, opacity `0.5` |
| Ver1 | 160×49px @ x 44.38% y 59.42% | `rgb(255, 255, 255)` | 1000px | — | ::after `1px solid rgba(26, 26, 26, 0.1)` r`1000px`, pad `14px 14px 14px 16px`, gap `8px` |

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
