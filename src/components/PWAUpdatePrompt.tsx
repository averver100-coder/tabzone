import { Loader2, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const RECENT_UPDATE_KEY = 'pwa_update_recently';

export const PWAUpdatePrompt: React.FC = () => {
  const [isApplying, setIsApplying] = useState(false);

  // 1. 중복 알림 및 무한 새로고침 루프 방지 가드 (15초 내 업데이트 이력 존재 시 차단)
  const isRecentlyUpdated = () => {
    try {
      if (typeof window === 'undefined') return false;
      const recent = sessionStorage.getItem(RECENT_UPDATE_KEY);
      if (recent && Date.now() - parseInt(recent, 10) < 15000) {
        return true;
      }
    } catch {}
    return false;
  };

  // 2. virtual:pwa-register/react 공식 훅 연결 (IT Desk 앱과 동일)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, registration) {
      if (registration) {
        // 30분 주기 백그라운드 업데이트 폴링
        const interval = setInterval(() => {
          if (!isRecentlyUpdated()) {
            registration.update().catch((e) => {
              console.debug('Service Worker periodic check notice:', e);
            });
          }
        }, 30 * 60 * 1000);

        // 태블릿 화면 복귀 / 가시성 획득 시 즉시 업데이트 검사
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && !isRecentlyUpdated()) {
            registration.update().catch((e) => {
              console.debug('Service Worker visibility check notice:', e);
            });
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    },
    onRegisterError(error) {
      console.warn('PWA Service Worker registration error:', error);
    },
  });

  // 3. needRefresh 상태가 되었더라도 최근 15초 내 업데이트 이력이 있으면 즉시 해제
  useEffect(() => {
    if (needRefresh && isRecentlyUpdated()) {
      setNeedRefresh(false);
    }
  }, [needRefresh, setNeedRefresh]);

  // 4. Controller Change 감지 시 1회만 깔끔하게 페이지 리로드
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let hasReloaded = false;
    const handleControllerChange = () => {
      if (!hasReloaded) {
        hasReloaded = true;
        try {
          sessionStorage.setItem(RECENT_UPDATE_KEY, Date.now().toString());
        } catch {}
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // 5. 테스트 쿼리 파라미터(?test_update=1, ?test_pwa=1) 및 커스텀 이벤트 지원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('test_update') === '1' || url.searchParams.get('test_pwa') === '1') {
      if (!isRecentlyUpdated()) setNeedRefresh(true);
    }
    const handleCustomEvent = () => {
      if (!isRecentlyUpdated()) setNeedRefresh(true);
    };
    window.addEventListener('pwa-show-update-prompt', handleCustomEvent);
    return () => {
      window.removeEventListener('pwa-show-update-prompt', handleCustomEvent);
    };
  }, [setNeedRefresh]);

  // 6. 업데이트 적용 핸들러 (SKIP_WAITING 전송 + updateServiceWorker + 안전 리로드)
  const handleUpdate = async () => {
    if (isApplying) return;
    setIsApplying(true);

    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('test_update') || url.searchParams.has('test_pwa')) {
          url.searchParams.delete('test_update');
          url.searchParams.delete('test_pwa');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
        }
      }
    } catch {}

    try {
      sessionStorage.setItem(RECENT_UPDATE_KEY, Date.now().toString());
    } catch {}

    setNeedRefresh(false);

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
    } catch (e) {
      console.debug('Service worker skipWaiting direct message error:', e);
    }

    try {
      await updateServiceWorker(true);
    } catch (e) {
      console.debug('updateServiceWorker execution error:', e);
    }

    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleClose = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && !isRecentlyUpdated() && (
        <motion.aside
          role="alert"
          aria-live="polite"
          aria-label="앱 업데이트 알림"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[460px] sm:max-w-xl z-[9999] pointer-events-auto"
        >
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl shadow-blue-600/30 border border-white/25 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                {isApplying ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <RefreshCw size={18} className="animate-spin" style={{ animationDuration: '3s' }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight truncate text-white">
                    {isApplying ? '최신 버전 적용 중...' : '새로운 업데이트가 있습니다'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-white/20 text-[10px] font-extrabold rounded text-white border border-white/30">
                    UPDATE
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100/90 truncate">
                  {isApplying
                    ? '잠시 후 페이지가 자동으로 새로고침됩니다.'
                    : '최신 개선사항이 적용되었습니다. 지금 새로고침하세요.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isApplying}
                className="bg-white hover:bg-blue-50 text-blue-700 font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                title="새로운 버전을 적용하고 새로고침합니다"
              >
                {isApplying ? (
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                ) : (
                  <RefreshCw size={13} className="text-blue-600" />
                )}
                <span>{isApplying ? '적용 중...' : '새로고침'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isApplying}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="닫기"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
