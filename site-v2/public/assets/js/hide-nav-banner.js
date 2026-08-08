/* Aplica a classe de banner escondido antes da pintura, como no site original.
   O listener de clique que grava a flag fica em components/behaviors/nav-banner.

   Em arquivo, e não inline, pelo mesmo motivo do wf-mod.js: inline o <script>
   entra na árvore do React e o React 19 avisa. Código preservado 1:1. */
if (sessionStorage.getItem("hide-nav-banner") === "true") {
  document.documentElement.classList.add("hide-nav-banner");
}
