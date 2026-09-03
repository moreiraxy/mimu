# Subir a Mimu na App Store

Para quem vai fazer o envio. Escrito em 02/09/2026, a partir do estado real do
repositório — não de intenção.

---

## 1. Qual repositório

**`github.com/zanettizmax-boop/mimu`** — é dele que a Hostinger publica o
mimu.pro. Mudança que não chega nesse repositório não chega no ar.

### A armadilha que precisa ser resolvida ANTES de mais alguém commitar

Existe um segundo repositório, `github.com/moreiraxy/mimu`, com o mesmo
conteúdo. Os dois vivem sincronizados **por uma configuração local na máquina
da Rayssa** — o `origin` dela tem duas URLs de push, então um `git push` dela
manda para os dois de uma vez.

**Isso não é espelhamento.** Não há GitHub Action, webhook, nem nada do lado do
servidor: conferido, não existe `.github/workflows`. Em qualquer outra máquina,
um push vai para **um** repositório só, e o outro fica para trás em silêncio.

Antes de o time crescer, escolher um caminho:

- **Um repositório só** (recomendado): apagar ou arquivar o outro.
- **Espelho de verdade**: uma Action que replica `main` de um para o outro.

Enquanto isso não for feito, quem commitar precisa saber em qual dos dois está.

---

## 2. O que este app É

Um **invólucro fino**. `capacitor.config.ts`:

```ts
webDir: "app-shell",
server: { url: "https://mimu.pro" }
```

O `app-shell/` inteiro é **um arquivo HTML de 4 KB**, e ele só aparece quando
não há internet. Fora isso, o app abre `https://mimu.pro` numa WKWebView.

### O que isso significa na prática

| Mudança                                                              | Como sobe                                                       |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Tela, texto, cor, funcionalidade, correção de bug                    | **Deploy do site.** Chega no app na hora, sem revisão da Apple. |
| Ícone, nome, splash, permissões, plugin nativo, tela de sem-internet | **Build novo + revisão da Apple.**                              |

Ou seja: depois do primeiro envio, **quase tudo continua sendo só deploy**. A
App Store entra na conta só quando muda o invólucro.

---

## 3. O que já está pronto

- `capacitor.config.ts` com `appId: br.com.mimu.app` e `appName: Mimu`
- `@capacitor/cli`, `core` e `ios` na versão 6.2.1
- `app-shell/index.html` com a tela de sem-internet
- `public/icons/appstore-1024.png` (o ícone de 1024 que a loja exige)
- Política de privacidade e termos publicados em `mimu.pro/legal/privacidade` e
  `/legal/termos`
- **Exclusão de conta dentro do app** (`Minha empresa → Excluir conta`) — a
  Apple exige desde 2022 para qualquer app com cadastro
- **Diretriz 3.1.1 no redirecionamento**: `destinoAposLogin` nunca manda quem
  está no app iOS para o checkout próprio (`/assinar`, `/trial-vencido`)
- **Diretriz 4.8**: os botões de login social existem e estão DESLIGADOS
  (`lib/login-social.ts`). Se forem ligados, o Sign in with Apple passa a ser
  obrigatório junto — está documentado lá.
- O contrato do In-App Purchase escrito e comentado (`lib/iap.ts`), com os ids
  de produto já definidos:
  `br.com.mimu.app.pro.mensal`, `.pro.anual`, `.premium.mensal`, `.premium.anual`
- `assinaturas.origem` e `pagamentos.origem` já aceitam `'apple'` no banco

---

## 4. O que FALTA, e é trabalho de verdade

### 4.1 O projeto nativo não existe

Não há pasta `ios/`. O primeiro passo é:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 4.2 A ponte de compra nativa (`MimuIAP`) — o item maior

`lib/iap.ts` define uma interface que **nenhum código nativo implementa
ainda**. Enquanto `window.MimuIAP` for `undefined`, a tela de plano mostra
"Assinatura pelo app ainda não está disponível nesta versão" — de propósito,
para não oferecer um botão que não faz nada.

O plugin Swift precisa expor, em `window.MimuIAP`:

| Método                      | O que faz                                                             |
| --------------------------- | --------------------------------------------------------------------- |
| `comprar(produtoId)`        | Abre o StoreKit e devolve `{ ok, transactionId?, erro? }`             |
| `precoFormatado(produtoId)` | O preço **como a Apple formata** — a faixa dela pode não ser R$ 39,90 |
| `restaurar()`               | Exigido pela 3.1.1 para assinatura                                    |
| `abrirGerenciamento()`      | Leva a Ajustes → Assinaturas                                          |

Os comentários em `lib/iap.ts` explicam o porquê de cada um. Vale ler antes.

### 4.3 A conferência do recibo no servidor

**Não existe.** Não há rota de API que fale com a App Store Server API.

`lib/iap.ts` é explícito sobre a regra: o acesso **nunca** pode ser liberado
porque o `transactionId` chegou ao navegador — o navegador é território de quem
usa o aparelho. Quem libera tem que ser o servidor, conferindo contra a Apple.

Falta escrever essa rota, no mesmo formato das que já existem em
`app/api/pagamento/`.

### 4.4 O botão "Restaurar compras" não está na tela

`restaurar()` está no contrato, mas `PlanoSection.tsx` não oferece o botão. A
Apple reprova assinatura sem caminho de restauração.

### 4.5 A versão

`package.json` está em `0.1.0`. Um primeiro envio normalmente vai como `1.0.0`.

---

## 5. Duas coisas de ambiente que não são do app

- **Notificações push não funcionam hoje**: faltam `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  e `VAPID_PRIVATE_KEY` no painel da Hostinger. A pública é gravada na
  compilação — defini-la sem recompilar não resolve.
- **O worker do WhatsApp é um processo separado** do site (`Procfile`: `web` e
  `worker`). O `DEPLOY-WHATSAPP.md` deste repositório descreve a Railway, que
  não é mais usada — está desatualizado e precisa ser reescrito para a
  Hostinger.
