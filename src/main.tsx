import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type AccessState = 'checking' | 'granted' | 'denied';

/**
 * NetworkFirstGate
 * - 앱 실행(홈 화면 PWA 실행 포함) 시 반드시 서버(/version.json)에 실시간 네트워크 요청을 먼저 수행합니다.
 * - Cloudflare WAF에 의해 차단(403 등)되거나 오프라인/네트워크 오류 발생 시,
 *   저장된 캐시 화면을 절대 렌더링하지 않고 "네트워크 접근이 거부되었습니다" 텍스트만 표시합니다.
 */
function checkAllowedHostOrDev(): boolean {
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return true;
  }
  if (typeof window === 'undefined') {
    return true;
  }
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  return hostname.endsWith('.srider.kr');
}

function NetworkFirstGate() {
  const isAllowedHost = checkAllowedHostOrDev();

  const [accessState, setAccessState] = useState<AccessState>('checking');

  useEffect(() => {
    if (!isAllowedHost) {
      return;
    }

    let isMounted = true;

    const purgeServiceWorkerCaches = async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // Ignore cache cleanup errors
      }
    };

    const verifyServerAccess = async () => {
      // Offline state immediate rejection
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        await purgeServiceWorkerCaches();
        if (isMounted) setAccessState('denied');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      try {
        // Probe origin server directly, bypassing all browser/SW caches
        const res = await fetch(`/version.json?_waf_probe=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Blocked by Cloudflare WAF (403, 401, 503, etc.) or any non-200 status
        if (!res.ok || res.status !== 200) {
          await purgeServiceWorkerCaches();
          if (isMounted) setAccessState('denied');
          return;
        }

        // Verify payload is genuine JSON from our server (not a WAF HTML challenge page)
        const contentType = res.headers.get('content-type') || '';
        const data = await res.json().catch(() => null);
        if (!data || typeof data.version !== 'string' || contentType.includes('text/html')) {
          await purgeServiceWorkerCaches();
          if (isMounted) setAccessState('denied');
          return;
        }

        if (isMounted) {
          setAccessState('granted');
        }
      } catch {
        clearTimeout(timeoutId);
        await purgeServiceWorkerCaches();
        if (isMounted) {
          setAccessState('denied');
        }
      }
    };

    verifyServerAccess();

    const handleOffline = () => {
      purgeServiceWorkerCaches();
      if (isMounted) setAccessState('denied');
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setAccessState('checking');
        verifyServerAccess();
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      isMounted = false;
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isAllowedHost]);

  // 0. 호스트명이 .srider.kr로 끝나지 않으면 빈 화면(차단) 반환
  if (!isAllowedHost) {
    return null;
  }

  // 1. 서버 확인 중에는 캐시된 화면이 노출되지 않도록 빈 화면 렌더링
  if (accessState === 'checking') {
    return <div className="min-h-screen bg-white" />;
  }

  // 2. Cloudflare WAF 차단(403 등) 또는 네트워크 실패 시 캐시 화면 대신 에러 텍스트만 렌더링
  if (accessState === 'denied') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center select-none">
        <p className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          네트워크 접근이 거부되었습니다
        </p>
      </div>
    );
  }

  // 3. 서버 정상 응답 확인 후에만 앱 렌더링
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkFirstGate />
  </React.StrictMode>
);
