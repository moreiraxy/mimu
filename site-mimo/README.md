# payflow-clone

Réplica 1:1 do template gratuito Payflow (Framer) em **Bun + Vite + React 19 + Tailwind v4**.

Repo: https://github.com/igor-dev7/payflow-clone

```bash
bun install
bun run dev      # servidor de desenvolvimento
bun run build    # typecheck + build de produção
bun run preview  # serve o dist
```

## Estrutura

```
src/
  components/   Header, Button, Container, Img, AnimatedText
  sections/     uma seção da landing por arquivo
  pages/        uma rota por arquivo (code-split, exceto Home)
  hooks/        useInView
  styles/       fonts.css (95 faces self-hosted)
docs/
  SPEC.md            medidas, paleta e escala tipográfica do original
  sections-1440.json mapa das 17 seções com padding, fundo e gap
  ref/               screenshots de referência (original vs clone)
public/
  img/          85 imagens do template
  fonts/        Inter, Inter Display, Geist Mono
```

## Como o spec foi levantado

Nada foi estimado no olho. `docs/SPEC.md` e `docs/sections-1440.json` saíram de
`getComputedStyle` rodando na página original via Chrome DevTools — paleta,
escala tipográfica, paddings de seção e geometria do hero. Ao implementar uma
seção nova, o caminho é o mesmo: abrir o original, medir, replicar.

## Estado atual

Concluído:

- **T00** scaffold, tokens de design, fontes e assets
- **T01** Header com nav desktop e drawer mobile
- **T02** Hero completo (pill, heading com reveal, CTA, visuais)

Em aberto: issues [#1 a #13](https://github.com/igor-dev7/payflow-clone/issues)
— seções T03 a T12, rotas internas (T13), otimização (T14) e QA visual (T15).
As rotas internas hoje são stubs.

## Decisões que valem saber

**Sem lib de animação.** O original carrega o runtime do Framer mais uma lib de
motion. Aqui os reveals são `IntersectionObserver` + transição CSS
(`src/hooks/useInView.ts`), e `prefers-reduced-motion` desliga tudo.

**`Img` é `<img>` puro por enquanto.** A intenção é `<picture>` com AVIF/WebP,
mas um `<source>` apontando para arquivo inexistente vence a negociação e
renderiza quebrado. O wrapper volta no T14, junto com o script que gera os
arquivos.

**Breakpoints seguem o original:** `<744` mobile, `744–1199` tablet (`md:`),
`>=1200` desktop (`lg:`). Container de 1200px.

## Peso atual

| Arquivo | gzip |
| --- | --- |
| react | 73.3 KB |
| app | 3.5 KB |
| css | 6.7 KB |

Meta do T14: Lighthouse >= 95 e JS inicial abaixo de 100 KB gzip.
