// Service worker da Mimu: cache para modo offline + push notifications reais.
// Fica em /public pra ser servido na raiz (escopo "/") sem config extra do Next.

// Subir este número apaga os caches antigos no `activate` (ver abaixo). Foi
// preciso subir porque a versão v2 guardou o ícone da marca antiga em modo
// cache-first, e quem tinha o app instalado continuava vendo o coral na aba
// mesmo com o arquivo novo no servidor.
//
// v4, 15/10/2026, pelo MESMO motivo e com o mesmo sintoma: o ícone virou
// grafite e a notificação continuava chegando com o néon, porque /icon.svg
// estava no precache deste worker. "a notificação ainda está aparecendo com a
// logo antiga" — e estava mesmo, servida daqui.
const CACHE_VERSION = "mimu-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // precache é um bônus — nunca deve travar a instalação do worker.
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => chave.startsWith("mimu-") && chave !== STATIC_CACHE)
            .map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Só o que o build gera com hash no nome pode ser cache-first: esses arquivos
 * são imutáveis por construção, porque qualquer mudança gera outro nome.
 *
 * /icon.svg e /manifest.webmanifest saíram daqui de propósito. O caminho
 * deles nunca muda, mas o conteúdo muda — e `cacheFirst` nunca revalida.
 * Na prática, quem instalou o app antes da troca de marca ficou com o ícone
 * antigo preso para sempre. Agora eles passam por `networkFirst`: buscam o
 * atual e só caem no cache se estiver sem conexão.
 */
function ehAssetEstatico(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    ehAssetEstatico(url) ? cacheFirst(request) : networkFirst(request),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const emCache = await cache.match(request);
  if (emCache) return emCache;

  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch (erro) {
    if (emCache) return emCache;
    throw erro;
  }
}

/** Páginas e dados: tenta a rede primeiro (nunca serve algo desatualizado sem tentar), cai pro cache se offline. */
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch (erro) {
    const emCache = await cache.match(request);
    if (emCache) return emCache;
    throw erro;
  }
}

// --- Push notifications reais (background) ---

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Mimu", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Mimu", {
      body: data.body || "",
      /*
       * PNG, e não SVG.
       *
       * Chrome no Android e vários sistemas simplesmente NÃO desenham SVG em
       * notificação: o ícone some e sobra o símbolo genérico do navegador —
       * que é o que parece "logo antiga" para quem recebe.
       *
       * O badge é outro arquivo de propósito: ele é usado como MÁSCARA na
       * barra de status (só o alfa conta, a cor é descartada), então a placa
       * cheia viraria um quadrado branco. badge-96 tem só o traço do "M" sobre
       * transparente. Ver scripts/gerar-icones-web.mjs.
       */
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes(url) && "focus" in cliente) {
          return cliente.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
