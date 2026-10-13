import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  HelpCircle,
  Laptop,
  Lightbulb,
  Share2,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { BeforeInstallPromptEvent, usePWAInstall } from '../hooks/usePWAInstall';

interface GalaxyPostInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Galaxy Tab S6 Lite & Android One UI specific post-installation guide modal
 * Explains clearly why the app is in the App Drawer (앱스 화면) and how to pin it to Home screen
 */
export const GalaxyPostInstallModal: React.FC<GalaxyPostInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 text-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-300 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                앱 설치 요청이 정상 접수되었습니다!
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                갤럭시 탭 S6 Lite 홈 화면에서 앱 아이콘을 확인하는 방법
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
          {/* Important Notice Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>왜 홈 화면에 바로 안 보이나요? (삼성 갤럭시 특성 안내)</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              삼성 갤럭시(One UI)의 기본 설정상, 새로 설치된 앱은 홈 화면이 아니라{' '}
              <strong>[앱스 화면(전체 앱 목록)]</strong> 맨 마지막 페이지에 먼저 저장됩니다.
              또한 안드로이드 시스템이 앱 패키지(WebAPK)를 생성하는 데 약 <strong>10~20초</strong> 정도 소요될 수 있습니다.
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Tablet className="w-4 h-4 text-blue-600" />
              <span>갤럭시 탭 홈 화면에 아이콘 꺼내기 (3단계)</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs">
                  1
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">홈 화면에서 위로 쓸어 올리기 (앱스 화면 열기)</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    갤럭시 탭 홈 화면 빈 곳을 손가락으로 <strong>위로 쓱 쓸어 올려</strong> 설치된 모든 앱 목록을 엽니다.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs">
                  2
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">맨 마지막 페이지에서 '탭존' 아이콘 찾기</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    페이지를 맨 오른쪽 끝으로 넘기면 방금 설치된 파란색 <strong>'탭존'</strong> 앱 아이콘이 있습니다.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs">
                  3
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">1초간 길게 눌러 [홈 화면에 추가] 선택</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    '탭존' 아이콘을 <strong>1초간 꾹 누른 뒤 팝업 메뉴에서 [홈 화면에 추가]</strong>를 터치하시면 홈 화면에 바로가기가 생성됩니다!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Standalone Kiosk Benefit */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-emerald-950">단독 키오스크로 실행하기</p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                홈 화면의 '탭존' 아이콘으로 접속하시면 상단 주소창이나 브라우저 탭 메뉴 없이 <strong>전체화면 단독 키오스크</strong>로 시원하게 작동합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-black transition cursor-pointer shadow-sm"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop' | 'howitworks'>('mobile');

  if (!isOpen) return null;

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isMac = typeof navigator !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent);

  return (
    <div
      id="pwa-install-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 text-slate-800 my-auto overflow-hidden flex flex-col max-h-[90vh]"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
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
                <span>태블릿 &amp; PC 앱 설치 안내</span>
                {isInstalled && (
                  <span className="text-[11px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    단독 앱 구동 중
                  </span>
                )}
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                주소창 없는 단독 키오스크 창으로 갤럭시 탭 홈 화면에서 즉시 실행
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
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'mobile'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>갤럭시 탭 / 모바일 설치</span>
          </button>
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
            <span>데스크톱 PC 설치</span>
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
                    현재 개발 미리보기(Iframe) 화면입니다
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    브라우저 보안 규정상 Iframe 내부에서는 앱 자동 설치 팝업이 차단됩니다. 아래 버튼을 눌러 외부 브라우저(새 창)로 열어 설치해 주세요.
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
                  아래 버튼을 누르면 브라우저의 공식 설치 확인 창이 나타납니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onPromptInstall}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>지금 원클릭 설치</span>
              </button>
            </div>
          )}

          {/* Tab: Mobile & Tablet */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              {/* Galaxy Tab S6 Lite Specific Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                  <span>📱 갤럭시 탭 S6 Lite (One UI) 설치 &amp; 홈 화면 배치 방법</span>
                </h4>

                <div className="space-y-2.5 text-slate-700 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[11px]">
                      1
                    </span>
                    <span>
                      상단의 <strong>[지금 원클릭 설치]</strong> 버튼 또는 브라우저 주소창 우측/메뉴(⋮)의 <strong>[앱 설치]</strong>를 누릅니다.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[11px]">
                      2
                    </span>
                    <span>
                      <strong>아이콘 위치 확인</strong>: 설치가 완료되면 삼성 갤럭시 특성상 기본적으로 홈 화면이 아닌{' '}
                      <strong>[앱스 화면(전체 앱 목록)]</strong> 맨 뒤에 아이콘이 추가됩니다.{' '}
                      <em>(홈 화면에서 화면을 위로 쓸어 올려 확인)</em>
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[11px]">
                      3
                    </span>
                    <span>
                      '탭존' 아이콘을 <strong>1초간 길게 꾹 누른 뒤 [홈 화면에 추가]</strong>를 터치하시면 홈 화면에 바로가기가 생성됩니다.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                  <p className="font-bold mb-1">🌐 삼성 인터넷(Samsung Internet) 브라우저 팁:</p>
                  <p className="leading-relaxed">
                    하단 오른쪽 메뉴(≡) ➔ <strong>[현재 페이지 추가]</strong> ➔ <strong>[홈 화면]</strong>을 터치하시면 즉시 홈 화면에 아이콘이 생성됩니다.
                  </p>
                </div>
              </div>

              {/* iOS Guide */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                  <span>🍎 아이패드 / 아이폰 (iOS Safari)</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Safari 하단 툴바의 <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> <strong>공유</strong> 버튼 ➔ <strong>[홈 화면에 추가]</strong>를 선택하시면 홈 화면에 바로가기 앱이 생성됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Desktop PC */}
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
                      브라우저 최상단 주소창(URL 입력창) 오른쪽 끝의{' '}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[11px] text-slate-800 font-bold">
                        [모니터/다운로드 📥 또는 ⊕]
                      </span>{' '}
                      아이콘을 클릭합니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      2
                    </span>
                    <span>
                      팝업 창에서 <strong>[설치]</strong> 버튼을 누릅니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-black text-[11px]">
                      3
                    </span>
                    <span>
                      Windows <strong>바탕화면에 '탭존' 바로가기</strong>가 등록되며 주소창 없는 독립 키오스크 창으로 실행됩니다.
                    </span>
                  </li>
                </ol>
              </div>

              {isMac && (
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                  <p className="font-bold text-slate-900 mb-1">🍎 Mac(macOS) 사용자 안내</p>
                  <p className="leading-relaxed">
                    Safari 메뉴 ➔ <strong>[Dock에 추가...]</strong> 또는 Chrome 주소창 설치 아이콘을 클릭하시면 Mac Dock 및 런치패드에서 바로 실행하실 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: How It Works */}
          {activeTab === 'howitworks' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>앱 설치 후 장점 및 구동 원리</span>
                </div>
                <p className="text-xs text-emerald-800/95 leading-relaxed">
                  PWA(Progressive Web App)는 웹 브라우저의 <strong>Service Worker(서비스 워커) 캐시 기술</strong>을 통해 교내 네트워크 지연 시에도 화면을 즉시 로딩합니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200">
                    <p className="font-black text-xs text-emerald-950 mb-1">🖥️ 단독 키오스크 창 실행</p>
                    <p className="text-[11px] text-emerald-800">
                      브라우저 주소창 없이 전체화면 키오스크 형태로 구동되어 충전함 거치대 환경에 최적화됩니다.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200">
                    <p className="font-black text-xs text-emerald-950 mb-1">⚡ 고속 터치 반응성</p>
                    <p className="text-[11px] text-emerald-800">
                      불필요한 브라우저 인터페이스가 사라져 태블릿 화면을 100% 활용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Tablet className="w-3.5 h-3.5 text-slate-400" />
            <span>탭존 (TabZone) - 스마트 태블릿 대여 관리 시스템</span>
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

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  fullWidth = false,
  className = '',
}) => {
  const {
    deferredPrompt,
    isInstalled,
    showGalaxyInstallGuide,
    dismissGalaxyInstallGuide,
    install,
  } = usePWAInstall();
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
            title="PWA 단독 키오스크 창으로 실행 중입니다. (클릭 시 상세 안내)"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>PWA 키오스크 앱 구동 중</span>
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
          title="PWA 단독 키오스크 창으로 실행 중입니다. (클릭 시 상세 정보)"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">PWA 키오스크 구동 중</span>
          <span className="sm:hidden">키오스크 구동중</span>
        </button>
      ) : (
        <button
          id="pwa-install-btn"
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-4.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/25 border border-white/20 transition-all cursor-pointer duration-200 ${className}`}
          title="바탕화면 및 모바일 홈 화면에 앱 설치 (클릭 시 원클릭 설치 및 안내)"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="tracking-tight whitespace-nowrap">앱 설치 (PC/모바일)</span>
        </button>
      )}

      {/* Galaxy Tab Post-Install Notice Modal */}
      <GalaxyPostInstallModal
        isOpen={showGalaxyInstallGuide}
        onClose={dismissGalaxyInstallGuide}
      />

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
