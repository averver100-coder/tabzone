import {
  AlertTriangle,
  ArrowDownCircle,
  Building,
  Calendar,
  CheckCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Tablet,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Approver, CartType, Rental } from '../types';
import { ReturnConfirmModal } from './ReturnConfirmModal';
import { WeeklyRentalChart } from './WeeklyRentalChart';

interface RentalListProps {
  rentals: Rental[];
  approvers: Approver[];

  onReturn: (
    rental: Rental,
    returnData: { returnApprover: string; returnNotes: string }
  ) => Promise<void>;
  returningId: string | null;
}

export const RentalList: React.FC<RentalListProps> = ({
  rentals,
  approvers,

  onReturn,
  returningId,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'returned' | 'all'>('active');
  const [filterCart, setFilterCart] = useState<'ALL' | '보관함 1' | '보관함 2'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnTargetRental, setReturnTargetRental] = useState<Rental | null>(null);
  const [recentlyReturnedIds, setRecentlyReturnedIds] = useState<Set<string>>(new Set());

  const handleConfirmReturn = async (
    rental: Rental,
    returnData: { returnApprover: string; returnNotes: string }
  ) => {
    await onReturn(rental, returnData);
    setRecentlyReturnedIds((prev) => new Set(prev).add(rental.id));
    setReturnTargetRental(null);

    // Auto-remove highlight after 12 seconds
    setTimeout(() => {
      setRecentlyReturnedIds((prev) => {
        const next = new Set(prev);
        next.delete(rental.id);
        return next;
      });
    }, 12000);
  };
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Reset to 5 when active tab, storage filter, or search query changes
  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab, filterCart, searchQuery]);

  // 1. Query-matched rentals (Cart + Search Query)
  const queryMatchedRentals = rentals.filter((rental) => {
    // Cart filter
    if (filterCart !== 'ALL') {
      const isCart1 = rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함';
      if (filterCart === '보관함 1' && !isCart1) return false;
      if (filterCart === '보관함 2' && isCart1) return false;
    }

    // Search query (teacher, gradeClass, period, rep, approver, returnApprover, returnNotes)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match =
        rental.teacherName.toLowerCase().includes(q) ||
        rental.gradeClass.toLowerCase().includes(q) ||
        rental.period.toLowerCase().includes(q) ||
        rental.studentRep.toLowerCase().includes(q) ||
        rental.approver.toLowerCase().includes(q) ||
        (rental.returnApprover && rental.returnApprover.toLowerCase().includes(q)) ||
        (rental.returnNotes && rental.returnNotes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Dynamic counts for tab badges based on current search query
  const matchedActiveCount = queryMatchedRentals.filter((r) => r.status === '대여 중').length;
  const matchedReturnedCount = queryMatchedRentals.filter((r) => r.status === '반납 완료').length;
  const matchedTotalCount = queryMatchedRentals.length;

  // 2. Filter by active tab
  const filteredRentals = queryMatchedRentals.filter((rental) => {
    if (activeTab === 'active' && rental.status !== '대여 중') return false;
    if (activeTab === 'returned' && rental.status !== '반납 완료') return false;
    return true;
  });

  const activeRentalsCount = rentals.filter((r) => r.status === '대여 중').length;
  const returnedRentalsCount = rentals.filter((r) => r.status === '반납 완료').length;

  const formatCompactDateTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}.${day} ${h}:${min}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* List Header & Tabs (Compact Landscape Tablet Optimized) */}
      <div className="p-2.5 sm:p-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>태블릿 대여 및 반납 현황</span>
            {false && activeRentalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] sm:text-[11px] font-black border border-rose-200 animate-pulse whitespace-nowrap">
                일과 마감 후 미반납 확인 필요
              </span>
            )}
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200 select-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>대여 중</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {searchQuery.trim() ? matchedActiveCount : activeRentalsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returned')}
            className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'returned'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>반납 완료</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'returned' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {searchQuery.trim() ? matchedReturnedCount : returnedRentalsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`h-7.5 sm:h-8 px-3 rounded-md text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({searchQuery.trim() ? matchedTotalCount : rentals.length})
          </button>
        </div>
      </div>

      {/* Enhanced Filter and Quick Search Bar */}
      <div className="p-2.5 sm:p-3 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        {/* Prominent Search Input Box */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="교사 성명(예: 김교사) 또는 학급(예: 1학년 2반)으로 빠른 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              title="검색어 초기화"
              aria-label="검색어 초기화"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right side: Storage Filter Buttons & Search Status Badge */}
        <div className="flex items-center gap-2 flex-wrap select-none shrink-0 justify-between md:justify-end">
          {searchQuery.trim() && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
              <span>검색 결과: <strong className="font-black text-blue-600">{matchedTotalCount}</strong>건</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-500 hover:text-blue-700 ml-1 underline cursor-pointer"
              >
                초기화
              </button>
            </div>
          )}

          {/* Storage filter buttons */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-400 font-bold px-2 text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              보관함
            </span>
            {(['ALL', '보관함 1', '보관함 2'] as const).map((cart) => (
              <button
                key={cart}
                type="button"
                onClick={() => setFilterCart(cart)}
                className={`h-7 px-2.5 rounded-md text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                  filterCart === cart
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cart === 'ALL' ? '전체' : cart}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Helper Banner: Prompt to switch to past returned history if 0 active rentals but returned rentals exist */}
      {searchQuery.trim() && activeTab === 'active' && matchedActiveCount === 0 && matchedReturnedCount > 0 && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Search className="w-3 h-3" />
            </div>
            <span>
              '{searchQuery}' 관련 현재 대여 중인 내역은 없으나, <strong>과거 반납 완료 이력 {matchedReturnedCount}건</strong>이 있습니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('returned')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap self-end sm:self-auto"
          >
            과거 반납 이력 보기 ({matchedReturnedCount}건) →
          </button>
        </div>
      )}

      {/* Rentals List Content - Structured single-row presentation */}
      <div className="divide-y divide-slate-100">
        {filteredRentals.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
              <Search className="w-6 h-6 stroke-1.5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {searchQuery.trim()
                  ? `'${searchQuery}'에 대한 검색 결과가 없습니다.`
                  : '표시할 대여 기록이 없습니다.'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery.trim()
                  ? '교사 이름이나 학급 명칭(예: 1학년 2반)의 맞춤법을 확인하시거나 필터 조건을 변경해 보세요.'
                  : activeTab === 'active'
                  ? '현재 모든 태블릿이 보관함에 반납되어 있습니다.'
                  : '조건에 맞는 대여 내역을 찾을 수 없습니다.'}
              </p>
            </div>

            {searchQuery.trim() && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {activeTab !== 'all' && matchedTotalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    전체 탭에서 보기 ({matchedTotalCount}건)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
                >
                  검색어 초기화
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredRentals.slice(0, visibleCount).map((rental) => {
            const isOverdue = false;
            const isCart1 = rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함';
            const cartDisplay = isCart1 ? '보관함 1' : '보관함 2';
            const cartNum = isCart1 ? '1' : '2';

            const createdFormatted = formatCompactDateTime(rental.createdAt);
            const returnedFormatted = formatCompactDateTime(rental.returnedAt);

            // Check if return notes indicate missing device or alert
            const hasReturnNotes = Boolean(rental.returnNotes && rental.returnNotes.trim());
            const isNotesWarning =
              hasReturnNotes &&
              (rental.returnNotes!.includes('미반납') ||
                rental.returnNotes!.includes('분실') ||
                rental.returnNotes!.includes('파손') ||
                rental.returnNotes!.includes('불량'));

            const isRecentlyReturned = recentlyReturnedIds.has(rental.id);

            return (
              <div
                key={rental.id}
                className={`p-2 sm:p-2.5 transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-2 ${
                  isRecentlyReturned
                    ? 'bg-gradient-to-r from-emerald-100/90 via-emerald-50/90 to-white border-l-4 border-emerald-500 shadow-md ring-2 ring-emerald-400/80 animate-return-success'
                    : isOverdue
                    ? 'bg-rose-50/60 border-l-4 border-rose-500'
                    : rental.status === '대여 중'
                    ? 'hover:bg-slate-50/80 bg-white border-l-4 border-transparent'
                    : isNotesWarning
                    ? 'bg-gradient-to-r from-amber-50/70 via-white to-slate-50/40 border-l-4 border-amber-400 hover:bg-amber-50/90 text-slate-800'
                    : 'bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-white border-l-4 border-emerald-500/90 hover:bg-emerald-50/60 text-slate-800'
                }`}
              >
                {/* Main Single-line Content Stream */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Cart Avatar with Return Status Badge */}
                  <div className="relative shrink-0 select-none">
                    <div
                      className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-2xs border ${
                        isCart1
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {cartNum}
                    </div>
                    {rental.status === '반납 완료' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-1.5 ring-white shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Information Row: Fully unified with whitespace-nowrap on all elements */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0 flex-1 text-xs sm:text-sm">
                    {/* Teacher & Class & Cart info */}
                    <span className="font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                      {rental.teacherName ? rental.teacherName.replace(/\s*\(.*\)/, '') : ''} 선생님
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 whitespace-nowrap">
                      {rental.gradeClass}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 whitespace-nowrap">
                      {rental.period ? rental.period.replace(/\s*\(.*\)/, '') : ''}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${
                        isCart1
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {cartDisplay} · {rental.quantity}대
                    </span>

                    {/* Date and Time (Guaranteed non-clipped font-mono) */}
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 shrink-0 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>대여 {createdFormatted}</span>
                      </span>
                      {returnedFormatted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>반납 {returnedFormatted}</span>
                        </span>
                      )}
                    </div>

                    {/* Approvers & Student Rep */}
                    <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 whitespace-nowrap">
                      {rental.studentRep && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>수령: {rental.studentRep}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                        <ShieldCheck className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>대여승인: {rental.approver}</span>
                      </span>
                      {rental.status === '반납 완료' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold shadow-2xs">
                          <RotateCcw className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>반납승인: {rental.returnApprover || rental.approver}</span>
                        </span>
                      )}
                    </div>

                    {/* Return Notes Badge if any */}
                    {hasReturnNotes && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${
                          isNotesWarning
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {isNotesWarning ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span>비고: {rental.returnNotes}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & Action Button */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-1.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 whitespace-nowrap">
                  {rental.status === '대여 중' ? (
                    <>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-2xs animate-pulse">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>마감시간 초과</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 shadow-2xs">
                        대여 중 ({rental.quantity}대)
                      </span>
                      <button
                        type="button"
                        disabled={returningId === rental.id}
                        onClick={() => setReturnTargetRental(rental)}
                        className="h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {returningId === rental.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>반납 중...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>반납 확인</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs transition-all duration-300 ${
                        isRecentlyReturned
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-500/40 border border-emerald-300 ring-2 ring-emerald-300 scale-105 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-700/25 border border-emerald-400/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>반납 완료</span>
                      {isRecentlyReturned && (
                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] font-black text-white">
                          방금 반납됨
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* [더보기] Button for 10 more records */}
      {visibleCount < filteredRentals.length && (
        <div className="p-3 text-center border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-95 transition shadow-2xs flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <span>[더보기] 대여 내역 추가 10건 보기 ({Math.min(visibleCount, filteredRentals.length)} / {filteredRentals.length})</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Weekly Rental Trend Bar Chart */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/30">
        <WeeklyRentalChart rentals={rentals} />
      </div>

      {/* Return Confirmation Modal */}
      <ReturnConfirmModal
        isOpen={Boolean(returnTargetRental)}
        rental={returnTargetRental}
        approvers={approvers}
        onClose={() => setReturnTargetRental(null)}
        onConfirm={handleConfirmReturn}
        isSubmitting={Boolean(returningId && returnTargetRental?.id === returningId)}
      />
    </div>
  );
};
