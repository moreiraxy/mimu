# Subir a Mimu na App Store

Para quem vai fazer o envio. Escrito em 02/09/2026, a partir do estado real do
repositório — não de intenção. Atualizado em 04/09/2026, ao fim de um dia em
que o app saiu de "invólucro que abre num site" para algo que se comporta como
aplicativo: o projeto nativo passou a existir, seis plugins entraram, e vários
defeitos que só aparecem no aparelho foram encontrados e corrigidos.

**A conta que publica é a pessoal de Igor Moreira, time `J9WLAKA2FM`.** É onde
o bundle `br.com.mimu.app` está registrado e o que o `DEVELOPMENT_TEAM` do
projeto grava. Consequência que não é técnica: app, avaliações, base instalada
e receita das assinaturas ficam vinculados a essa conta, não à empresa. O App
Store Connect permite transferir depois, com condições.

---

## 0. Estado: ENVIADO para revisão em 11/09/2026, 16h16 — build 2

O build 1 foi enviado e REPROVADO pela 3.1.2, corrigido, reenviado — e depois
retirado por um defeito pior, que só apareceu no TestFlight: **ele não
conseguia comprar nada**. Ver §0.1.

## 0.1 O plugin de compra que não era carregado

Sintoma: tocar em "Fazer upgrade" no TestFlight e nada acontecer. O motivo
estava sendo engolido por um `return` silencioso em PlanoSection.tsx, que
tratava QUALQUER falha como desistência da pessoa. Corrigido isso, a mensagem
apareceu:

    "MimuIAP" plugin is not implemented on iOS

A classe ESTAVA no binário — conferido com `otool -ov` dentro do próprio IPA
enviado, conformando com CAPBridgedPlugin e expondo `comprar:`. O que faltava
era o registro: o Capacitor 6 instancia apenas as classes de
`packageClassList`, e essa lista é GERADA pelo `cap sync` a partir dos pacotes
npm. O MimuIAP entra por referência de arquivos, não como pacote — então o
sync o descartava toda vez.

O engano é bem montado: `registerPlugin` cria `window.MimuIAP` do lado JS sem
consultar o nativo, então `caminhoDeCompra()` respondia "iap" e o botão
aparecia normalmente.

Declarar a lista em capacitor.config.ts NÃO resolve — testado, o CLI
sobrescreve. `scripts/registrar-mimuiap-ios.mjs` a repõe depois do sync,
`npm run sync:ios` encadeia os dois, e
`testes/plugin-iap-registrado.test.ts` falha se o plugin sumir da lista.

**Nenhuma compra foi exercitada de ponta a ponta ainda.** O build 2 corrige a
causa, mas a confirmação depende de instalar pelo TestFlight e comprar em
sandbox num aparelho físico.

## 0.2 Envio atual

Seis itens foram enviados juntos e estão **Aguardando revisão** (até 48h):
o app iOS 1.0 (build 1), o grupo "Planos Mimu" e as quatro assinaturas.

    ID Apple do app   6809525205
    Bundle            br.com.mimu.app
    Time              J9WLAKA2FM

Houve um primeiro envio às 23h23 de 10/09, retirado pouco depois para trocar
as capturas. Detalhe que custa uma hora a quem não souber: **a Apple TRAVA a
lista de capturas no instante do envio** — some o campo de arquivo, somem os
controles de apagar, e arrastar deixa de funcionar, inclusive à mão. Só o
texto (descrição, palavras-chave, URLs) continua editável. Para mexer numa
imagem é preciso remover a versão da revisão, e isso desvincula o grupo e as
assinaturas: as cinco precisam ser readicionadas ao rascunho antes de reenviar.

A ordem das capturas também não se resolve arrastando: a lista ignora entrada
sintética E manual. O que funciona é apagar todas e subir UMA DE CADA VEZ,
esperando cada upload concluir — a ordem final é a ordem de conclusão.

### Reprovado uma vez, pela 3.1.2 — corrigido em 11/09/2026

A primeira revisão recusou com **3.1.2 Business: Payments - Subscriptions**.
A mensagem foi automática e específica:

> The submission offers auto-renewable subscriptions (...) but does not include
> a functional link to the Terms of Use (EULA) in the app metadata that appears
> on the app's App Store product page.

Não era sobre o app: faltava, NA DESCRIÇÃO da loja, um link para os Termos de
Uso. A descrição ganhou um bloco ASSINATURA com nome, duração, preço dos quatro
planos, as condições de renovação e três links — os termos da Mimu, a política
de privacidade e o EULA padrão da Apple. Os três, e não um, porque o app está
configurado com o contrato padrão da Apple enquanto a Mimu tem termos próprios;
linkar só um dos dois deixaria margem para outra recusa.

