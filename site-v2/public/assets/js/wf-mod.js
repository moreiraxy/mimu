/* Detector de JS/touch do Webflow. No site original roda inline no <head> e
   adiciona as classes w-mod-js / w-mod-touch em <html>.

   Fica num arquivo em vez de inline de propósito: com strategy="beforeInteractive"
   o next/script só injeta no HTML inicial sem renderizar um <script> na árvore
   do React quando recebe `src`. Inline (children ou dangerouslySetInnerHTML) o
   elemento entra na árvore e o React 19 avisa que scripts renderizados por
   componente nunca executam no cliente. Código preservado 1:1 do clone. */
!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
