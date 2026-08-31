# Pôr no ar: WhatsApp e cobrança recorrente

O canal está construído e testado, mas roda só no banco local. Este arquivo é
o que falta para ele existir de verdade — na ordem, porque cada passo depende
do anterior.

## 1. As migrations, em produção — FEITO em 30/08/2026

Aplicadas pelo SQL Editor. Conferido depois: as três tabelas novas existem, as
colunas novas existem, `assinaturas_plano_check` aceita `'free'`, e nenhuma
contagem mudou (14 empresas, 11 assinaturas, 10 transações, 1 cliente). Não
havia nenhuma conta `vencida`, então o único UPDATE não alcançou ninguém.

O resto desta seção fica como registro de como foi feito.

Sem elas o worker pareia normalmente e a **primeira mensagem quebra**, porque
`whatsapp_links` não existe lá.

### Caminho curto: colar no SQL Editor

Sem instalar nada, sem CLI, sem senha do banco. Abra o SQL Editor do projeto:

<https://supabase.com/dashboard/project/yzebafhugbctcdomtxry/sql/new>

Antes, rode isto sozinho para saber o que o único UPDATE vai alcançar:

```sql
select status, count(*) from public.assinaturas group by status;
```

Se aparecer `0` em `vencida`, ele não toca em ninguém.

Depois cole o arquivo `supabase/APLICAR-EM-PRODUCAO.sql` inteiro e execute.

Ele roda **dentro de uma transação**: se qualquer comando falhar, o Postgres
desfaz o resto e o banco fica exatamente como estava. E tem uma trava contra
rodar duas vezes — a segunda execução avisa "já foram aplicadas" em vez de
tentar de novo.

Validado num banco montado com as mesmas migrations que estão em produção
hoje: aplica limpo, e a segunda vez avisa.

### Caminho pelo CLI

Se preferir, e se tiver o Supabase CLI instalado:

```
supabase link --project-ref yzebafhugbctcdomtxry
supabase db push
```

O `push` lista o que vai aplicar e pede confirmação antes. Pede também a senha
do banco (Project Settings → Database → Database password).

| Migration | O que faz |
| --- | --- |
| `20260829120000_plano_gratuito` | plano `free` + converte contas vencidas |
| `20260830100000_origem_apple` | origem Apple em `pagamentos` e `assinaturas` |
| `20260830140000_whatsapp_links` | vínculo número ↔ conta |
| `20260830150000_rate_limit_whatsapp` | teto de tentativas do vínculo |
| `20260830160000_canal_mensagens` | idempotência e log |
| `20260830170000_reversao_de_operacoes` | desfazer, e o filtro na policy |

Só a primeira mexe em dado de cliente, e no dia em que foi escrita **nenhuma
conta estava vencida** — o `UPDATE` não tocaria em ninguém. Vale conferir de
novo antes de aplicar, porque trials vencem com o tempo.

## 2. As variáveis, em produção

| Variável | Onde achar | Sem ela |
| --- | --- | --- |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret | O worker recusa subir. É o que deixa a Mimu responder mantendo o RLS. |
| `NEXT_PUBLIC_WHATSAPP_MIMU` | `5511920924833` | A seção "Conectar WhatsApp" some do app. |
| `WHATSAPP_SESSAO_DIR` | o caminho do volume (passo 3) | A sessão vai para disco efêmero e o QR volta a cada deploy. |

`GROQ_API_KEY`, as chaves do Supabase e a service role já estão lá.

## 3. O worker, como serviço separado

Ele **não pode** rodar junto com o `web`: o Baileys mantém um WebSocket aberto
o tempo todo, e o processo web reinicia a cada deploy e pode hibernar ocioso.

No Railway, dentro do mesmo projeto:

1. **New → GitHub Repo**, apontando para este mesmo repositório
2. Settings → **Config-as-code**, e apontar para `railway.worker.json`
3. Copiar todas as variáveis do serviço `web` para ele

**Não adianta digitar o start command no painel.** No Railway, configuração em
arquivo vence a do painel, e o `railway.json` da raiz manda `npm run start` —
o serviço subiria uma segunda cópia do app web, verdinha e silenciosa, com o
WhatsApp sem responder. Por isso o worker tem o `railway.worker.json` só dele,
que além do start command certo:

- pula o `next build` (o worker roda por `tsx`, não precisa dele)
- só redeploya quando `worker/`, `lib/` ou `types/` mudam, para um deploy da
  landing page não derrubar uma conversa em andamento

O `Procfile` declara os dois processos (`web` e `worker`), o que serve de
documentação e funciona em plataformas que leem process types.

### O volume — não pule

O disco do Railway é **efêmero**: some a cada deploy. A sessão do WhatsApp mora
em disco, então sem um volume alguém precisa ler o QR de novo **toda vez que
o código subir**.

1. No serviço do worker: **Settings → Volumes → New Volume**
2. Mount path: `/dados`
3. `WHATSAPP_SESSAO_DIR=/dados/whatsapp-sessao`

