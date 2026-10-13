import {
  AlertTriangle,
  ChevronRight,
  Compass,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AuthErrorInfo } from '../services/authService';
import { TabZoneLogo } from './TabZoneLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGooglePopupLogin: () => Promise<void>;
  onGoogleRedirectLogin: () => Promise<void>;
  onCheckSSO: () => boolean;
  authError: AuthErrorInfo | string | null;
  isLoggingIn: boolean;
  loginStatusText?: string;
  onClearErrors?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGooglePopupLogin,
  onGoogleRedirectLogin,
  onCheckSSO,
  authError,
  isLoggingIn,
  loginStatusText,
  onClearErrors,
}) => {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const inApp =
        ua.includes('kakaotalk') ||
        ua.includes('naver') ||
        ua.includes('instagram') ||
        ua.includes('line') ||
        ua.includes('fbav') ||
        ua.includes('whale');
      setIsInApp(inApp);
    }
  }, []);

  if (!isOpen) return null;

  // Extract error string
  const errorMessage =
    typeof authError === 'string'
      ? authError
      : authError
      ? authError.message
      : null;

  const handleOpenExternalBrowser = () => {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('kakaotalk')) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
      return;
    }

    if (/android/i.test(navigator.userAgent)) {
      const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUrl);
      alert('페이지 주소가 복사되었습니다. 사파리(Safari) 또는 크롬(Chrome) 브라우저 주소창에 붙여넣기 해주세요.');
    }
  };

  const handleClose = () => {
    if (onClearErrors) onClearErrors();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 relative">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoggingIn}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
          aria-label="닫기"
          title="닫기"
        >
          <X size={18} />
        </button>

        {/* 1. Header (Identical to devicecare-drab.vercel.app) */}
        <div className="bg-[#122744] pt-8 pb-7 px-6 text-center text-white relative overflow-hidden">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center mb-3.5">
            <TabZoneLogo className="w-full h-full drop-shadow-xl" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">IT Desk</h1>
          <p className="text-xs sm:text-sm font-semibold text-blue-200 mt-1 tracking-wide">
            교직원 디바이스 관리 시스템
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#0a182c] text-blue-200 border border-blue-400/30 shadow-inner">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Google 소셜 계정 화이트리스트 보안 인증</span>
          </div>
        </div>

        {/* 2. Body Content (Identical to devicecare-drab.vercel.app) */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <Lock size={18} className="text-blue-700" />
              <span>Google 계정 본인 인증 로그인</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              상일미디어고등학교 인가 관리자 계정으로 Google 본인 인증 후 안전하게 접속합니다.
            </p>
          </div>

          {/* Kakao / In-app Browser Notice */}
          {isInApp && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-2xl text-xs space-y-2.5 shadow-xs animate-in slide-in-from-top-1">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-950">카카오톡 / 인앱 브라우저 접속 안내</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Google 보안 정책상 인앱 브라우저에서는 소셜 로그인이 차단될 수 있습니다. 정상 로그인을 위해 기본 브라우저로 열어주세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenExternalBrowser}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>기본 브라우저(Safari / Chrome)로 열기</span>
              </button>
            </div>
          )}

          {/* Login Error Notification */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 shadow-xs animate-in slide-in-from-top-1">
              <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-bold text-rose-950">로그인 불가 안내</p>
                <p className="mt-0.5 text-rose-800 break-words">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login Progress Spinner */}
          {isLoggingIn && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <Loader2 size={16} className="animate-spin text-blue-600 shrink-0" />
              <span className="font-medium text-blue-800">
                {loginStatusText || 'Google 계정 확인 중...'}
              </span>
            </div>
          )}

          {/* Buttons Area */}
          <div className="space-y-3 pt-1">
            {/* Primary Google Login Button (Popup) */}
            <button
              type="button"
              onClick={onGooglePopupLogin}
              disabled={isLoggingIn}
              className="w-full relative flex items-center justify-between px-4 sm:px-5 py-3.5 border-2 border-slate-300 hover:border-blue-500 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all shadow-xs hover:shadow-md focus:ring-4 focus:ring-blue-100 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {isLoggingIn ? (
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                {isLoggingIn ? 'Google 본인 인증 중...' : 'Google 계정으로 로그인'}
              </span>
              <ChevronRight
                size={18}
                className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
              />
            </button>

            {/* Mobile / Full Browser Redirect Button */}
            <button
              type="button"
              onClick={onGoogleRedirectLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              title="모바일 환경이거나 팝업이 뜨지 않을 때 전체 페이지 이동으로 로그인합니다."
            >
              <Compass size={15} className="text-slate-500" />
              <span>모바일 / 브라우저 이동 로그인 (리다이렉트)</span>
            </button>

            {/* Cross-Domain srider.kr SSO Check Button */}
            <button
              type="button"
              onClick={onCheckSSO}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              title="다른 srider.kr 서브도메인(디바이스관리, 출퇴근 등)에서 로그인된 슈퍼어드민 세션을 가져옵니다."
            >
              <RefreshCw size={11} />
              <span>srider.kr 통합 로그인 상태 확인</span>
            </button>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center text-[11px] text-slate-400">
            © 상일미디어고등학교 IT Desk · 교직원 스마트태블릿 대여 관리 시스템
          </div>
        </div>
      </div>
    </div>
  );
};
