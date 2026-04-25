// ═══════════════════════════════════════════════════════════
// VEEDA Service Worker — Network-first com fallback offline
// Estratégia: tenta rede primeiro; se falhar (offline), usa cache.
// Atualização: novo deploy é detectado automaticamente pelo
// version.json (verificado pelo client antes do render).
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = "veeda-runtime";

self.addEventListener("install", (e) => {
  // Ativa imediatamente, sem esperar abas antigas fecharem
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
  if (e.data === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Sempre rede primeiro. Cache é só fallback offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // NUNCA cachear version.json — é o sentinela de versão
  if (url.pathname.endsWith("/version.json")) {
    e.respondWith(fetch(e.request, { cache: "no-store" }));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        // Só cacheia respostas válidas e do mesmo origin
        if (resp && resp.status === 200 && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match("./index.html")))
  );
});

self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Veeda", {
      body: data.body || "Você tem uma nova mensagem.",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
    })
  );
});
