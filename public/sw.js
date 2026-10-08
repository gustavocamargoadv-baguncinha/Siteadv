// Service worker do PWA: cache básico para abrir rápido e suportar oscilações
// de rede. Os dados do modo demo já vivem no localStorage, então o app segue
// utilizável offline depois da primeira visita.
//
// v3 — a v2 guardava TUDO que não fosse navegação com "cache primeiro",
// inclusive o roteiro das páginas que o Next busca ao clicar num link
// (`/clientes/x?_rsc=…`). Esse roteiro aponta para o código da página. Depois
// de cada publicação, a página aberta pelo menu continuava rodando a versão
// antiga para sempre: os dados vinham novos do banco, mas a tela era a de
// antes — a ficha da Tainah mostrava os lançamentos novos sem os quadros.
//
// Trocar o nome do cache faz a v3, ao assumir, apagar tudo que a v2 guardou.
const CACHE = "camargo-adv-v3";
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // Sem skipWaiting automático: a nova versão fica "esperando" até o usuário
  // tocar em "Atualizar" (o app envia a mensagem SKIP_WAITING abaixo).
});

// Ativa a nova versão quando o app pede (botão "Atualizar").
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Rede primeiro; o cache só responde quando a rede falha (offline). */
function redePrimeiro(request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    })
    .catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // Roteiro de página do Next (navegação por link) e API: nunca do cache. Muda
  // a cada publicação e a cada dado novo — servir guardado é servir mentira.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") || url.pathname.startsWith("/api/")) return;

  // Navegação: rede primeiro, cache como fallback (app continua abrindo offline)
  if (request.mode === "navigate") {
    event.respondWith(redePrimeiro(request).then((r) => r || caches.match("/")));
    return;
  }

  // Código do Next com hash no nome: o arquivo NUNCA muda — uma versão nova
  // ganha nome novo. Aqui, e só aqui, "cache primeiro" é seguro.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Todo o resto (ícones, logo, manifest): rede primeiro, cache se offline.
  event.respondWith(redePrimeiro(request));
});