## 4. Parear o número

Com tudo acima pronto:

```
npm run whatsapp
```

O QR aparece no terminal. No celular do **(11) 92092-4833**:
WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho.

Rodar localmente na primeira vez é mais simples do que ler QR pelo log do
Railway. A sessão gerada em `.whatsapp-sessao/` pode ser copiada para o volume
depois — ou pareie de novo direto no servidor, tanto faz.

**A pasta da sessão é credencial.** Quem tiver aqueles arquivos manda mensagem
como se fosse a Mimu. Está no `.gitignore`; não a mande por e-mail nem por
chat.

## 5. Conferir que funcionou

1. Abrir o app → Minha Empresa → **Conectar meu WhatsApp**
2. O WhatsApp abre com a mensagem pronta; enviar
3. A seção passa a mostrar "Conectado" com o número mascarado
4. Mandar "quanto vendi hoje?" — e depois um áudio com a mesma pergunta
5. Mandar "vendi 3 bolos, 45 cada" e responder **desfazer**

Se algo não responder, o log do worker diz o motivo. Queda de conexão também
vira evento no painel admin, e desconexão definitiva manda push pros admins.

---

# Cobrança recorrente no Mercado Pago

O checkout de cartão passou a criar uma **assinatura** em vez de um pagamento
avulso. Quem cobra todo mês agora é o Mercado Pago.

## O passo que não dá para esquecer

Diferente do pagamento avulso, a assinatura **não aceita `notification_url` por
requisição** — o Mercado Pago manda as notificações de recorrência para a URL
cadastrada na aplicação, no painel deles.

**Painel do Mercado Pago → Suas integrações → [a aplicação] → Webhooks**, e
cadastrar:

```
https://mimu.up.railway.app/api/pagamento/webhook
```

Com os eventos de **Assinaturas** marcados, além de Pagamentos.

Sem isso, as cobranças acontecem e nós nunca ficamos sabendo: o cartão da
pessoa é debitado todo mês e a assinatura vence no nosso banco. Ela paga e
perde o acesso — o pior desfecho possível.

## Testar antes de valer para clientes

Isto mexe em código de dinheiro que já está no ar. Antes de subir:

1. Usar credenciais de **teste** do Mercado Pago
2. Assinar com um cartão de teste deles
3. Conferir que `assinaturas.mp_subscription_id` foi gravado
4. Disparar o webhook de assinatura pelo simulador do painel
5. Conferir que `proxima_cobranca` andou

## Mensal e anual

O cartão passou a vender os dois. A escolha vira parâmetro na URL
(`/assinar?plano=pro&periodicidade=anual`), o servidor grava na assinatura, e o
preço sai da tabela dele — a URL escolhe QUAL, nunca QUANTO. Mandar valor pelo
navegador deixaria qualquer pessoa assinar o ano por um centavo.

O par que não pode se separar é **frequência + valor**:

| Periodicidade | frequency | transaction_amount |
| --- | --- | --- |
| mensal | 1 mês | valor do mês |
| anual | 12 meses | valor do ano |

Trocar um sem o outro é o erro mais caro deste código, nos dois sentidos: 12
meses com preço de um mês dá o ano por trinta dias; 1 mês com preço do ano
debita doze vezes o devido — e essa a pessoa contesta no cartão. Há teste
cobrindo isso em `testes/preco-por-periodicidade.test.ts`, incluindo uma
checagem que pega inversão de campo na tabela de preços.

Na tela, o preço grande continua sendo **por mês** mesmo no anual, com o total
do ano e a economia embaixo — "R$ 399/ano" ao lado de "R$ 39/mês" faria o anual
parecer dez vezes mais caro num relance.

## O que continua avulso

**Pix não tem recorrência** — é limitação do meio, não do código. Quem paga por
Pix continua renovando na mão.

## O que ficou de fora

Quando uma cobrança falha, o Mercado Pago tenta de novo segundo a política
dele e manda os próprios e-mails. **Nós ainda não avisamos por conta própria**
(push, WhatsApp) a cada tentativa recusada — só reagimos ao desfecho: quando o
Mercado Pago desiste e cancela, a conta cai para o plano gratuito.

---

# Risco a conferir: a chave do Mercado Pago em produção

`.env.production` **está versionado no git** e contém:

```
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

Variáveis `NEXT_PUBLIC_*` são embutidas no bundle **em tempo de build**. Se o
Railway não definir essa variável no painel, o valor de teste é o que vai para
o navegador — e o checkout de cartão em produção roda em modo de teste, sem
dinheiro real entrando.

Não consegui verificar de fora: a página de cartão exige login, então a chave
embutida não é alcançável sem sessão.

**Conferir no painel do Railway** se `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` está
definida com o valor `APP_USR-...`. Se estiver, o arquivo é inofensivo hoje —
mas continua sendo uma armadilha para o próximo deploy em outro lugar. Vale
tirar o valor de teste do arquivo versionado de qualquer forma.
