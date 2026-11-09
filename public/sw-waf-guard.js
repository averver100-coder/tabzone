/**
 * TabZone Service Worker - Network First & Cloudflare WAF Enforcement Guard
 *
 * 1. Purges any legacy Cache-First precache stores on activation.
 * 2. Enforces strict Network-First probing on app navigation and version checks.
 * 3. If Cloudflare WAF blocks the request (403/401/503) or the network fails,
 *    never falls back to cached screens—renders "네트워크 접근이 거부되었습니다".
 */

const ACCESS_DENIED_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>접근 거부</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Malgun Gothic", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    .msg {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
  </style>
</head>
<body>
  <div class="msg">네트워크 접근이 거부되었습니다</div>
</body>
</html>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => {
            // Delete all legacy workbox-precache or runtime caches to prevent stale offline rendering
            return caches.delete(name);
          })
        );
      } catch (e) {
        // Ignore cache deletion errors
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation requests (HTML entry / PWA Home Screen launch):
  // Always hit the server first (Network Only / Network First without offline HTML fallback)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request, {
            cache: 'no-store',
            credentials: 'same-origin',
          });

          // If Cloudflare WAF blocks (403, 401, etc.) or server rejects
          if (!networkResponse || !networkResponse.ok || networkResponse.status >= 400) {
            return new Response(ACCESS_DENIED_HTML, {
              status: networkResponse ? networkResponse.status : 403,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
              },
            });
          }

          return networkResponse;
        } catch (error) {
          // Network failure or blocked connection: DO NOT return cached index.html
          return new Response(ACCESS_DENIED_HTML, {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          });
        }
      })()
    );
    return;
  }

  // 2. Same-origin static assets & API requests: Network First strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request, {
            cache: 'no-cache',
          });

          // If WAF blocks with 401/403, purge caches and return the error directly
          if (networkResponse.status === 401 || networkResponse.status === 403) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            return networkResponse;
          }

          return networkResponse;
        } catch (error) {
          // Do not serve cached scripts/documents if network is unreachable/blocked
          return new Response('네트워크 접근이 거부되었습니다', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          });
        }
      })()
    );
  }
});
