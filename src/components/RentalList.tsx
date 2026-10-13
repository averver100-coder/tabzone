import {
  AlertTriangle,
  ArrowDownCircle,
  Building,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  Tablet,
  User,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { CartType, Rental } from '../types';

interface RentalListProps {
  rentals: Rental[];
  isPast1630: boolean;
  onReturn: (rental: Rental) => Promise<void>;
  returningId: string | null;
}

export const RentalList: React.FC<RentalListProps> = ({
  rentals,
  isPast1630,
  onReturn,
  returningId,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'returned' | 'all'>('active');
  const [filterCart, setFilterCart] = useState<'ALL' | CartType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine today's date in local time string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredRentals = rentals.filter((rental) => {
    // Tab filter
    if (activeTab === 'active' && rental.status !== '대여 중') return false;
    if (activeTab === 'returned' && rental.status !== '반납 완료') return false;

    // Cart filter
    if (filterCart !== 'ALL' && rental.cartUsed !== filterCart) return false;

    // Search query (teacher, gradeClass, period, rep)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        rental.teacherName.toLowerCase().includes(q) ||
        rental.gradeClass.toLowerCase().includes(q) ||
        rental.period.toLowerCase().includes(q) ||
        rental.studentRep.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const activeRentalsCount = rentals.filter((r) => r.status === '대여 중').length;
  const returnedRentalsCount = rentals.filter((r) => r.status === '반납 완료').length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* List Header & Tabs (Galaxy Tab S6 Lite Landscape Tablet Optimized) */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <span>태블릿 대여 및 반납 현황</span>
            {isPast1630 && activeRentalsCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 animate-pulse">
                16:30 일과 후 미반납 확인 필요
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            실시간 클라우드 동기화 · 대여 상태 변경 시 보관함 잔여 수량 즉시 복구
          </p>
        </div>

        {/* Tab Switcher (Touch Pills: Height 48px / 12) */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>대여 중</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeRentalsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returned')}
            className={`h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer flex items-center gap-2 ${
              activeTab === 'returned'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>반납 완료</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'returned' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {returnedRentalsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({rentals.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Tablet Touch Enhanced) */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="교사명, 학년반, 교시, 학생대표 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        {/* Storage filter buttons (Large touch pills) */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-slate-500 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
            <Filter className="w-3.5 h-3.5" />
            보관함:
          </span>
          {(['ALL', 'A보관함', 'B보관함'] as const).map((cart) => (
            <button
              key={cart}
              type="button"
              onClick={() => setFilterCart(cart)}
              className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer ${
                filterCart === cart
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cart === 'ALL' ? '전체' : cart}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals List Content */}
      <div className="divide-y divide-slate-100">
        {filteredRentals.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Tablet className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">표시할 대여 기록이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'active'
                ? '현재 모든 태블릿이 보관함에 반납되어 있습니다.'
                : '조건에 맞는 대여 내역을 찾을 수 없습니다.'}
            </p>
          </div>
        ) : (
          filteredRentals.map((rental) => {
            const isOverdue = isPast1630 && rental.status === '대여 중';
            const isA = rental.cartUsed === 'A보관함';
            const createdTime = new Date(rental.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const createdDate = new Date(rental.createdAt).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
            });
            const returnedTime = rental.returnedAt
              ? new Date(rental.returnedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <div
                key={rental.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'bg-rose-50/60 border-l-4 border-rose-500'
                    : rental.status === '대여 중'
                    ? 'hover:bg-slate-50/80 bg-white'
                    : 'bg-slate-50/30 text-slate-600'
                }`}
              >
                {/* Left: Cart Badge & Details */}
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Cart Visual Avatar */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-xs border ${
                      isA
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}
                  >
                    {isA ? 'A' : 'B'}
                  </div>

                  {/* Main Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        {rental.teacherName} 선생님
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                        {rental.gradeClass}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {rental.period}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                          isA
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {rental.cartUsed} ({rental.quantity}대)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        대여: {createdDate} {createdTime}
                      </span>
                      {returnedTime && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          반납: {returnedTime}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        수령메모: {rental.studentRep}
                      </span>
                      <span className="text-slate-400">· 승인: {rental.approver}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & One-Click Return Action */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Status Indicator */}
                  {rental.status === '대여 중' ? (
                    <div className="flex items-center gap-2">
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          16:30 초과 미반납
                        </span>
                      )}
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-black border border-amber-300 shadow-xs">
                        대여 중 ({rental.quantity}대)
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200 shadow-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      반납 완료
                    </span>
                  )}

                  {/* Return Button (Height 52px / 13 for instant tablet finger tap) */}
                  {rental.status === '대여 중' && (
                    <button
                      type="button"
                      disabled={returningId === rental.id}
                      onClick={() => onReturn(rental)}
                      className="h-13 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-300 text-white text-sm sm:text-base font-black shadow-md shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer"
                    >
                      {returningId === rental.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>반납 처리 중...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                          <span>반납 확인</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
