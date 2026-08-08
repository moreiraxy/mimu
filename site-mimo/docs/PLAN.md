# Plano de execução — 1:1 por seção

## A regra que originou este documento

Cinco defeitos chegaram à revisão porque eu estimei valores em vez de medir.
Estão listados aqui como checklist obrigatório, não como história:

| O que eu estimei | O que era de verdade | Como eu deveria ter descoberto |
| --- | --- | --- |
| `background-size: cover` no padrão de pontos | `780px` com `repeat`, mais máscara radial de pico 0.4 | ler `backgroundSize` e `maskImage` do elemento |
| sem raio nos widgets | `6px` (e `10px` no painel de analytics) | ler `borderRadius` de cada imagem |
| `cubic-bezier(.2,.7,.2,1)` a 620ms | `cubic-bezier(.6,0,.4,1)` a 500ms | grep dos bundles `.mjs` por `ease:` |
| botão sem borda | borda de 1px no `::after` | ler `getComputedStyle(el, '::after')` |
| `w-full` na imagem do analytics | caixa fixa de 527px com `object-cover` | comparar altura renderizada vs original |

**Nenhum valor de layout, cor, raio, timing ou espaçamento entra por estimativa.**
Se não foi medido, não é 1:1.

## Onde estão as fontes de verdade

| Fonte | Caminho | Serve para |
| --- | --- | --- |
| HTML original | `<scratch>/payflow/index.html` | estrutura e ordem dos elementos |
| CSS original | `<scratch>/payflow/all.css` | regras dos **3 breakpoints** de uma vez |
| Bundles JS | `<scratch>/payflow/js/*.mjs` | parâmetros de animação |
| Rotas internas | `<scratch>/payflow/page_*.html` | as 8 páginas |
| Medições já feitas | `docs/*.json` | seções e efeitos já extraídos |

`<scratch>` = `/private/tmp/claude-501/-Users-igormoreira-dev-desenrolai-lp-lidz/0e44cd87-dca2-4afa-a05a-ee60f83532d0/scratchpad`

## Parâmetros de movimento (extraídos dos bundles)

Valem para o site inteiro:

- **Reveal de texto**: tween `500ms`, `cubic-bezier(0.6, 0, 0.4, 1)`, stagger 50ms
- **Spring padrão**: `bounce 0.2`, `duration 0.4`
- **Spring alternativo**: `stiffness 400`, `damping 50`, `mass 1`
- **Scroll**: Lenis, com `autoToggle`
- Toda animação precisa desligar em `prefers-reduced-motion`

## Divisão do trabalho

Sub-agentes **não** compartilham a sessão do Chrome — disputariam as abas no
loop medir/corrigir/verificar. Por isso:

1. **Agente** implementa a seção lendo `index.html` + `all.css` locais, que já
   contêm os valores exatos dos três breakpoints.
2. **Eu** verifico no browser com o diff numérico (`scripts/fingerprint.js`),
   rodando a mesma medição nas duas páginas e comparando campo a campo.
3. Divergência acima de 1% em posição, ou qualquer diferença em cor, raio,
   peso ou timing, volta para correção.

## Fila

| Ticket | Seção | Issue |
| --- | --- | --- |
| T05 | How it works | #3 |
| T06 | Integrations | #4 |
| T07 | Who we serve | #5 |
| T08 | Testimonials | #6 |
| T09 | Customer Stories | #7 |
| T10 | Pricing | #8 |
| T11 | Security + FAQs + CTA | #9 |
| T12 | Footer | #10 |
| T13 | Rotas internas | #11 |
| T14 | Otimização | #12 |
| T15 | QA nos 3 breakpoints | #13 |

## Definição de pronto

Uma seção só fecha quando:

- altura da seção bate com o original (tolerância 1px)
- todo texto tem tamanho, peso, line-height, tracking, cor e família idênticos
- toda imagem tem posição e tamanho dentro de 1%, e o mesmo `border-radius`
- todo `::before`/`::after` do original existe
- os timings de animação vêm da tabela acima, não de escolha pessoal
- funciona nos três breakpoints: `<744`, `744–1199`, `>=1200`
