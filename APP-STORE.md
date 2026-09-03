# Subir a Mimu na App Store

Para quem vai fazer o envio. Escrito em 02/09/2026, a partir do estado real do
repositório — não de intenção.

---

## 1. Qual repositório

**`github.com/zanettizmax-boop/mimu`** — é dele que a Hostinger publica o
mimu.pro. Mudança que não chega nesse repositório não chega no ar.

### O espelho entre os dois repositórios

Existe um segundo repositório, `github.com/moreiraxy/mimu`, na conta pessoal da
Rayssa. Ele é a cópia de segurança: a hospedagem e o repositório principal
estão na conta do diretor da Fortis, que é quem paga, e a cópia existe para o
dia em que aquele acesso acabar.

Até 02/09/2026 os dois eram sincronizados por uma **configuração local** na
máquina dela (o `origin` com duas URLs de push). Funcionava só ali: qualquer
outra pessoa que clonasse e desse push atualizaria um repositório e o outro
ficaria para trás, sem erro nenhum.

Agora existe `.github/workflows/espelhar.yml`, que copia `main` daqui para a
cópia pessoal a cada push. **Falta ligar**, e são dois campos no painel deste
repositório (Settings → Secrets and variables → Actions):

| Onde          | Nome            | Valor                                                                                                                                                                                             |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Secrets**   | `TOKEN_ESPELHO` | Um Personal Access Token da conta que tem escrita em `moreiraxy/mimu`. Criar em github.com/settings/tokens → Fine-grained → repositório `moreiraxy/mimu` → permissão **Contents: Read and write** |
| **Variables** | `REPO_ESPELHO`  | `moreiraxy/mimu`                                                                                                                                                                                  |

Duas escolhas dele que valem saber:

- **A direção é daqui para lá.** Se o espelho falhar, o que envelhece é a
  cópia de segurança e o site continua publicando. Na direção inversa, a mesma
  falha pararia os deploys.
- **Não usa `--force`.** Se os dois divergirem, a ação **falha e manda
  e-mail**, em vez de sobrescrever. Espelho que apaga em silêncio um commit que
  só existe do outro lado não é cópia de segurança.

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

## 4. O que falta — e o que já foi feito depois desta lista

### 4.1 O projeto nativo — do dev

Não há pasta `ios/`, e ela não podia ser gerada aqui: a máquina da Rayssa não
tem Xcode nem CocoaPods. É o primeiro passo na máquina de quem for enviar:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 4.2 O plugin de compra nativa — PRONTO, falta instalar

`ios-plugin/MimuIAP/` tem os dois arquivos, escritos com **StoreKit 2**:

- `MimuIAP.swift` — comprar, preço formatado, restaurar, abrir gerenciamento
- `MimuIAP.m` — o registro que o Capacitor lê. **Sem este arquivo o plugin
  compila e some em tempo de execução**: `window.MimuIAP` fica `undefined` e a
  tela conclui que não há caminho de compra. É a falha mais silenciosa de um
  plugin de Capacitor.

Para instalar, depois do `npx cap add ios`: arraste os dois para o target
**App** no Xcode (marcando "Copy items if needed"). Quando o Xcode perguntar
pelo bridging header, aceite.

O lado JavaScript já está ligado: `components/providers/PonteIAP.tsx` registra
o plugin em `window.MimuIAP` — só dentro do app iOS, por import dinâmico, para
não pesar o bundle de quem abre pelo navegador.

**Falta no App Store Connect**: criar os quatro produtos com estes ids exatos
(`lib/iap.ts`), e uma assinatura precisa de um **grupo de assinatura**:

```
br.com.mimu.app.pro.mensal        br.com.mimu.app.pro.anual
br.com.mimu.app.premium.mensal    br.com.mimu.app.premium.anual
```

### 4.3 A conferência do recibo — PRONTA, faltam as credenciais

`lib/apple-store-server.ts` fala com a App Store Server API, e
`app/api/pagamento/apple/route.ts` é a rota que libera o acesso. Pergunta à
produção e cai para a sandbox se a Apple não conhecer a transação — é o que
faz a compra de teste da REVISÃO funcionar.

Nada do que o app manda libera coisa alguma: o `transactionId` é só um
protocolo para o servidor perguntar à Apple. A data de validade vem da resposta
dela, não da nossa conta de "mais um mês".

Falta pôr no ambiente da Hostinger (App Store Connect → Usuários e Acesso →
Integrações → Chaves):

```
APPLE_ISSUER_ID     o "Issuer ID" no topo daquela página
APPLE_KEY_ID        o id da chave criada ali
APPLE_PRIVATE_KEY   o conteúdo do .p8 — ele só pode ser baixado UMA vez
APPLE_BUNDLE_ID     br.com.mimu.app
```

Sem elas a rota responde **502** e grava `apple_compra_recusada` com o motivo
`indisponivel` — de propósito, para "a Apple recusou" não se confundir com
"não conseguimos perguntar".

### 4.4 "Restaurar compras" — PRONTO

`Minha empresa → Plano`. Só aparece dentro do app da Apple; no site não teria o
que fazer.

### 4.5 A versão — PRONTO

`package.json` em `1.0.0`. Ela aparece no rodapé de Minha Empresa.

## 5. Duas coisas de ambiente que não são do app

- **Notificações push não funcionam hoje**: faltam `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  e `VAPID_PRIVATE_KEY` no painel da Hostinger. A pública é gravada na
  compilação — defini-la sem recompilar não resolve.
- **O worker do WhatsApp é um processo separado** do site (`Procfile`: `web` e
  `worker`). O `DEPLOY-WHATSAPP.md` deste repositório descreve a Railway, que
  não é mais usada — está desatualizado e precisa ser reescrito para a
  Hostinger.
