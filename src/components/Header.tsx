import {
  Clock,
  FileText,
  KeyRound,
  LogOut,
  Maximize2,
  Minimize2,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenWhitelist: () => void;
  onOpenAuditLogs: () => void;
  onLogout: () => void;
  isPast1630: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onOpenWhitelist,
  onOpenAuditLogs,
  onLogout,
  isPast1630,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      setCurrentTime(`${dateStr} ${timeStr}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand & School Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/icon.svg"
                alt="탭존 로고"
                className="w-11 h-11 object-contain drop-shadow"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>탭존</span>
                <span className="text-blue-600 text-lg sm:text-xl font-bold">TabZone</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              교내 스마트 태블릿 통합 대여·반납 관리 시스템
            </p>
          </div>
        </div>

        {/* Center Clock & Status Indicator (그라데이션 버튼 디자인) */}
        <div
          className={`hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-2xl ${
            isPast1630
              ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 shadow-md shadow-rose-500/20 text-white'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 text-white'
          } border border-white/20 select-none transition-all duration-300`}
        >
          <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Clock className={`w-4 h-4 text-white ${isPast1630 ? 'animate-pulse' : ''}`} />
          </div>
          <span className="text-sm font-black tracking-tight text-white/95">
            {currentTime || '시각 동기화 중...'}
          </span>
          {isPast1630 ? (
            <span className="px-2.5 py-1 rounded-full bg-white/25 text-white text-[11px] font-black border border-white/30 animate-pulse">
              16:30 일과 마감 경과
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
              LIVE
            </span>
          )}
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <PWAInstallButton />

          {/* Fullscreen kiosk button (Touch target 48px) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-200/80 shadow-xs"
            title={isFullscreen ? '창 모드로 복귀' : '태블릿 전체화면 키오스크 모드'}
            aria-label="전체화면 모드"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Superadmin Menu Button */}
              {currentUser.role === 'superadmin' && (
                <button
                  type="button"
                  onClick={onOpenWhitelist}
                  className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 text-sm font-bold border border-purple-200 transition cursor-pointer shadow-xs"
                  title="화이트리스트 / 대여 승인자 / 담당 교사 관리"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>마스터 관리</span>
                </button>
              )}

              {/* Audit Log Button (Admins & Superadmin) */}
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                <button
                  type="button"
                  onClick={onOpenAuditLogs}
                  className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-bold border border-slate-300 transition cursor-pointer shadow-xs"
                  title="감사 로그 및 변경 이력"
                >
                  <FileText className="w-4 h-4" />
                  <span>감사로그</span>
                </button>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                    {currentUser.role === 'superadmin' ? (
                      <span className="inline-flex items-center gap-1 text-purple-700">
                        <ShieldCheck className="w-4 h-4" />
                        슈퍼관리자
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700">
                        <UserCheck className="w-4 h-4" />
                        관리교사
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]">
                    {currentUser.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-12 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 flex items-center justify-center transition cursor-pointer border border-rose-200 shadow-xs"
                  title="로그아웃 (세션 및 쿠키 파기)"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer border border-slate-200/80 shadow-xs"
              title="관리자 설정 (교직원 로그인)"
              aria-label="관리자 설정"
            >
              <Settings className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
