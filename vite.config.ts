import fs from 'fs';
// Calculate release version at build/compile time in KST (UTC+9)
const now = new Date();
const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const kstYear = kstDate.getUTCFullYear();
const kstMonth = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
const kstDay = String(kstDate.getUTCDate()).padStart(2, '0');
const BUILD_DATE_STR = `${kstYear}.${kstMonth}.${kstDay}`;
const BUILD_VERSION = `V${BUILD_DATE_STR}`;
const BUILD_ID = `tabzone-${BUILD_VERSION}`;

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function versionJsonPlugin() {
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
          JSON.stringify({ version: BUILD_VERSION, buildId: BUILD_ID }, null, 2),
          'utf-8'
        );
      } catch (e) {
        console.debug('Failed to sync version.json:', e);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(BUILD_VERSION),
      __BUILD_ID__: JSON.stringify(BUILD_ID),
      'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(BUILD_DATE_STR),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(BUILD_VERSION),
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
    },
    plugins: [
      versionJsonPlugin(),
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
          skipWaiting: false,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
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
