import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const RECENT_UPDATE_KEY = 'pwa_update_recently';
const RECENT_UPDATE_WINDOW_MS = 15000; // 15-second loop suppression guard

export const PWAUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // 1. Session storage infinite loop suppression guard
    const checkLoopGuard = (): boolean => {
      const lastUpdateStr = sessionStorage.getItem(RECENT_UPDATE_KEY);
      if (lastUpdateStr) {
        const lastUpdate = parseInt(lastUpdateStr, 10);
        if (Date.now() - lastUpdate < RECENT_UPDATE_WINDOW_MS) {
          return true; // Suppress prompt
        } else {
          sessionStorage.removeItem(RECENT_UPDATE_KEY);
        }
      }
      return false;
    };

    if (checkLoopGuard()) {
      return;
    }

    // 4. Duplicate event reload lock (hasReloaded)
    let hasReloaded = false;

    if ('serviceWorker' in navigator) {
      // Listen for controller changes (when new SW takes control)
      const handleControllerChange = () => {
        if (!hasReloaded) {
          hasReloaded = true;
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Check current registration and listening for waiting workers
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // Check if there is already a waiting worker
        if (reg.waiting) {
          if (!checkLoopGuard()) {
            setWaitingWorker(reg.waiting);
            setNeedRefresh(true);
          }
        }

        // Listen for new updates discovered
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (!checkLoopGuard()) {
                  setWaitingWorker(newWorker);
                  setNeedRefresh(true);
                }
              }
            });
          }
        });
      });

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = async () => {
    if (isApplying) return;
    setIsApplying(true);

    // 1. Record timestamp in sessionStorage immediately to prevent infinite refresh loops
    sessionStorage.setItem(RECENT_UPDATE_KEY, Date.now().toString());

    // 3. Clean up any test/debug URL parameters without reloading
    try {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch {
      // Ignore history replace state errors
    }

    // 2. Direct SKIP_WAITING signal to all registrations
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (err) {
        console.warn('Error broadcasting SKIP_WAITING to service workers', err);
      }

      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    // Fallback: If controllerchange does not fire within 1.2s, force reload
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3 p-4 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <RefreshCw className={`w-5 h-5 ${isApplying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>새로운 업데이트가 있습니다</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              최신 데이터 정합성 및 기능 개선이 준비되었습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isApplying}
            onClick={handleUpdate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>적용 중...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새로고침</span>
              </>
            )}
          </button>
          {!isApplying && (
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
