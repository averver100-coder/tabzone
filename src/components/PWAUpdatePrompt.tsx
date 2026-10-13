import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const RECENT_UPDATE_KEY = 'tabzone_pwa_update_recently';
const RECENT_UPDATE_WINDOW_MS = 15000; // 15초 내 무한 새로고침 루프 방지 가드

/**
 * PWA Service Worker 실시간 업데이트 감지 및 즉시 반영 배너
 * 출퇴근 히어로(commute-gilt) 패턴 기반:
 * 1. 25초 주기 백그라운드 registration.update() 폴링으로 GitHub 최신 배포 즉각 감지
 * 2. 화면 켜짐(visibilitychange), 윈도우 포커스(focus), 온라인 전환(online) 시 즉각 갱신 검사
 * 3. sessionStorage 기반 15초 루프 방지 가드로 무한 새로고침 방지
 * 4. '?test_update=1' 쿼리스트링으로 즉시 UI 테스트 지원
 */
export const PWAUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // 1. 무한 새로고침 루프 방지 검사 함수
  const checkLoopGuard = (): boolean => {
    try {
      const lastUpdateStr = sessionStorage.getItem(RECENT_UPDATE_KEY);
      if (lastUpdateStr) {
        const lastUpdate = parseInt(lastUpdateStr, 10);
        if (!isNaN(lastUpdate) && Date.now() - lastUpdate < RECENT_UPDATE_WINDOW_MS) {
          // 최근 15초 이내에 새로고침이 수행되었으므로 프롬프트 노출 억제
          return true;
        } else {
          sessionStorage.removeItem(RECENT_UPDATE_KEY);
        }
      }
    } catch (err) {
      console.warn('[PWA] Loop guard check warning:', err);
    }
    return false;
  };

  useEffect(() => {
    // 이미 최근에 새로고침된 상태라면 프롬프트 노출하지 않음
    if (checkLoopGuard()) {
      return;
    }

    // 개발/테스트용 '?test_update=1' 파라미터 감지
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('test_update') === '1') {
        setNeedRefresh(true);
      }
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let cleanupVisibility: (() => void) | null = null;
    let cleanupFocus: (() => void) | null = null;
    let cleanupOnline: (() => void) | null = null;

    try {
      // virtual:pwa-register를 통해 서비스 워커 등록 및 업데이트 핸들러 연결
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (!checkLoopGuard()) {
            setNeedRefresh(true);
          }
        },
        onOfflineReady() {
          console.log('[PWA] 앱이 오프라인에서 사용할 준비가 되었습니다.');
        },
        onRegisteredSW(_swScriptUrl, registration) {
          if (!registration) return;

          // 1) 앱 시작 즉시 1차 업데이트 검사
          registration.update().catch(() => {});

          // 2) GitHub Actions 배포를 지연 없이 감지하기 위한 25초 주기 폴링
          intervalId = setInterval(() => {
            registration.update().catch(() => {});
          }, 25 * 1000);

          // 3) 태블릿 화면을 켜거나 다른 앱에서 복귀했을 때 즉시 업데이트 검사
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);
          cleanupVisibility = () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          };

          // 4) 윈도우 포커스 획득 시 즉시 업데이트 검사
          const handleFocus = () => {
            registration.update().catch(() => {});
          };
          window.addEventListener('focus', handleFocus);
          cleanupFocus = () => {
            window.removeEventListener('focus', handleFocus);
          };

          // 5) 네트워크 온라인 복구 시 즉시 검사
          const handleOnline = () => {
            registration.update().catch(() => {});
          };
          window.addEventListener('online', handleOnline);
          cleanupOnline = () => {
            window.removeEventListener('online', handleOnline);
          };
        },
        onRegisterError(error) {
          console.warn('[PWA] Service Worker 등록 안내:', error);
        },
      });

      updateSWRef.current = updateSW;
    } catch (err) {
      console.warn('[PWA] registerSW 초기화 안내:', err);
    }

    // 기존 대기 중인 워커(reg.waiting)가 있는지 직접 보조 확인
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting && !checkLoopGuard()) {
        setNeedRefresh(true);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (cleanupVisibility) cleanupVisibility();
      if (cleanupFocus) cleanupFocus();
      if (cleanupOnline) cleanupOnline();
    };
  }, []);

  // 새로고침 실행 핸들러 (SKIP_WAITING 전송 및 루프 방지)
  const handleUpdate = async () => {
    if (isApplying) return;
    setIsApplying(true);

    try {
      // 1. 무한 루프 방지를 위해 세션 스토리지에 타임스탬프 기록
      sessionStorage.setItem(RECENT_UPDATE_KEY, Date.now().toString());

      // 2. URL에 '?test_update=1'이 있었다면 제거하여 새로고침 후 재발생 방지
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('test_update')) {
          url.searchParams.delete('test_update');
          window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
        }
      } catch {
        // ignore history replace error
      }

      // 3. 1회만 새로고침을 실행하도록 락(hasReloaded) 설정
      let hasReloaded = false;
      const reloadOnce = () => {
        if (!hasReloaded) {
          hasReloaded = true;
          window.location.reload();
        }
      };

      // 4. 새로운 Service Worker가 활성화되어 제어권을 잡으면 즉시 리로드
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true });

        // 모든 대기 중인 서비스 워커에 직접 SKIP_WAITING 전송
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch (e) {
          console.warn('[PWA] Direct SKIP_WAITING message notice:', e);
        }
      }

      // 5. virtual:pwa-register의 updateSW 실행
      if (updateSWRef.current) {
        try {
          await updateSWRef.current(true);
        } catch (e) {
          console.warn('[PWA] updateSW invocation notice:', e);
        }
      }

      // 6. 안전 폴백: 1.2초 내 controllerchange가 트리거되지 않으면 강제 새로고침
      setTimeout(() => {
        reloadOnce();
      }, 1200);
    } catch (err) {
      console.error('[PWA] Update execution error:', err);
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <aside
      id="pwa-update-prompt-banner"
      aria-label="애플리케이션 신규 버전 업데이트 안내"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
        {/* Glow ambient effects */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          {/* Information & Icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md ring-1 ring-white/30">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  새로운 업데이트가 있습니다
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/90 truncate mt-0.5">
                최신 기능과 안정적인 서비스를 위해 새로고침해 주세요.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="pwa-update-reload-btn"
              type="button"
              onClick={handleUpdate}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>적용 중...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>새로고침</span>
                </>
              )}
            </button>

            {!isApplying && (
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                aria-label="업데이트 알림 닫기"
                className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