Aproveitando: a mesma diretriz exige as condições DENTRO do app, antes da
compra, e a tela de assinatura não as mostrava. Isso foi corrigido em
`PlanoSection.tsx` — e, por ser tela web e não nativa, subiu por deploy, sem
build novo e sem mexer no envio em andamento.

O que ficou fora, de propósito ou por limite:

- **A compra pelo StoreKit nunca foi exercitada de ponta a ponta.** O
  simulador não carrega produtos sem um arquivo de configuração do StoreKit, e
  o sandbox exige aparelho físico com conta de teste. O caminho do servidor
  está coberto por testes; o do aparelho, não.
- **"Mensal com compromisso de 12 meses"** ficou sem disponibilidade nas duas
  assinaturas anuais. É uma segunda faixa de cobrança que a Mimu não vende — a
  faixa "1 ano antecipado" está com o Brasil marcado, que é a que importa.

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

### A camada nativa, que em 04/09 não existia

`packageClassList` era `[]` — nenhum plugin. O comentário do
`capacitor.config.ts` dizia que push, câmera, Face ID e haptics respondiam pela
diretriz 4.2, e nada daquilo existia: o Face ID é WebAuthn, o push era Web Push
(que não roda em WKWebView), e o haptics era `navigator.vibrate`, API que o
Safari nunca implementou — a chamada não dava erro, simplesmente não fazia nada.

Hoje: `@capacitor/app`, `haptics`, `keyboard`, `push-notifications`,
`splash-screen` e `status-bar`, mais o plugin próprio de IAP em StoreKit 2. O
acesso passa por `lib/nativo.ts`, com import dinâmico — os plugins não entram
no bundle de quem abre pelo navegador, e isso foi conferido no build.

### A porta de entrada

O app abria na LANDING. `ehAppIOS()` já existia e já rodava no servidor, mas os
sete usos dela eram sobre cobrança; nenhum sobre roteamento. Agora o middleware
manda quem abre pelo aplicativo para `/comecar` (deslogado) ou `/dashboard`
(logado), e a landing nunca aparece lá dentro — o que também fecha um flanco da
3.1.1, já que ela mostra preços e leva ao checkout próprio.

### O que só se descobre no aparelho

Dois defeitos que passaram por typecheck, lint e build, e só apareceram no
iPhone:

**Faltava `viewport-fit=cover` no meta viewport.** Sem ele
`env(safe-area-inset-*)` vale ZERO em todo lugar — e o app usa
`statusBarStyle: "black-translucent"`, que manda o conteúdo passar por baixo da
barra de status de propósito. Sobrava só a metade que empurra para cima: o nome
da pessoa ficava atrás do relógio. Tirar essa linha desliga a área segura do
app inteiro, sem erro em lugar nenhum.

**A regra dos 16px nos campos não vencia.** `input` tem especificidade (0,0,1) e
`text-sm` tem (0,1,0): a classe ganha do elemento sempre. A regra valia
exatamente nos campos que já estavam certos. Hoje ela é `!important`, e o
comentário em `app/globals.css` explica que não é escolha de estilo — abaixo de
16px o iOS amplia a tela ao tocar no campo, e dentro do app não há barra de
endereço com o "aA" para desfazer.

### O aplicativo é de iPhone, e só

`TARGETED_DEVICE_FAMILY` era `"1,2"`, herdado do template — o que significa que
a Apple revisaria num iPad que ninguém nunca abriu. A navegação inferior é
`max-w-[430px]` fixa e viraria uma barrinha perdida numa tela grande. Hoje é
`1`. Acrescentar iPad depois é indolor; tirar depois não é, porque quem já
tivesse instalado perderia o app.

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

## 5. O que falta para enviar, em ordem

O que trava não é código. Está tudo escrito e no ar; o que falta são chaves e
cadastros que só quem tem acesso à conta pode criar.

### 5.1 O que REPROVA a revisão

**As credenciais do recibo, no ambiente da Hostinger.** Sem
`APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` e `APPLE_BUNDLE_ID`, a
rota `app/api/pagamento/apple/route.ts` responde **502** e nenhuma assinatura é
liberada. O revisor da Apple compra de verdade para testar: ele vai pagar, nada
vai acontecer, e isso é reprovação certa na 3.1.1.

**Os quatro produtos no App Store Connect**, com os ids exatos de `lib/iap.ts`,
dentro de um grupo de assinatura. Sem eles `comprar()` devolve
`produto_desconhecido`.

### 5.2 O material da loja, que ninguém tinha listado

App Privacy (a "nutrition label"), capturas de tela e a nota de revisão
explicando que a assinatura é vendida por In-App Purchase.

