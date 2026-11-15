import {
  Clock,
  FileText,
  KeyRound,
  LogOut,
  Maximize2,
  Minimize2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { TabZoneLogo } from './TabZoneLogo';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenWhitelist: () => void;
  onOpenAuditLogs: () => void;
  onLogout: () => void;
  onTriggerScreensaver?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onOpenWhitelist,
  onOpenAuditLogs,
  onLogout,
  onTriggerScreensaver,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const m = now.getMonth() + 1;
      const d = now.getDate();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const day = dayNames[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${m}월 ${d}일(${day}) ${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs overflow-x-clip">
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 lg:gap-3">
        {/* Brand & School Logo */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div
            onClick={onTriggerScreensaver}
            className="relative group cursor-pointer shrink-0"
            title="대기(Splash) 화면 전환"
            role="button"
            tabIndex={0}
          >
            <TabZoneLogo className="w-10 h-10 sm:w-11 sm:h-11 transition-transform group-hover:scale-105" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                <span>탭존</span>
                <span className="text-blue-600 text-base sm:text-lg font-bold">TabZone</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden 2xl:block whitespace-nowrap">
              교내 스마트 태블릿 통합 대여·반납 관리 시스템
            </p>
          </div>
        </div>

        {/* Center Clock & Status Indicator (그라데이션 버튼 디자인) */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-2xl shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 text-white border border-white/20 select-none transition-all duration-300"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-black tracking-tight text-white/95 whitespace-nowrap font-mono">
            {currentTime || '시각 동기화 중...'}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold whitespace-nowrap">
            LIVE
          </span>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0 max-w-full ml-auto">
          {/* Hide PWA install button in fullscreen / kiosk mode */}
          {!isFullscreen && <PWAInstallButton />}

          {/* Fullscreen kiosk button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-200/80 shadow-xs shrink-0"
            title={isFullscreen ? '창 모드로 복귀' : '태블릿 전체화면 키오스크 모드'}
            aria-label="전체화면 모드"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {currentUser ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0">
              {/* Master Management Menu Button (Admins & Superadmin) */}
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                <button
                  type="button"
                  onClick={onOpenWhitelist}
                  className="flex items-center gap-1.5 h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 text-xs font-bold border border-purple-200 transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                  title="대여·반납 내역 수정 / 대여 승인자 / 담당 교사 / 화이트리스트 관리"
                >
                  <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="whitespace-nowrap">마스터관리</span>
                </button>
              )}

              {/* Audit Log Button (Admins & Superadmin) */}
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                <button
                  type="button"
                  onClick={onOpenAuditLogs}
                  className="flex items-center gap-1.5 h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                  title="감사 로그 및 변경 이력"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="whitespace-nowrap">감사로그</span>
                </button>
              )}

              {/* User badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0">
                <div className="text-right hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1 whitespace-nowrap">
                    {currentUser.role === 'superadmin' ? (
                      <span className="inline-flex items-center gap-1 text-purple-700 whitespace-nowrap">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        슈퍼관리자
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 whitespace-nowrap">
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        관리교사
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[130px] whitespace-nowrap">
                    {currentUser.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 flex items-center justify-center transition cursor-pointer border border-rose-200 shadow-xs shrink-0"
                  title="로그아웃 (세션 및 쿠키 파기)"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
