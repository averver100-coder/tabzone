import { CheckCircle2, Download } from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  fullWidth?: boolean;
  className?: string;
}

/**
 * 출퇴근 히어로(commute-gilt)와 동일한 PWA 설치 버튼
 * - 클릭 시 불필요한 자체 안내창이나 팝업 메시지 없이 브라우저의 공식 설치 대화상자만 즉시 호출
 * - 이미 설치되어 단독 앱으로 실행 중인 경우 깔끔한 상태 배지만 표시 (클릭 팝업 없음)
 */
export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  fullWidth = false,
  className = '',
}) => {
  const { deferredPrompt, isInstalled, isIOS, install } = usePWAInstall();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleInstallClick = async () => {
    // 1. 브라우저 설치 프롬프트가 대기 중이면 바로 네이티브 설치창 띄움
    if (deferredPrompt) {
      await install();
      return;
    }

    // 2. 이미 단독 앱(PWA)으로 실행 중인 경우
    if (isInstalled) {
      return;
    }

    // 3. iframe 내부이거나 프롬프트가 지원되지 않는 경우 간결한 1회성 토스트 안내만 표시 (자체 모달창 X)
    if (isIOS) {
      showToast('Safari 공유 버튼(⎋)을 누른 후 [홈 화면에 추가]를 선택해 주세요.');
      return;
    }

    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe) {
      showToast('새 창(외부 브라우저)으로 열면 즉시 앱 설치가 가능합니다.');
      return;
    }

    // 브라우저 주소창이나 메뉴를 통한 설치 안내
    showToast('브라우저 주소창의 설치 아이콘(📥) 또는 메뉴(⋮)에서 [앱 설치]를 눌러주세요.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 단독 PWA 모드로 구동 중일 때
  if (isInstalled) {
    if (fullWidth) {
      return (
        <div
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm select-none ${className}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>PWA 단독 앱 구동 중</span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 h-11 sm:h-12 px-3 sm:px-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-bold border border-emerald-200 select-none shrink-0 ${className}`}
        title="PWA 단독 앱으로 실행 중입니다."
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">PWA 앱 구동 중</span>
        <span className="sm:hidden">앱 구동 중</span>
      </div>
    );
  }

  // 앱 설치 버튼
  return (
    <div className="relative inline-flex">
      {fullWidth ? (
        <button
          id="pwa-install-btn"
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer select-none ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>앱 설치 (PC/모바일)</span>
        </button>
      ) : (
        <button
          id="pwa-install-btn"
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/25 border border-white/20 transition-all cursor-pointer duration-200 select-none shrink-0 ${className}`}
          title="바탕화면 및 모바일 홈 화면에 앱 설치"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="tracking-tight whitespace-nowrap">앱 설치 (PC/모바일)</span>
        </button>
      )}

      {/* 미지원 브라우저 등을 위한 최소한의 일시적 토스트 메시지 (모달창 아님) */}
      {toastMessage && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
