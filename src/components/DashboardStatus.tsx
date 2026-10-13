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

      {/* Main Storage Status Cards Grid (Compact 3-column optimization) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Cart 1 Card */}
        <div
          onClick={onOpenRentalModal}
          className={`relative p-3.5 sm:p-4 rounded-2xl bg-white border-2 shadow-xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none flex flex-col justify-between ${
            recommendedCart === '보관함 1' || recommendedCart === 'A보관함'
              ? 'border-blue-500 ring-3 ring-blue-100/80'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          {(recommendedCart === '보관함 1' || recommendedCart === 'A보관함') && (
            <div className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-md whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              <span>추천 보관함</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                1
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                  보관함 1
                </h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight whitespace-nowrap">
                {cartA.available}
                <span className="text-sm sm:text-base font-bold text-slate-400"> / {cartA.total}대</span>
              </div>
              <span
                className={`inline-block mt-0.5 text-[11px] font-black px-2 py-0.5 rounded-md ${
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
          <div className="mt-2.5 space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentA}% ({cartA.rented}대 대여 중)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
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
          className={`relative p-3.5 sm:p-4 rounded-2xl bg-white border-2 shadow-xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none flex flex-col justify-between ${
            recommendedCart === '보관함 2' || recommendedCart === 'B보관함'
              ? 'border-emerald-500 ring-3 ring-emerald-100/80'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          {(recommendedCart === '보관함 2' || recommendedCart === 'B보관함') && (
            <div className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-md whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              <span>추천 보관함</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                  보관함 2
                </h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight whitespace-nowrap">
                {cartB.available}
                <span className="text-sm sm:text-base font-bold text-slate-400"> / {cartB.total}대</span>
              </div>
              <span
                className={`inline-block mt-0.5 text-[11px] font-black px-2 py-0.5 rounded-md ${
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
          <div className="mt-2.5 space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentB}% ({cartB.rented}대 대여 중)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
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
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Tablet className="w-3.5 h-3.5 text-blue-400" />
                전체 보유 수량
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-700/80 border border-slate-600 text-slate-200 text-[10px] font-semibold">
                실시간 연동
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalAvailable}</span>
              <span className="text-slate-300 text-xs sm:text-sm font-semibold">/ 60대 즉시 대여 가능</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-medium">현재 사용</span>
                <span className="text-sm font-black text-amber-400">
                  {60 - totalAvailable}대
                </span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-medium">진행 대여</span>
                <span className="text-sm font-black text-blue-400">
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
            className="mt-2.5 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Tablet className="w-4 h-4" />
            <span>신규 대여 신청</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
