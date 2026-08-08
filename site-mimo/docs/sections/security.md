# T11a — Security

Medido em `getComputedStyle` na página original, viewport 1440px.
Seletor no original: `#Security`.

## Caixa da seção

| Propriedade | Valor |
| --- | --- |
| Dimensões | 1425×895px |
| Padding | `60px 0px` |
| Fundo | `rgb(251, 252, 248)` |
| Container | 1200px, centrado |

A altura de 895px é o critério de aceite: a seção implementada
precisa fechar nela (tolerância 1px) em 1440px de viewport.

## Tipografia

| Texto | Tag | Tamanho / LH | Peso | Tracking | Cor | Família |
| --- | --- | --- | --- | --- | --- | --- |
| Security | P | 14px / 18.2px | 500 | normal | `rgb(26, 26, 26)` | Geist Mono |
| Certified secure,compliant by design | H2 | 64px / 67.2px | 500 | -2.56px | `rgb(26, 26, 26)` | Inter Display |
| SOC 2 Type II | H3 | 30px / 37.5px | 500 | -0.9px | `rgb(251, 252, 248)` | Inter Display |
| Independently audited controls for security, avai… | P | 16px / 20.8px | 600 | -0.32px | `rgba(251, 252, 248, 0.7)` | Inter Display |
| 99.9% Uptime SLA | H3 | 30px / 37.5px | 500 | -0.9px | `rgb(251, 252, 248)` | Inter Display |
| Enterprise-grade reliability, backed by a 99.9% u… | P | 16px / 20.8px | 600 | -0.32px | `rgba(251, 252, 248, 0.7)` | Inter Display |
| ISO 27001 | H3 | 30px / 37.5px | 500 | -0.9px | `rgb(251, 252, 248)` | Inter Display |
| Information security managed to the recognized IS… | P | 16px / 20.8px | 600 | -0.32px | `rgba(251, 252, 248, 0.7)` | Inter Display |
| GDPR Compliant | H3 | 30px / 37.5px | 500 | -0.9px | `rgb(251, 252, 248)` | Inter Display |
| Privacy by design and full GDPR protection — your… | P | 16px / 20.8px | 600 | -0.32px | `rgba(251, 252, 248, 0.7)` | Inter Display |
| PCI DSS compliant | P | 14px / 18.2px | 500 | normal | `rgba(26, 26, 26, 0.7)` | Geist Mono |
| AES-256 encryption | P | 14px / 18.2px | 500 | normal | `rgba(26, 26, 26, 0.7)` | Geist Mono |
| SSO & SAML | P | 14px / 18.2px | 500 | normal | `rgba(26, 26, 26, 0.7)` | Geist Mono |
| Role-based access | P | 14px / 18.2px | 500 | normal | `rgba(26, 26, 26, 0.7)` | Geist Mono |
| CCPA compliant | P | 14px / 18.2px | 500 | normal | `rgba(26, 26, 26, 0.7)` | Geist Mono |

## Imagens

4 imagens, 4 arquivos distintos.
Todas já estão em `public/img/`.

| Arquivo | Caixa renderizada | Raio | object-fit |
| --- | --- | --- | --- |
| `xkYpV98WWniejL3UVXpMPZlXo.svg` | 57×57px @ x 9.58% y 46.35% | 0px | cover |
| `AxRl37zVWRgc5u2LvOQmm2w8Y4.svg` | 57×57px @ x 30.77% y 46.35% | 0px | cover |
| `ft8nMCt6A0x2ZgSm6UJY2FtOvc.svg` | 57×57px @ x 51.96% y 46.35% | 0px | cover |
| `DEUAbPOnYvcpeBjExgGPpuBzCk.svg` | 57×57px @ x 73.16% y 46.35% | 0px | cover |

## Superfícies

Cada linha é um elemento com fundo, borda, raio, máscara ou blur. Se o original
tem, o clone precisa ter — inclusive os `::after`.

| Elemento | Caixa | Fundo | Raio | Borda | Extra |
| --- | --- | --- | --- | --- | --- |
| Desktop | 294×370px @ x 7.89% y 43.66% | `rgb(26, 26, 26)` | 12px | — | pad `24px` |
| Desktop | 294×370px @ x 29.09% y 43.66% | `rgb(26, 26, 26)` | 12px | — | pad `24px` |
| Desktop | 294×370px @ x 50.28% y 43.66% | `rgb(26, 26, 26)` | 12px | — | pad `24px` |
| Desktop | 294×370px @ x 71.47% y 43.66% | `rgb(26, 26, 26)` | 12px | — | pad `24px` |

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
