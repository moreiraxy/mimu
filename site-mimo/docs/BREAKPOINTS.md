# T15 — Referência dos três breakpoints

Medido na página original com `getComputedStyle`. É o alvo contra o qual o clone
precisa fechar. Até aqui só o desktop tinha sido validado.

**Ressalva sobre a coluna mobile:** a janela do Chrome não desce abaixo de 500px,
então a medição saiu em 500px, não em 390. A faixa é a mesma (`<744`), logo as
regras aplicadas são as corretas, mas as **alturas** da coluna valem para 500px.
Para fechar 390px de verdade é preciso emulação de device, não redimensionamento
de janela.

## Alturas por seção

| Seção | 500px | 834px | 1425px |
| --- | --- | --- | --- |
| Hero | 2099 | 1237 | 1611 |
| Features | 2349 | 1422 | 1961 |
| How it works | 2458 | 1706 | 2085 |
| Integrations | 504 | 620 | 819 |
| Who we serve | 1142 | 746 | 963 |
| Testimonials | 827 | 841 | 957 |
| Customer Stories | 2483 | 2176 | 2481 |
| Pricing | 1070 | 1029 | 1131 |
| Security | 1686 | 1052 | 895 |
| FAQs | 866 | 862 | 977 |
| CTA | 463 | 479 | 563 |
| Footer | 772 | 605 | 836 |
| **Documento** | **16716** | **12773** | **15278** |

## Padding vertical — assimétrico fora do desktop

Este é o achado que a validação só de desktop escondia. No desktop quase toda
seção é simétrica; abaixo de 1200px o bloco escuro divide o padding de forma
desigual, e as duas metades dele se encaixam uma na outra:

| Seção | 500px | 834px | 1425px |
| --- | --- | --- | --- |
| Hero | `100px 0 80px` | `120px 0 80px` | `160px 0 120px` |
| Features | `80px 0 40px` | `80px 0 40px` | `120px 0` |
| How it works | `40px 0 80px` | `40px 0 80px` | `120px 0` |
| Integrations | `80px 0 60px` | `80px 0 40px` | `120px 0` |
| Demais seções | `40px 0` | `40px 0` | `60px 0` |

Features fecha com 40 e How it works abre com 40: as duas seções escuras somam
80px na junção, o mesmo que uma seção clara isolada teria dos dois lados.

## Gap do container

| Seção | 500px | 834px | 1425px |
| --- | --- | --- | --- |
| Hero | 40 | 40 | 60 |
| Features / How it works | 60 | 60 | 80 |
| Demais | 40 | 40 | 60 |
| CTA | 16 | 20 | 20 |
| Footer | 80 | 80 | 120 |

## Largura do container

`width: 90%; max-width: 1200px`, confirmado nos três: 437px em 500 (90% de 485,
já descontada a barra de rolagem), 737px em 834, 1200px em 1425.

Integrations é a exceção: o conteúdo mede 485px em 500 e 819px em 834, mais largo
que o container, porque os tickers de logo são `overflow: hidden` — as caixas
existem no layout e são medidas, mas não pintam.

## Resultado da comparação

Original / clone, e a diferença. `ok` é dentro de 1px.

| Seção | 500px | 834px | 1440px |
| --- | --- | --- | --- |
| Hero | 2099 / 1897 **−202** | 1237 / 1398 **+161** | 1611 / 1619 **+8** |
| Features | 2349 / 2133 **−216** | 1422 / 2782 **+1360** | 1961 / 1961 ok |
| How it works | 2458 / 2458 ok | 1706 / 1706 ok | 2085 / 2085 ok |
| Integrations | 504 / 504 ok | 620 / 619 ok | 819 / 819 ok |
| Who we serve | 1142 / 1142 ok | 746 / 1100 **+354** | 963 / 963 ok |
| Testimonials | 827 / 827 ok | 841 / 841 ok | 957 / 957 ok |
| Customer Stories | 2483 / 2483 ok | 2176 / 2176 ok | 2481 / 2481 ok |
| Pricing | 1070 / 1029 **−41** | 1029 / 1029 ok | 1131 / 1131 ok |
| Security | 1686 / 1225 **−461** | 1052 / 1029 **−23** | 895 / 895 ok |
| FAQs | 866 / 865 ok | 862 / 862 ok | 977 / 977 ok |
| CTA | 463 / 467 **+4** | 479 / 481 **+2** | 563 / 563 ok |
| Footer | 772 / 772 ok | 605 / 605 ok | 836 / 836 ok |
| **Documento** | 16716 / 15801 | 12773 / 14630 | 15278 / 15286 |

**7/12 em 500px · 7/12 em 834px · 11/12 em 1440px.**

O clone é 1:1 no desktop. Fora dele, não é ainda.

## Onde as falhas se concentram

Seis seções fecham nos três breakpoints: How it works, Integrations, Testimonials,
Customer Stories, FAQs e Footer. Todas foram escritas depois que o protocolo de
medição amadureceu — os quatro tiers de tipografia, o parser de CSS com controle
de chaves, a leitura dos tokens em vez dos fallbacks.

As que falham são as de antes disso:

- **Features `+1360` em 834** é o pior defeito do projeto. O grid usa
  `grid-cols-1 lg:grid-cols-2`, então empilha em coluna única em toda a faixa
  744–1199, onde o original mantém duas colunas. Quase dobra a altura.
- **Hero** erra nos três, e o sinal inverte (−202 / +161 / +8): não é um valor
  errado, é a escada de breakpoints inteira fora de fase.
- **Security `−461` em 500** — os quatro cards não reflowam como no original.
- **Who we serve `+354` em 834**, **Pricing `−41` em 500**, **CTA `+2/+4`**.

O padrão é o mesmo da sessão inteira: o que eu construí no começo, no olho,
acumulou defeito; o que passou por medir → delegar com spec → validar saiu certo.
A diferença é que agora dá para provar, porque a métrica cobre os três tamanhos
em vez de só o que eu tinha olhado.

## Como rodar a comparação

```bash
bun run build && bun run preview --port 4173
```

Depois, em cada largura, medir as mesmas seções no clone e diffar contra a tabela
acima. Tolerância: 1px na altura. `scripts/fingerprint.js` faz a comparação
elemento a elemento quando a altura divergir e for preciso achar onde.
