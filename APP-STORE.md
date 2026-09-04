# Subir a Mimu na App Store

Para quem vai fazer o envio. Escrito em 02/09/2026, a partir do estado real do
repositório — não de intenção. Atualizado em 04/09/2026, quando o projeto
nativo passou a existir (§4.1) e o plugin de compra entrou no target (§4.2).

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
cópia pessoal a cada push. **Está ligado e funcionando** desde 03/09/2026 —
conferido disparando a ação de verdade e lendo o log, e não só validando o
arquivo.

Os dois campos que o fazem funcionar, no painel deste repositório
(Settings → Secrets and variables → Actions):

| Onde          | Nome            | Valor                                                                                                                                                                                             |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Secrets**   | `TOKEN_ESPELHO` | Um Personal Access Token da conta que tem escrita em `moreiraxy/mimu`. Criar em github.com/settings/tokens → Fine-grained → repositório `moreiraxy/mimu` → permissão **Contents: Read and write** |
| **Variables** | `REPO_ESPELHO`  | `moreiraxy/mimu`                                                                                                                                                                                  |

Duas escolhas dele que valem saber:

- **A direção é daqui para lá.** Um detalhe que derrubou a primeira tentativa e não estava óbvio: o
`actions/checkout` guarda a credencial dele num cabeçalho global do git, com a
identidade do robô do GitHub, e esse cabeçalho VENCE o token da URL do push. O
erro que aparecia era "Permission denied to github-actions[bot]", que parece
falta de permissão no token — quando o token nem chegava a ser usado. Resolvido
com `persist-credentials: false`.

Se o espelho falhar, o que envelhece é a
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

### 4.1 O projeto nativo — FEITO

A pasta `ios/` existe e está versionada, gerada em 04/09/2026 com Xcode 26.6 e
CocoaPods 1.17. Quem clona o repo já a encontra pronta:

```bash
npm install
npx cap sync ios     # traz o pod install e o app-shell para dentro do projeto
npx cap open ios
```

**`npx cap add ios` não se roda de novo.** Ele recria o projeto do zero e leva
junto tudo que tiver sido configurado lá dentro — inclusive o plugin de §4.2.

O que foi versionado é só o projeto. O `.gitignore` que o Capacitor gera dentro
de `ios/` deixa de fora `Pods/`, `build/`, `DerivedData` e os arquivos de
config gerados; é o `npx cap sync ios` acima que reconstrói essa parte depois
do clone.

Para rodar no simulador sem abrir o Xcode:

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' \
  CODE_SIGNING_ALLOWED=NO build
```

Se o `xcodebuild` responder que "requires Xcode", o `xcode-select` está
apontando para as Command Line Tools e não para o Xcode. Conserta com
`sudo xcode-select -s /Applications/Xcode.app`, ou sem sudo exportando
`DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`.

### 4.2 O plugin de compra nativa — INSTALADO

`ios-plugin/MimuIAP/` tem os dois arquivos, escritos com **StoreKit 2**:

- `MimuIAP.swift` — comprar, preço formatado, restaurar, abrir gerenciamento
- `MimuIAP.m` — o registro que o Capacitor lê. **Sem este arquivo o plugin
  compila e some em tempo de execução**: `window.MimuIAP` fica `undefined` e a
  tela conclui que não há caminho de compra. É a falha mais silenciosa de um
  plugin de Capacitor.

Os dois estão no target **App** desde 04/09/2026, e **por referência**: o grupo
no Xcode aponta para `../../ios-plugin/MimuIAP`, com os fontes seguindo fora de
`ios/`. Não foram copiados de propósito — `ios/` é versionado, e uma cópia lá
dentro seria uma segunda verdade sobre o mesmo plugin, livre para divergir sem
ninguém notar. Editar `ios-plugin/MimuIAP/` é o que muda o build.

Não existe bridging header, e não é esquecimento: o `CAP_PLUGIN` resolve a
classe Swift em tempo de execução, então os dois arquivos compilam sem ele.

Como conferir que o registro do `.m` sobreviveu à compilação — a falha descrita
acima, que não aparece em erro nenhum:

```bash
APP=<DerivedData>/Build/Products/Debug-iphonesimulator/App.app
nm -a "$APP/App" "$APP/App.debug.dylib" 2>/dev/null | grep CAPPluginCategory
```

Tem que listar `identifier`, `jsName` e `pluginMethods`. Se não listar, o `.m`
saiu do target e `window.MimuIAP` vai ficar `undefined` no aparelho.

Os dois binários no comando não são exagero: em Debug o Xcode põe o código num
`App.debug.dylib` ao lado, e o `App` fica praticamente vazio; em Release, que é
o que vai para a loja, o dylib não existe e tudo está no `App`. Olhar só um dos
dois dá "não encontrei" em metade dos casos, sem o plugin ter problema nenhum.
O `2>/dev/null` engole a reclamação sobre o arquivo que não existe naquela
configuração. Conferido nas duas em 04/09/2026.

O lado JavaScript já está ligado: `components/providers/PonteIAP.tsx` registra
o plugin em `window.MimuIAP` — só dentro do app iOS, por import dinâmico, para
não pesar o bundle de quem abre pelo navegador.

**Os argumentos vão em objeto**: `comprar({ produtoId })`, nunca
`comprar(produtoId)`. O proxy do `registerPlugin` usa o primeiro argumento
inteiro como o dicionário de options que o Swift lê em
`call.getString("produtoId")` — a string solta chega como algo que não é
dicionário, o nativo devolve `produto_ausente` e a tela trata como desistência
da pessoa. Foi assim até 04/09/2026, quando `lib/iap.ts` passou a exigir o
objeto no próprio tipo.

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
