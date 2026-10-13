import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Tablet,
} from 'lucide-react';
import React from 'react';
import { CartCapacity, CartType } from '../types';

interface DashboardStatusProps {
  cartA: CartCapacity;
  cartB: CartCapacity;
  totalAvailable: number;
  recommendedCart: CartType;
  activeRentalsCount: number;
  isPast1630: boolean;
  overdueCount: number;
  onOpenRentalModal: () => void;
}

export const DashboardStatus: React.FC<DashboardStatusProps> = ({
  cartA,
  cartB,
  totalAvailable,
  recommendedCart,
  activeRentalsCount,
  isPast1630,
  overdueCount,
  onOpenRentalModal,
}) => {
  const percentA = Math.round((cartA.available / cartA.total) * 100);
  const percentB = Math.round((cartB.available / cartB.total) * 100);

  return (
    <div className="space-y-4">
      {/* 16:30 Overdue Alert Banner if active rentals exist past closing */}
      {isPast1630 && overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg border border-red-400 animate-pulse flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>⚠️ 일과 마감(16:30) 경과 미반납 기기 경고</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-600 font-black text-xs">
                  {overdueCount}건 미반납
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 font-medium mt-0.5">
                오후 4시 30분이 지났으나 아직 반납되지 않은 태블릿이 있습니다. 담당 교사 및 수업 장소를 확인 후 즉시 반납 처리를 진행해 주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Storage Status Cards Grid (Compact 3-column optimization - reduced by ~30%) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Cart 1 Card */}
        <div
          onClick={onOpenRentalModal}
          className={`relative p-2.5 sm:p-3 rounded-xl bg-white border-2 shadow-2xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none flex flex-col justify-between ${
            recommendedCart === '보관함 1' || recommendedCart === 'A보관함'
              ? 'border-blue-500 ring-2 ring-blue-100/80'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          {(recommendedCart === '보관함 1' || recommendedCart === 'A보관함') && (
            <div className="absolute -top-2 left-3 inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-xs whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5" />
              <span>추천</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight leading-none select-none">
                1
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-800 whitespace-nowrap">
                보관함
              </h3>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight whitespace-nowrap leading-tight">
                {cartA.available}
                <span className="text-xs sm:text-sm font-bold text-slate-400"> / {cartA.total}대</span>
              </div>
              <span
                className={`inline-block text-[10px] font-black px-1.5 py-0.2 rounded ${
                  cartA.available >= 15
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : cartA.available > 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {cartA.available >= 15
                  ? '대여 여유'
                  : cartA.available > 0
                  ? '잔여 소량'
                  : '전량 대여중'}
              </span>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div className="mt-1.5 space-y-0.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentA}% ({cartA.rented}대 대여)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  cartA.available >= 15
                    ? 'bg-blue-600'
                    : cartA.available > 0
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentA}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cart 2 Card */}
        <div
          onClick={onOpenRentalModal}
          className={`relative p-2.5 sm:p-3 rounded-xl bg-white border-2 shadow-2xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none flex flex-col justify-between ${
            recommendedCart === '보관함 2' || recommendedCart === 'B보관함'
              ? 'border-emerald-500 ring-2 ring-emerald-100/80'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          {(recommendedCart === '보관함 2' || recommendedCart === 'B보관함') && (
            <div className="absolute -top-2 left-3 inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5" />
              <span>추천</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight leading-none select-none">
                2
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-800 whitespace-nowrap">
                보관함
              </h3>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight whitespace-nowrap leading-tight">
                {cartB.available}
                <span className="text-xs sm:text-sm font-bold text-slate-400"> / {cartB.total}대</span>
              </div>
              <span
                className={`inline-block text-[10px] font-black px-1.5 py-0.2 rounded ${
                  cartB.available >= 15
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : cartB.available > 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {cartB.available >= 15
                  ? '대여 여유'
                  : cartB.available > 0
                  ? '잔여 소량'
                  : '전량 대여중'}
              </span>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div className="mt-1.5 space-y-0.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentB}% ({cartB.rented}대 대여)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  cartB.available >= 15
                    ? 'bg-emerald-600'
                    : cartB.available > 0
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentB}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Summary & Action Card */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xs flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Tablet className="w-3.5 h-3.5 text-blue-400" />
                전체 보유 수량
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-700/80 border border-slate-600 text-slate-200 text-[10px] font-semibold">
                실시간
              </span>
            </div>

            <div className="mt-0.5 flex items-baseline gap-1.5 leading-tight">
              <span className="text-xl sm:text-2xl font-black text-white">{totalAvailable}</span>
              <span className="text-slate-300 text-xs font-semibold">/ 60대 즉시 가능</span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-1 sm:p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-medium">현재 사용</span>
                <span className="text-xs sm:text-sm font-black text-amber-400">
                  {60 - totalAvailable}대
                </span>
              </div>
              <div className="p-1 sm:p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-medium">진행 대여</span>
                <span className="text-xs sm:text-sm font-black text-blue-400">
                  {activeRentalsCount}건
                </span>
              </div>
            </div>
          </div>

          {/* Compact touch button */}
          <button
            type="button"
            onClick={onOpenRentalModal}
            disabled={totalAvailable <= 0}
            className="mt-2 w-full h-8 sm:h-8.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs shadow-blue-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>신규 대여 신청</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
