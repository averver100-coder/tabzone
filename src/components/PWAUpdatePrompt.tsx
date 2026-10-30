import { Loader2, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_VERSION } from '../constants/version';

const RECENT_UPDATE_KEY = 'pwa_update_recently';
const DISMISSED_VERSION_KEY = 'pwa_dismissed_version';
// 업데이트 시도 직후 60초간 반복 알림 억제 가드
const RECENT_WINDOW_MS = 60 * 1000;

export const PWAUpdatePrompt: React.FC = () => {
  const [isApplying, setIsApplying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [detectedVersion, setDetectedVersion] = useState<string | null>(null);
  const isVerifyingRef = useRef(false);

  // 1. 중복 알림 및 무한 새로고침 루프 방지 가드
  const isRecentlyUpdated = useCallback((): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const recent = sessionStorage.getItem(RECENT_UPDATE_KEY);
      if (recent && Date.now() - parseInt(recent, 10) < RECENT_WINDOW_MS) {
        return true;
      }
    } catch {}
    return false;
  }, []);

  // 2. 서버의 실제 배포 버전(version.json)과 현재 앱 버전(APP_VERSION) 엄격한 비교 로직
  // 단순 타임스탬프 크기 비교가 아닌 실제 배포 버전 문자열이 다를 때만 업데이트로 판정
  const verifyRealReleaseUpdate = useCallback(async (): Promise<{ isRealUpdate: boolean; newVersion: string | null }> => {
    try {
      // 캐시를 타지 않도록 no-store 헤더 및 타임스탬프 쿼리 적용
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const serverVersion = typeof data?.version === 'string' ? data.version.trim() : null;

        // 엄격한 문자열 비교: 서버 버전이 존재하고, 현재 실행 중인 APP_VERSION과 명확히 다를 때만 허용
        if (serverVersion && serverVersion !== APP_VERSION) {
          // 사용자가 이미 '닫기'를 눌러 무시한 버전인지 확인
          const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
          if (dismissed === serverVersion) {
            console.debug('[PWA] Update banner dismissed previously for', serverVersion);
            return { isRealUpdate: false, newVersion: serverVersion };
          }
          return { isRealUpdate: true, newVersion: serverVersion };
        }

        // 서버 버전이 현재 앱 버전과 동일한 경우 -> 실제 배포 없음 (가짜 알림 차단)
        console.debug('[PWA] Server version (' + serverVersion + ') matches client (' + APP_VERSION + '). False alarm suppressed.');
        return { isRealUpdate: false, newVersion: null };
      }
    } catch (e) {
      console.debug('[PWA] Version check failed, suppressing false alarm:', e);
    }

    return { isRealUpdate: false, newVersion: null };
  }, []);

  // 3. virtual:pwa-register/react 공식 훅 연결
  // 과도한 폴링 및 탭 포커스(visibilitychange) 감시를 제거하고 안정적인 라이프사이클 기반으로 운영
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, registration) {
      if (registration) {
        // 과도한 탭 이동/화면 켜짐(visibilitychange) 감시는 제거함.
        // 60분 주기의 온건한 백그라운드 체크만 유지 (불필요한 네트워크 스팸 방지)
        const interval = setInterval(() => {
          if (!isRecentlyUpdated()) {
            registration.update().catch((e) => {
              console.debug('[PWA] Service Worker background check notice:', e);
            });
          }
        }, 60 * 60 * 1000);

        return () => {
          clearInterval(interval);
        };
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration error:', error);
    },
  });

  // 4. needRefresh 이벤트 발생 시: 서버 버전과 엄격하게 대조하여 실제 새 배포일 때만 UI 표시
  useEffect(() => {
    if (!needRefresh) {
      setShowPrompt(false);
      return;
    }

    if (isRecentlyUpdated()) {
      setNeedRefresh(false);
      setShowPrompt(false);
      return;
    }

    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    verifyRealReleaseUpdate()
      .then(({ isRealUpdate, newVersion }) => {
        if (isRealUpdate && newVersion) {
          setDetectedVersion(newVersion);
          setShowPrompt(true);
        } else {
          // 실제 새 릴리즈가 아니거나 동일 버전이면 즉시 알림 해제
          setNeedRefresh(false);
          setShowPrompt(false);
        }
      })
      .finally(() => {
        isVerifyingRef.current = false;
      });
  }, [needRefresh, setNeedRefresh, isRecentlyUpdated, verifyRealReleaseUpdate]);

  // 5. Controller Change 감지 시 1회만 깔끔하게 페이지 리로드
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

  // 6. 테스트 파라미터 및 커스텀 이벤트 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('test_update') === '1' || url.searchParams.get('test_pwa') === '1') {
      if (!isRecentlyUpdated()) {
        setShowPrompt(true);
      }
    }

    const handleCustomEvent = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const force = customDetail?.force === true;

      if (force) {
        setShowPrompt(true);
        return;
      }

      verifyRealReleaseUpdate().then(({ isRealUpdate, newVersion }) => {
        if (isRealUpdate && newVersion) {
          setDetectedVersion(newVersion);
          setShowPrompt(true);
        }
      });
    };

    window.addEventListener('pwa-show-update-prompt', handleCustomEvent);
    return () => {
      window.removeEventListener('pwa-show-update-prompt', handleCustomEvent);
    };
  }, [isRecentlyUpdated, verifyRealReleaseUpdate]);

  // 7. 업데이트 적용 핸들러 (SKIP_WAITING 전송 + updateServiceWorker + 안전 리로드)
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
      localStorage.removeItem(DISMISSED_VERSION_KEY);
    } catch {}

    setShowPrompt(false);
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

  // 8. 닫기 핸들러 (현재 감지된 버전 무시 저장)
  const handleClose = () => {
    if (detectedVersion) {
      try {
        localStorage.setItem(DISMISSED_VERSION_KEY, detectedVersion);
      } catch {}
    }
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && !isRecentlyUpdated() && (
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
                    {isApplying
                      ? '최신 버전 적용 중...'
                      : detectedVersion
                      ? `새 버전(${detectedVersion})이 배포되었습니다`
                      : '새로운 업데이트가 있습니다'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-white/20 text-[10px] font-extrabold rounded text-white border border-white/30">
                    UPDATE
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100/90 truncate">
                  {isApplying
                    ? '잠시 후 페이지가 자동으로 새로고침됩니다.'
                    : `현재 버전: ${APP_VERSION} ➔ 지금 새로고침하여 최신 개선사항을 적용하세요.`}
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
