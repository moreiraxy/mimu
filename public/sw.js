// Service worker da Mimu: cache para modo offline + push notifications reais.
// Fica em /public pra ser servido na raiz (escopo "/") sem config extra do Next.

const CACHE_VERSION = "mimu-v1";
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

/** JS/CSS/fontes/ícones gerados pelo build — cache first, praticamente imutáveis. */
function ehAssetEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/manifest.webmanifest"
  );
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
      icon: "/icon.svg",
      badge: "/icon.svg",
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
