import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuthErrorInfo } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  onStaffEmailLogin: (email: string) => Promise<boolean>;
  authError: AuthErrorInfo | string | null;
  isLoggingIn: boolean;
  rejectedEmail: string | null;
  onClearErrors?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
  onStaffEmailLogin,
  authError,
  isLoggingIn,
  rejectedEmail,
  onClearErrors,
}) => {
  const [copied, setCopied] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  if (!isOpen) return null;

  // Normalize error info
  const errorInfo: AuthErrorInfo | null =
    typeof authError === 'string'
      ? {
          code: authError.includes('unauthorized-domain')
            ? 'auth/unauthorized-domain'
            : 'general',
          title: authError.includes('unauthorized-domain')
            ? '파이어베이스 승인 도메인 등록 필요'
            : '로그인 오류',
          message: authError,
          isDomainError:
            authError.includes('unauthorized-domain') ||
            authError.includes('auth/unauthorized-domain'),
          domain: typeof window !== 'undefined' ? window.location.hostname : '',
          consoleUrl:
            'https://console.firebase.google.com/project/gen-lang-client-0441740129/authentication/settings',
        }
      : authError;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '현재 도메인';
  const consoleSettingsUrl =
    errorInfo?.consoleUrl ||
    'https://console.firebase.google.com/project/gen-lang-client-0441740129/authentication/settings';

  const handleCopyHostname = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentHostname);
      } else {
        const input = document.createElement('input');
        input.value = currentHostname;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim()) return;
    setIsEmailSubmitting(true);
    await onStaffEmailLogin(staffEmail.trim());
    setIsEmailSubmitting(false);
  };

  const handleClose = () => {
    if (onClearErrors) onClearErrors();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">교직원 보안 로그인</h3>
              <p className="text-xs text-blue-100">인가된 교직원 계정 화이트리스트 검증</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoggingIn || isEmailSubmitting}
            className="w-11 h-11 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content (Scrollable if viewport is small) */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto">
          {/* Whitelist Rejection Error Box with EXACT mandated text */}
          {rejectedEmail && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>교직원 접근 권한 인가 실패</span>
              </div>
              <div className="text-xs text-rose-600 font-mono bg-rose-100/70 p-1.5 rounded-lg break-all">
                접속 시도 계정: {rejectedEmail}
              </div>
              <p className="text-xs font-semibold leading-relaxed text-rose-800">
                본 시스템은 보안 및 데이터 정합성을 위해 사전 인가된 교직원 계정만 로그인을 허용합니다. 접속이 필요하신 경우 관리자에게 계정 등록 또는 활성화를 요청하세요.
              </p>
            </div>
          )}

          {/* Firebase Authorized Domain Error Diagnostic Panel */}
          {errorInfo && errorInfo.isDomainError && (
            <div className="p-4.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 animate-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-amber-900">
                    파이어베이스 승인 도메인(Authorized Domain) 등록 필요
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    현재 접속 중인 도메인이 Firebase 콘솔의 <strong>승인된 도메인</strong> 목록에 없어 Google 소셜 로그인이 차단되었습니다.
                  </p>
                </div>
              </div>

              {/* Domain Copy Box */}
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 text-xs">
                <div className="font-mono text-slate-800 truncate font-semibold">
                  {currentHostname}
                </div>
                <button
                  type="button"
                  onClick={handleCopyHostname}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>도메인 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Firebase Console Action */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-10 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer text-center"
                >
                  <span>Firebase 콘솔 승인 도메인 설정 바로가기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-[11px] text-amber-800/90 bg-amber-100/60 p-2.5 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">💡 간단 해결 3단계:</div>
                <p>1. 위 <strong>[도메인 복사]</strong> 버튼을 누릅니다.</p>
                <p>2. <strong>[Firebase 콘솔 바로가기]</strong>를 눌러 Authentication &gt; 설정 &gt; [승인된 도메인]으로 이동합니다.</p>
                <p>3. <strong>[도메인 추가]</strong>에 붙여넣기 하면 Google 로그인이 즉시 정상 작동합니다.</p>
              </div>
            </div>
          )}

          {/* Generic Auth Error Box */}
          {errorInfo && !errorInfo.isDomainError && !rejectedEmail && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold">{errorInfo.title}</div>
                <div>{errorInfo.message}</div>
                {errorInfo.actionGuide && (
                  <div className="text-[11px] text-amber-700 font-semibold">{errorInfo.actionGuide}</div>
                )}
              </div>
            </div>
          )}

          {/* PRIMARY OPTION 1: Standard Google OAuth Login */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isLoggingIn || isEmailSubmitting}
              onClick={onGoogleLogin}
              className="w-full h-14 px-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 border-2 border-slate-300 shadow-sm flex items-center justify-center gap-3 font-black text-slate-800 text-base transition cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Google 인증 진행 중...</span>
                </>
              ) : (
                <>
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
                  <span>Google 교직원 계정으로 로그인</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              학교 구글 워크스페이스 또는 사전 등록된 화이트리스트 계정
            </p>
          </div>

          {/* PRIMARY OPTION 3: Staff Email Direct Whitelist Verification */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEmailInput((prev) => !prev)}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>등록된 교직원 이메일로 직접 인증하기</span>
              </span>
              {showEmailInput ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showEmailInput && (
              <form onSubmit={handleEmailSubmit} className="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in slide-in-from-top-1">
                <div className="text-xs text-slate-600">
                  화이트리스트에 사전 등록된 교직원 이메일을 입력하세요.
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="교직원 이메일 (예: teacher@school.kr)"
                    disabled={isLoggingIn || isEmailSubmitting}
                    className="flex-1 h-12 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoggingIn || isEmailSubmitting || !staffEmail.trim()}
                    className="h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isEmailSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>확인</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
