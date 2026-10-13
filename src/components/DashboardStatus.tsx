import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BatteryCharging,
  CheckCircle,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  Tablet,
} from 'lucide-react';
import React from 'react';
import { CartCapacity, CartType, Rental } from '../types';

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

      {/* Main Storage Status Cards Grid (Galaxy Tab S6 Lite 5:3 landscape 3-column optimization) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Cart A Card */}
        <div
          onClick={onOpenRentalModal}
          className={`relative p-5 sm:p-6 rounded-3xl bg-white border-2 shadow-xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none ${
            recommendedCart === 'A보관함'
              ? 'border-blue-500 ring-4 ring-blue-100/80'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          {recommendedCart === 'A보관함' && (
            <div className="absolute -top-3.5 left-5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>추천 보관함 (교차 균형)</span>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                A
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>A보관함</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                    1호기
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">총 30대 규격 배치</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                {cartA.available}
                <span className="text-base sm:text-lg font-bold text-slate-400"> / {cartA.total}대</span>
              </div>
              <span
                className={`inline-block mt-1 text-xs font-black px-2.5 py-0.5 rounded-md ${
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
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentA}% ({cartA.rented}대 대여 중)</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
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

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <BatteryCharging className="w-4 h-4 text-blue-500" />
              충전 및 보안 락 정상
            </span>
            <span className="font-bold text-slate-700">대여 중: {cartA.rented}대</span>
          </div>
        </div>

        {/* Cart B Card */}
        <div
          onClick={onOpenRentalModal}
          className={`relative p-5 sm:p-6 rounded-3xl bg-white border-2 shadow-xs transition-all hover:shadow-md cursor-pointer active:scale-[0.99] select-none ${
            recommendedCart === 'B보관함'
              ? 'border-emerald-500 ring-4 ring-emerald-100/80'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          {recommendedCart === 'B보관함' && (
            <div className="absolute -top-3.5 left-5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>추천 보관함 (교차 균형)</span>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                B
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>B보관함</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                    2호기
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">총 30대 규격 배치</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                {cartB.available}
                <span className="text-base sm:text-lg font-bold text-slate-400"> / {cartB.total}대</span>
              </div>
              <span
                className={`inline-block mt-1 text-xs font-black px-2.5 py-0.5 rounded-md ${
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
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600">
              <span>보관 잔여율</span>
              <span className="font-extrabold text-slate-800">{percentB}% ({cartB.rented}대 대여 중)</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
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

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <BatteryCharging className="w-4 h-4 text-emerald-500" />
              충전 및 보안 락 정상
            </span>
            <span className="font-bold text-slate-700">대여 중: {cartB.rented}대</span>
          </div>
        </div>

        {/* Quick Summary & Action Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between text-slate-300 text-xs sm:text-sm font-bold">
              <span className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-blue-400" />
                전체 보유 수량
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-700/80 border border-slate-600 text-slate-200 text-xs font-semibold">
                실시간 연동
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white">{totalAvailable}</span>
              <span className="text-slate-300 text-sm sm:text-base font-semibold">/ 60대 즉시 대여 가능</span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
              <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="text-slate-400 text-xs font-medium">현재 사용 중</div>
                <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
                  {60 - totalAvailable}대
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="text-slate-400 text-xs font-medium">진행 대여 건수</div>
                <div className="text-base sm:text-lg font-black text-blue-400 mt-0.5">
                  {activeRentalsCount}건
                </div>
              </div>
            </div>
          </div>

          {/* High-profile touch button (Height 56px / 14) */}
          <button
            type="button"
            onClick={onOpenRentalModal}
            disabled={totalAvailable <= 0}
            className="mt-5 w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-white font-black text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <Tablet className="w-5 h-5" />
            <span>신규 태블릿 대여 신청하기</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
