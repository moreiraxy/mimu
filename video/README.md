# Vídeo de apresentação da Mimu

Vídeo de 30 segundos em dois formatos: 9:16 para Reels e Stories, 16:9 para o
site e o YouTube. Feito com [Remotion](https://remotion.dev), que é vídeo
escrito em React: cada quadro é um render, e o arquivo final sai de uma
composição, não de uma gravação de tela.

O texto que você narra está em [ROTEIRO.md](ROTEIRO.md).

## Por que fica fora do app

Este projeto tem o próprio `package.json` e está no `.railwayignore`. O
Remotion baixa um Chrome próprio e passa de 400 MB de dependências que o app
não usa, e o build do Railway já é sensível o bastante sem carregar isso junto.

## Rodar

```sh
cd video
npm install

# Ver e mexer no vídeo com pré-visualização ao vivo
npm run studio

# Gerar os arquivos
npm run render:vertical     # out/mimu-9x16.mp4
npm run render:horizontal   # out/mimu-16x9.mp4
```

Se o render reclamar que não achou navegador, aponte para o Chrome instalado:

```sh
npx remotion render Vertical out/mimu-9x16.mp4 --concurrency=1 \
  --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

A concorrência 1 não é capricho: com mais de um processo, o Chrome comum (que
não é o headless shell que o Remotion baixaria) trava no carregamento e o
render morre no primeiro quadro.

## O que muda onde

| Quero mudar | Arquivo |
| --- | --- |
| O texto e o tempo de cada trecho | `src/roteiro.ts` |
| Cores, fontes, tamanho por formato | `src/marca.ts` |
| Uma cena específica | `src/cenas/*.tsx` |
| Como as coisas entram e saem | `src/movimento.ts` |

Mudar `duracaoEmQuadros` de um trecho em `src/roteiro.ts` empurra todos os
seguintes sozinho: os inícios são somados a partir das durações, e não
escritos à mão. É por isso que dá para ajustar o vídeo ao seu ritmo de fala
sem reencaixar cena por cena.

## As telas do app são reais

`public/telas/` são capturas de verdade do app rodando, não desenhos. Foram
tiradas de uma conta de demonstração ("Studio Bela Rosa") com dados plausíveis
de um salão: 45 dias de movimento, seis clientes, agenda do dia e uma conversa
com a Mimu.

As quatro capturas do chat (`chat-1` a `chat-4`) são o mesmo app em quatro
momentos da conversa. Trocar entre elas é o que faz a conversa acontecer no
vídeo, em vez de desenhar balões por cima de um print parado.

Para refazer as capturas depois de mudar o app, é preciso subir o app com o
fuso ajustado para o horário aparecer de manhã (a captura foi feita com
`TZ=Pacific/Honolulu`), senão o painel mostra "boa noite" e a agenda do dia sai
vazia.
