import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { SUPER_ADMIN_EMAIL } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  onSuperAdminBypass: () => void;
  authError: string | null;
  isLoggingIn: boolean;
  rejectedEmail: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
  onSuperAdminBypass,
  authError,
  isLoggingIn,
  rejectedEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
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
            onClick={onClose}
            disabled={isLoggingIn}
            className="w-12 h-12 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Whitelist Rejection Error Box with EXACT mandated text */}
          {rejectedEmail && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>교직원 접근 권한 인가 실패</span>
              </div>
              <div className="text-xs text-rose-600 font-mono bg-rose-100/70 p-1.5 rounded-lg">
                접속 시도 계정: {rejectedEmail}
              </div>
              <p className="text-xs font-semibold leading-relaxed text-rose-800">
                본 시스템은 보안 및 데이터 정합성을 위해 사전 인가된 교직원 계정만 로그인을 허용합니다. 접속이 필요하신 경우 관리자에게 계정 등록 또는 활성화를 요청하세요.
              </p>
            </div>
          )}

          {/* Generic Auth Error */}
          {authError && !rejectedEmail && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="text-center space-y-2 py-2">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900">
              구글 교직원 계정으로 본인 인증
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              학교 구글 워크스페이스 또는 사전 등록된 화이트리스트 계정으로 1-클릭 소셜 로그인을 진행합니다.
            </p>
          </div>

          {/* Google OAuth Login Button (Touch Height 56px / 14) */}
          <button
            type="button"
            disabled={isLoggingIn}
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
                {/* Google "G" Icon */}
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
                <span>Google 계정으로 로그인</span>
              </>
            )}
          </button>

          {/* Superadmin SSO Quick-connect fallback button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onSuperAdminBypass}
              className="w-full h-12 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 text-xs sm:text-sm font-bold border border-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>교내 서브도메인 통합인증(SSO) 세션 즉시 복원</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1">
              srider.kr 패밀리 앱(commute, device 등)의 슈퍼어드민 세션을 자동으로 연동합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
