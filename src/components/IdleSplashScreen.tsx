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
import { calculateCartCapacities } from '../services/rentalService';
import { formatCartName, Rental } from '../types';

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

  // Calculate cart capacities and available tablet counts
  const { cartA, cartB, totalAvailable } = calculateCartCapacities(rentals);
  const cart1Rented = cartA.available === 0;
  const cart2Rented = cartB.available === 0;

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
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center p-1 overflow-hidden">
              <img
                src="/school-logo.png"
                alt="상일미디어고등학교 로고"
                className="w-full h-full object-contain rounded-full"
              />
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
        {/* Floating School Emblem Logo with slow breathing glow (commute.srdier.kr screensaver style) */}
        <div className="relative mb-6 group flex items-center justify-center">
          {/* Ambient warm golden glow backlight */}
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/25 blur-3xl pointer-events-none" />

          {/* Glowing slow-pulsing school emblem badge */}
          <div className="relative animate-screensaver-pulse select-none flex items-center justify-center">
            {/* Outer golden circular glow ring */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full p-2 bg-gradient-to-b from-amber-400/40 via-amber-500/20 to-amber-600/40 border border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex items-center justify-center backdrop-blur-xs">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1 shadow-inner border border-amber-300/30">
                <img
                  src="/school-logo.png"
                  alt="상일미디어고등학교 로고"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 sm:mb-5 leading-tight drop-shadow-md">
          태블릿이 필요하신가요?
        </h2>

        {/* Real-time Available Tablets Count Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-xl text-slate-200 text-xs sm:text-sm font-semibold select-none mb-7 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  totalAvailable > 0 ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  totalAvailable > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <Tablet className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">현재 대여 가능:</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span
              className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                totalAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalAvailable}대
            </span>
            <span className="text-[11px] text-slate-400 font-medium">/ 60대</span>
          </div>
        </div>

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
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-md mb-2">
          {/* Cart 1 */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              cart1Rented
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/50 border-white/10 text-slate-200 hover:border-emerald-500/40'
            } backdrop-blur-md flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  cart1Rented ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                1
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">1호 충전함</div>
                <div className="text-xs sm:text-sm font-black text-white">보관함 1</div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  cartA.available > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {cartA.available > 0 ? `${cartA.available}대 가능` : '전량 대여중'}
              </span>
            </div>
          </div>

          {/* Cart 2 */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              cart2Rented
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/50 border-white/10 text-slate-200 hover:border-emerald-500/40'
            } backdrop-blur-md flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  cart2Rented ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                2
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">2호 충전함</div>
                <div className="text-xs sm:text-sm font-black text-white">보관함 2</div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  cartB.available > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {cartB.available > 0 ? `${cartB.available}대 가능` : '전량 대여중'}
              </span>
            </div>
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
