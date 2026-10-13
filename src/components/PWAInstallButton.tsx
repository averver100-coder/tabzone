import {
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Lightbulb,
  Share2,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { BeforeInstallPromptEvent, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onPromptInstall: () => void;
  isInstalled: boolean;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onPromptInstall,
  isInstalled,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'howitworks' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isMac = typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent);

  return (
    <div
      id="pwa-install-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 text-slate-800 my-auto overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-5 sm:px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 ring-1 ring-white/20 shrink-0">
              <Tablet className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>데스크톱(PC) / 모바일 앱 설치 &amp; 실행 안내</span>
                {isInstalled && (
                  <span className="text-[11px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    설치 완료됨
                  </span>
                )}
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                주소창 없는 단독 키오스크 창으로 바탕화면 및 홈 화면에서 즉시 실행
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'desktop'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>데스크톱 PC 설치 방법</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('howitworks')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'howitworks'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>앱 실행 원리 및 장점</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'mobile'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>모바일 / 태블릿 설치</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Iframe Notice */}
          {isIframe && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="space-y-1.5">
                  <p className="font-bold text-xs sm:text-sm">
                    현재 AI Studio 개발 미리보기(Iframe) 화면입니다
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    크롬 및 엣지 브라우저는 보안 규정상 Iframe 내부에서는 데스크톱 앱 자동 설치 팝업을 차단합니다. 아래 <strong>[새 창으로 열어 설치하기]</strong>를 클릭하시면 브라우저 상단 주소창에서 즉시 설치하실 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>새 창(외부 브라우저)으로 열어 설치하기</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browser Prompt Ready Banner */}
          {deferredPrompt && !isIframe && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-blue-900 text-sm">브라우저 원클릭 설치 준비 완료!</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  지금 바로 버튼을 누르면 Windows 바탕화면 및 태블릿 홈 화면에 바로가기 앱이 설치됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onPromptInstall}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>지금 앱 설치</span>
              </button>
            </div>
          )}

          {/* Tab 1: Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-slate-800 mb-2.5 flex items-center gap-2 text-xs sm:text-sm">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>크롬(Chrome) 및 엣지(Edge) 데스크톱 설치 순서</span>
                </h4>
                <ol className="space-y-2.5 text-slate-600 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      1
                    </span>
                    <span>
                      브라우저 최상단 주소창(URL 입력창) 오른쪽 끝을 보시면{' '}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[11px] text-slate-800 font-bold">
                        [모니터/다운로드 📥 또는 ⊕]
                      </span>{' '}
                      아이콘이 나타나 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      2
                    </span>
                    <span>
                      해당 아이콘을 클릭한 뒤 팝업 창에서 <strong>[설치]</strong> 버튼을 누릅니다.
                      (또는 브라우저 메뉴 [⋮] ➔ <strong>[저장 및 공유]</strong> ➔ <strong>[탭존 설치]</strong>)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      3
                    </span>
                    <span>
                      설치 즉시 Windows <strong>바탕화면 및 시작 메뉴에 '탭존' 바로가기</strong>가 등록되며, 상단 주소창 없는 깔끔한 독립 네이티브 앱 창으로 실행됩니다.
                    </span>
                  </li>
                </ol>
              </div>

              {isMac && (
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                  <p className="font-bold text-slate-900 mb-1">🍎 Mac(macOS) 사용자 안내</p>
                  <p className="leading-relaxed">
                    Chrome 또는 Safari 브라우저에서 메뉴 ➔ <strong>[Dock에 추가...]</strong> 또는 주소창 설치 아이콘을 클릭하시면 Mac Dock 및 런치패드에서 바로 실행하실 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: How It Works */}
          {activeTab === 'howitworks' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>앱 설치 후 장점 및 구동 원리</span>
                </div>
                <p className="text-xs text-emerald-800/95 leading-relaxed">
                  PWA(Progressive Web App)는 웹 브라우저의 <strong>Service Worker(서비스 워커) 캐시 기술</strong>을 통해 프로그램의 모든 화면과 코드를 기기에 오프라인 상태로 안전하게 보관합니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200">
                    <p className="font-black text-xs text-emerald-950 mb-1">🖥️ 단독 키오스크 창 실행</p>
                    <p className="text-[11px] text-emerald-800">
                      브라우저 주소창, 탭 메뉴 없이 전체화면 키오스크 형태로 구동되어 태블릿 거치대 환경에 최적화됩니다.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200">
                    <p className="font-black text-xs text-emerald-950 mb-1">⚡ 오프라인 고속 로딩</p>
                    <p className="text-[11px] text-emerald-800">
                      교내 인터넷이 잠시 끊겨도 로컬 캐시에서 즉시 열리며 안전하게 작동합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-xs text-slate-800">
                  📱 갤럭시 탭 S6 Lite (10.4인치 가로형) 완벽 대응
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  충전 보관함 옆 전용 거치대에 태블릿을 가로로 거치한 뒤 앱으로 설치해 두면, 학생과 교사가 버튼 하나로 대여·반납을 가장 신속하게 마칠 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Mobile */}
          {activeTab === 'mobile' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-slate-800 mb-2.5 flex items-center gap-2 text-xs sm:text-sm">
                  <span>🤖 갤럭시 / 안드로이드 태블릿 &amp; 스마트폰 (Chrome / 삼성 인터넷)</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  브라우저 우측 상단 더보기 메뉴(⋮) 클릭 ➔ <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 누르면 즉시 갤럭시 탭 홈 화면에 독립 앱으로 설치됩니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-slate-800 mb-2.5 flex items-center gap-2 text-xs sm:text-sm">
                  <span>📱 아이폰 / 아이패드 (iOS Safari)</span>
                </h4>
                <ol className="space-y-2 text-slate-600 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      1
                    </span>
                    <span>
                      Safari 하단 툴바의 <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> <strong>공유</strong> 버튼 탭
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      2
                    </span>
                    <span>
                      메뉴를 올려 <strong>[홈 화면에 추가]</strong> 선택
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      3
                    </span>
                    <span>
                      우측 상단 <strong>[추가]</strong>를 누르면 홈 화면에 앱 아이콘 생성
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Tablet className="w-3.5 h-3.5 text-slate-400" />
            <span>탭존 (TabZone) - 스마트 태블릿 대여 관리 시스템 (tab.srider.kr)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

interface PWAInstallButtonProps {
  fullWidth?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ fullWidth = false, className = '' }) => {
  const { deferredPrompt, isInstalled, install } = usePWAInstall();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleInstallClick = () => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (deferredPrompt && !isIframe) {
      install();
    } else {
      setIsGuideOpen(true);
    }
  };

  return (
    <>
      {fullWidth ? (
        isInstalled ? (
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-98 cursor-pointer ${className}`}
            title="PWA 단독 앱 구동 중 (클릭 시 상세 안내)"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>PWA 앱 구동 중 (설치 완료)</span>
          </button>
        ) : (
          <button
            id="pwa-install-btn"
            type="button"
            onClick={handleInstallClick}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer ${className}`}
            title="바탕화면 및 모바일 홈 화면에 앱 설치"
          >
            <Download className="w-4 h-4" />
            <span>앱 설치 (PC/모바일)</span>
          </button>
        )
      ) : isInstalled ? (
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className={`inline-flex items-center gap-1.5 h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-bold border border-emerald-200 transition shadow-xs active:scale-95 cursor-pointer ${className}`}
          title="PWA 단독 앱으로 구동 중입니다. (클릭 시 상세 정보)"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">PWA 앱 구동 중</span>
          <span className="sm:hidden">앱 실행중</span>
        </button>
      ) : (
        <button
          id="pwa-install-btn"
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-4.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/25 border border-white/20 transition-all cursor-pointer animate-pulse duration-1000 ${className}`}
          title="바탕화면 및 모바일 홈 화면에 앱 설치 (클릭 시 원클릭 설치 및 안내)"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="tracking-tight whitespace-nowrap">앱 설치 (PC/모바일)</span>
        </button>
      )}

      {/* Guide Modal */}
      <PWAInstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        deferredPrompt={deferredPrompt}
        onPromptInstall={install}
        isInstalled={isInstalled}
      />
    </>
  );
};
