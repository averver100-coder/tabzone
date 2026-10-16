import {
  ArrowRight,
  BatteryCharging,
  Clock,
  Hand,
  Plus,
  ShieldCheck,
  Tablet,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatCartName, Rental } from '../types';
import { TabZoneLogo } from './TabZoneLogo';

interface IdleSplashScreenProps {
  isOpen: boolean;
  onWakeUp: () => void;
  onOpenRental: () => void;
  rentals: Rental[];
}

export const IdleSplashScreen: React.FC<IdleSplashScreenProps> = ({
  isOpen,
  onWakeUp,
  onOpenRental,
  rentals,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const day = dayNames[now.getDay()];

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setCurrentDate(`${year}년 ${month}월 ${date}일 ${day}`);
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  // Calculate cart usage
  const activeRentals = rentals.filter((r) => r.status === '대여 중');
  const cart1Rented = activeRentals.some((r) => formatCartName(r.cartUsed) === '보관함 1');
  const cart2Rented = activeRentals.some((r) => formatCartName(r.cartUsed) === '보관함 2');

  const handleRentalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenRental();
  };

  return (
    <div
      onClick={onWakeUp}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#060e1d] via-[#0a1830] to-[#040913] text-white select-none cursor-pointer transition-opacity duration-500 animate-in fade-in"
      role="button"
      tabIndex={0}
      aria-label="대기 화면 - 화면을 터치하여 메인 현황판으로 이동"
    >
      {/* Ambient decorative glowing backlights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* TOP BAR: School Identity & Live Digital Clock */}
      <header className="relative z-10 w-full px-8 py-6 sm:px-12 sm:py-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              상일미디어고등학교
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-normal">
                스마트 탭존
              </span>
            </h1>
            <p className="text-xs text-slate-400">교내 태블릿 대여 및 반납 키오스크 시스템</p>
          </div>
        </div>

        {/* Date & Time Widget */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
            {currentTime}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium flex items-center justify-end gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentDate}</span>
          </div>
        </div>
      </header>

      {/* CENTER CONTENT: Brand Logo, Headline & Prominent Rental CTA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-4xl mx-auto w-full">
        {/* Floating 3D Logo with glow effect */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl transform scale-125 animate-pulse" />
          <div className="relative transform hover:scale-105 transition-transform duration-500 drop-shadow-[0_20px_35px_rgba(217,119,6,0.3)]">
            <TabZoneLogo className="w-32 h-32 sm:w-40 sm:h-40" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-8 sm:mb-10 leading-tight drop-shadow-md">
          태블릿이 필요하신가요?
        </h2>

        {/* HIGHLIGHTED '대여하기' BUTTON (PROMINENT KIOSK CTA) */}
        <div className="relative mb-8 group">
          {/* Pulsing neon glow halo behind button */}
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 opacity-70 blur-xl group-hover:opacity-100 transition duration-500 animate-pulse" />
          
          <button
            onClick={handleRentalClick}
            className="relative px-10 sm:px-14 py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-95 text-white font-black text-2xl sm:text-3xl shadow-2xl shadow-blue-600/50 flex items-center gap-4 border-2 border-white/30 transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white stroke-[3]" />
            </div>
            <span className="tracking-wide">태블릿 대여하기</span>
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 transform group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Quick Tablet Cart Live Availability Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-2">
          {/* Cart 1 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              cart1Rented
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            } backdrop-blur-sm flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${
                  cart1Rented ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                1
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">1호 충전함</div>
                <div className="text-sm font-bold">보관함 1</div>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                cart1Rented ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {cart1Rented ? '대여중' : '대여 가능'}
            </span>
          </div>

          {/* Cart 2 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              cart2Rented
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            } backdrop-blur-sm flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${
                  cart2Rented ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                2
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">2호 충전함</div>
                <div className="text-sm font-bold">보관함 2</div>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                cart2Rented ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {cart2Rented ? '대여중' : '대여 가능'}
            </span>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER: Touch to return guide */}
      <footer className="relative z-10 w-full px-8 py-5 flex items-center justify-center border-t border-white/5 backdrop-blur-sm bg-white/[0.01]">
        <div className="flex items-center gap-2.5 text-slate-400 text-sm sm:text-base font-medium animate-pulse">
          <Hand className="w-5 h-5 text-amber-400 animate-bounce" />
          <span>화면 아무 곳이나 터치하면 메인 현황판으로 돌아갑니다</span>
        </div>
      </footer>
    </div>
  );
};