**Conta de demonstração — PRONTA em 10/09/2026.** Criada em produção:

    e-mail    apple.review@mimu.pro
    senha     em ~/Desktop/mimu-conta-apple.txt (fora do repositório)
    empresa   Studio Bia — 58d6b9c4-49e2-4fec-89b3-4abdc3851b88
    usuária   1b45d571-6b6b-48a8-8995-38c85778e9f2

Nasceu pelo caminho real, não por atalho: a usuária foi criada pela Admin API
e o gatilho `on_auth_user_created` criou a empresa, como em qualquer cadastro.
Os passos seguintes repetem `app/onboarding/actions.ts` na mesma ordem.

Está em **teste de 7 dias**, de propósito. Uma conta já `ativa` esconderia a
tela de assinatura, e é justamente ali que o revisor precisa chegar para testar
o In-App Purchase.

Tem 8 clientes, 6 produtos (2 abaixo do mínimo, para o alerta de estoque
aparecer), 170 transações cobrindo 59 dias, 27 agendamentos (8 concluídos, 19
à frente) e uma conta a pagar em aberto. Conferido pela sessão da própria
usuária, passando pelo RLS — não pela service role.

Para apagar: remova a usuária no painel do Supabase; o resto cai em cascata.

### 5.2.1 Prazo do iOS 15 — anotado, não urgente

O envio do primeiro build passou com este aviso:

    MinimumOSVersion too low. This app has a MinimumOSVersion of 13.0.
    Starting in Spring 2027, all iOS apps must have a MinimumOSVersion
    of 15.0 or later.

Não foi corrigido de propósito. Hoje 13.0 é legal e alcança mais aparelhos;
subir o mínimo agora só encolheria o público. O ajuste
(`IPHONEOS_DEPLOYMENT_TARGET`) precisa entrar em algum envio antes da primavera
de 2027 — depois disso a Apple recusa o upload.

### 5.3 Push por APNs — código pronto, faltam as chaves

`lib/push-apns.ts` fala com o APNs reaproveitando o assinador ES256 de
`lib/apple-store-server.ts`. Duas armadilhas já resolvidas ali, que valem
conhecer antes de mexer:

- **HTTP/2 é obrigatório.** O `fetch` do Node só fala 1.1 — escrever
  `fetch("https://api.push.apple.com/...")` compila, tipa, e falha em produção.
  Por isso `node:http2`.
- **`dsaEncoding: "ieee-p1363"`.** Sem ele o Node assina em DER e a Apple
  devolve 403 sem dizer por quê.

Falta: a chave APNs (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`,
`APNS_TOPIC`) e o entitlement `aps-environment` em
`ios/App/App/App.entitlements` — o arquivo já existe, hoje só com
`associated-domains`.

**Web Push continua sem funcionar** por falta de `VAPID_PRIVATE_KEY`, e isso é
independente: desde 04/09 os dois transportes são separados em `lib/push.ts`,
então a falta de uma chave da web não cala mais a notificação do aplicativo.

### 5.4 Universal Link — as duas metades

O link de confirmação de e-mail abria no Safari, e a sessão nascia lá: a
WKWebView tem cookies SEPARADOS do navegador, então o cadastro feito no app não
tinha como ser concluído.

Funciona quando as duas metades existem:

1. `APPLE_TEAM_ID` no ambiente — a rota
   `app/.well-known/apple-app-site-association/route.ts` devolve **404** sem
   ela, de propósito: um AASA servido com o time errado é pior que a ausência,
   porque o iOS guarda a recusa até o app ser reinstalado.
2. O entitlement `applinks:mimu.pro`, que já está no projeto.

**O iOS busca esse arquivo na INSTALAÇÃO do app.** Configurar a variável depois
não conserta quem já instalou — é preciso reinstalar.

### 5.5 Banco — APLICADO em 10/09/2026

`supabase/APLICAR-EM-PRODUCAO.sql` já foi rodado em produção. Fica aqui porque
é idempotente e serve de referência do que mudou.
Acrescenta a coluna `tipo` em `push_subscriptions`, que separa Web Push de
APNs. É idempotente — verificado rodando contra um banco que já a tinha.

PENDENTE AINDA: regerar `types/database.ts` pelo Supabase. Ele foi editado à
mão para acompanhar a migration, e o conteúdo confere — mas o arquivo é gerado,
e um arquivo gerado editado à mão envelhece na próxima geração de alguém.

### 5.6 Uma coisa que não é do app

O worker do WhatsApp é um processo separado do site (`Procfile`: `web` e
`worker`). O `DEPLOY-WHATSAPP.md` descreve a Railway, que não é mais usada —
está desatualizado e precisa ser reescrito para a Hostinger.
