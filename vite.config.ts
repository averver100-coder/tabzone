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

  let nextPatch = 1;
  if (command === 'build') {
    // 배포(빌드) 시: 오늘 날짜가 같으면 패치 번호 +1 자동 증가, 날짜가 바뀌면 01로 초기화
    if (existing && existing.date === todayKst) {
      nextPatch = Math.max(existing.patch, 0) + 1;
    } else {
      nextPatch = 1;
    }
  } else {
    // 개발 서버(serve) 실행 시: 오늘 날짜 유지, 소스 코드 해시가 변경된 경우 자동으로 +1 증가
    if (existing && existing.date === todayKst && existing.hasPatch && existing.patch >= 1) {
      if (existingSourceHash && existingSourceHash !== currentSourceHash) {
        nextPatch = existing.patch + 1;
      } else {
        nextPatch = existing.patch;
      }
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
    sourceHash: currentSourceHash,
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

        // 디스크에 이미 동일 날짜의 더 높은 패치 버전이 기록되어 있으면 절대 하위 버전으로 덮어쓰지 않음
        if (fs.existsSync(vPath)) {
          try {
            const diskContent = JSON.parse(fs.readFileSync(vPath, 'utf-8'));
            const diskParsed = parseStoredVersion(diskContent?.version);
            if (
              diskParsed &&
              diskParsed.date === versionInfo.buildDate &&
              diskParsed.patch > versionInfo.patchNum
            ) {
              return;
            }
          } catch {}
        }

        fs.writeFileSync(
          vPath,
          JSON.stringify(
            {
              version: versionInfo.version,
              buildDate: versionInfo.buildDate,
              patch: versionInfo.patchNum,
              buildId: versionInfo.buildId,
              sourceHash: versionInfo.sourceHash,
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
      versionJsonPlugin(versionInfo),
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
