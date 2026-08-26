#!/bin/zsh
# Captura cada arte da prancheta em 2x. O id vira o nome do arquivo.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML="file://$PWD/Mimu%20Cakto.dc.html"
render() {  # render <id> <larg> <alt> <saida>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --virtual-time-budget=8000 \
    --window-size=$2,$3 --screenshot="$4" "$HTML?art=$1" 2>/dev/null
  print "$4 -> $(sips -g pixelWidth -g pixelHeight "$4" 2>/dev/null | tail -2 | tr -d ' \n')"
}
render cakto-capa    540 540 mimu-cakto-capa.png
render cakto-pilares 540 540 mimu-cakto-pilares.png
render cakto-app     540 540 mimu-cakto-assistente.png
render cakto-verde   540 540 mimu-cakto-verde.png
render cakto-wide    600 314 mimu-cakto-horizontal.png

# 300x250: desenhado 1:1, exportado no tamanho exato e em @2x para retina
render1x() {
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --virtual-time-budget=8000 \
    --window-size=$2,$3 --screenshot="$4" "$HTML?art=$1" 2>/dev/null
  print "$4 -> $(sips -g pixelWidth -g pixelHeight "$4" 2>/dev/null | tail -2 | tr -d ' \n')"
}
render1x cakto-300-a 300 250 mimu-cakto-300x250-a.png
render1x cakto-300-b 300 250 mimu-cakto-300x250-b.png
render   cakto-300-a 300 250 mimu-cakto-300x250-a@2x.png
render   cakto-300-b 300 250 mimu-cakto-300x250-b@2x.png
