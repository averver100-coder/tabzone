import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

interface VersionInfo {
  buildDate: string;
  patchNum: number;
  patchStr: string;
  version: string;
  buildId: string;
}

function getKstDateString(): string {
  const now = new Date();
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const kstDay = String(kstDate.getUTCDate()).padStart(2, '0');
  return `${kstYear}.${kstMonth}.${kstDay}`;
}

function parseStoredVersion(rawVersion?: string | null): { date: string; patch: number; hasPatch: boolean } | null {
  if (!rawVersion || typeof rawVersion !== 'string') return null;
  const match = rawVersion.trim().match(/^V?(\d{4}\.\d{2}\.\d{2})(?:\.(\d+))?$/);
  if (!match) return null;
  return {
    date: match[1],
    patch: match[2] ? parseInt(match[2], 10) : 0,
    hasPatch: Boolean(match[2]),
  };
}

let cachedBuildVersionInfo: VersionInfo | null = null;

function resolveVersionInfo(command: 'build' | 'serve'): VersionInfo {
  if (cachedBuildVersionInfo) {
    return cachedBuildVersionInfo;
  }

  const root = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const vPath = path.resolve(root, 'public', 'version.json');
  const todayKst = getKstDateString();

  let existing: { date: string; patch: number; hasPatch: boolean } | null = null;
  try {
    if (fs.existsSync(vPath)) {
      const content = JSON.parse(fs.readFileSync(vPath, 'utf-8'));
      existing = parseStoredVersion(content?.version);
    }
  } catch (e) {
    console.debug('Failed to read existing version.json:', e);
  }

  let nextPatch = 1;
  if (command === 'build') {
    // 배포(빌드) 시: 오늘 날짜가 같으면 패치 번호 +1 자동 증가, 날짜가 바뀌면 01로 초기화
    if (existing && existing.date === todayKst) {
      nextPatch = existing.patch + 1;
    } else {
      nextPatch = 1;
    }
  } else {
    // 개발 서버(serve) 실행 시: 오늘 날짜의 유효한 패치 버전이 있으면 유지하고, 날짜 변경/미설정 시 01로 초기화
    if (existing && existing.date === todayKst && existing.hasPatch && existing.patch >= 1) {
      nextPatch = existing.patch;
    } else {
      nextPatch = 1;
    }
  }

  const patchStr = String(nextPatch).padStart(2, '0');
  const version = `V${todayKst}.${patchStr}`;
  const buildId = `tabzone-${version}`;

  cachedBuildVersionInfo = {
    buildDate: todayKst,
    patchNum: nextPatch,
    patchStr,
    version,
    buildId,
  };

  return cachedBuildVersionInfo;
}

function versionJsonPlugin(versionInfo: VersionInfo) {
  return {
    name: 'version-json-sync',
    buildStart() {
      try {
        const root = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
        const publicDir = path.resolve(root, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const vPath = path.resolve(publicDir, 'version.json');
        fs.writeFileSync(
          vPath,
          JSON.stringify(
            {
              version: versionInfo.version,
              buildDate: versionInfo.buildDate,
              patch: versionInfo.patchNum,
              buildId: versionInfo.buildId,
              updatedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          'utf-8'
        );
      } catch (e) {
        console.debug('Failed to sync version.json:', e);
      }
    },
  };
}

export default defineConfig(({ command }) => {
  const versionInfo = resolveVersionInfo(command);

  return {
    define: {
      __APP_VERSION__: JSON.stringify(versionInfo.version),
      __BUILD_ID__: JSON.stringify(versionInfo.buildId),
      'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(versionInfo.buildDate),
      'import.meta.env.VITE_APP_BUILD_PATCH': JSON.stringify(versionInfo.patchStr),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionInfo.version),
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(versionInfo.buildId),
    },
    plugins: [
      versionJsonPlugin(versionInfo),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: '탭존 (TabZone) - 스마트 태블릿 대여 관리',
          short_name: '탭존',
          description: '상일미디어고등학교 스마트 태블릿 대여 및 반납 관리 시스템 (tab.srider.kr)',
          theme_color: '#1e3a8a',
          background_color: '#1e3a8a',
          display: 'standalone',
          display_override: ['fullscreen', 'standalone', 'window-controls-overlay'],
          orientation: 'any',
          lang: 'ko',
          prefer_related_applications: false,
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: null,
          globPatterns: [],
          importScripts: ['/sw-waf-guard.js'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tabzone-pages-network-first',
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === self.location.origin,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tabzone-assets-network-first',
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'google-fonts-network-first',
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(typeof __dirname !== 'undefined' ? __dirname : process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
