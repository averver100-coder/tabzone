import crypto from 'crypto';
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
  cacheName: string;
  sourceHash: string;
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

function collectFilesRecursively(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursively(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function computeSourceHash(root: string): string {
  const hash = crypto.createHash('sha256');
  const targets = [
    ...collectFilesRecursively(path.resolve(root, 'src')),
    path.resolve(root, 'index.html'),
    path.resolve(root, 'package.json'),
  ];
  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) continue;
    const rel = path.relative(root, filePath).replace(/\\/g, '/');
    hash.update(rel);
    hash.update(fs.readFileSync(filePath));
  }
  return hash.digest('hex').slice(0, 16);
}

let cachedBuildVersionInfo: VersionInfo | null = null;

function resolveVersionInfo(command: 'build' | 'serve'): VersionInfo {
  if (cachedBuildVersionInfo) {
    return cachedBuildVersionInfo;
  }

  const root = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const vPath = path.resolve(root, 'public', 'version.json');
  const todayKst = getKstDateString();
  const currentSourceHash = computeSourceHash(root);

  let existing: { date: string; patch: number; hasPatch: boolean } | null = null;
  let existingSourceHash: string | null = null;
  try {
    if (fs.existsSync(vPath)) {
      const content = JSON.parse(fs.readFileSync(vPath, 'utf-8'));
      existing = parseStoredVersion(content?.version);
      existingSourceHash = typeof content?.sourceHash === 'string' ? content.sourceHash : null;
    }
  } catch (e) {
    console.debug('Failed to read existing version.json:', e);
  }

  let buildDate = todayKst;
  let nextPatch = 1;

  if (command === 'build') {
    if (existing && existing.date === todayKst && existing.hasPatch && existing.patch >= 1) {
      // 오늘 날짜에 이미 명시적으로 기록된 버전이 있고,
      // 이전 빌드 해시와 실제 소스 변경이 감지된 경우에만 +1 증가 (중복 증가 방지)
      if (existingSourceHash && existingSourceHash !== currentSourceHash) {
        nextPatch = existing.patch + 1;
      } else {
        nextPatch = existing.patch;
      }
    } else {
      // 날짜가 바뀌어 오늘 처음 빌드하는 경우 무조건 01부터 시작
      buildDate = todayKst;
      nextPatch = 1;
    }
  } else {
    // 개발 서버(serve) 기동 시에는 public/version.json의 버전을 임의로 덮어쓰거나 선차감(.01 소모)하지 않고 그대로 사용
    if (existing && existing.hasPatch && existing.patch >= 1) {
      buildDate = existing.date;
      nextPatch = existing.patch;
    } else {
      buildDate = todayKst;
      nextPatch = 1;
    }
  }

  const patchStr = String(nextPatch).padStart(2, '0');
  const version = `V${buildDate}.${patchStr}`;
  const buildId = `tabzone-${version}`;
  const cacheName = `tabzone-cache-${version}`;

  cachedBuildVersionInfo = {
    buildDate,
    patchNum: nextPatch,
    patchStr,
    version,
    buildId,
    cacheName,
    sourceHash: currentSourceHash,
  };

  return cachedBuildVersionInfo;
}

function versionJsonPlugin(versionInfo: VersionInfo, command: 'build' | 'serve') {
  return {
    name: 'version-json-sync',
    buildStart() {
      // 개발 서버 실행(serve) 시에는 version.json을 임의로 덮어쓰지 않아 빌드 버전과 충돌 방지
      if (command !== 'build') return;

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
              cacheName: versionInfo.cacheName,
              sourceHash: versionInfo.sourceHash,
              updatedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          'utf-8'
        );

        // Service Worker(sw-waf-guard.js)의 APP_VERSION 및 CACHE_NAME 동기화
        const swGuardPath = path.resolve(publicDir, 'sw-waf-guard.js');
        if (fs.existsSync(swGuardPath)) {
          const swContent = fs.readFileSync(swGuardPath, 'utf-8');
          const updatedSwContent = swContent
            .replace(/const APP_VERSION = ['"][^'"]+['"];/, `const APP_VERSION = '${versionInfo.version}';`)
            .replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = '${versionInfo.cacheName}';`);
          if (updatedSwContent !== swContent) {
            fs.writeFileSync(swGuardPath, updatedSwContent, 'utf-8');
          }
        }
      } catch (e) {
        console.debug('Failed to sync version.json / sw-waf-guard.js:', e);
      }
    },
  };
}

function dedupeManifestLinkPlugin() {
  return {
    name: 'dedupe-manifest-link',
    enforce: 'post' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        let seen = false;
        return html.replace(/<link\b[^>]*\brel=["']manifest["'][^>]*\/?>/gi, (match) => {
          if (seen) return '';
          seen = true;
          return match;
        });
      },
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
      versionJsonPlugin(versionInfo, command),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: ['tab-logo.png'],
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
              src: '/tab-logo.png?v=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          cacheId: versionInfo.cacheName,
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
                cacheName: `tabzone-pages-${versionInfo.version}`,
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
                cacheName: `tabzone-assets-${versionInfo.version}`,
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
                cacheName: `google-fonts-${versionInfo.version}`,
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
      dedupeManifestLinkPlugin(),
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
