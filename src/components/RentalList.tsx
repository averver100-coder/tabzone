import {
  AlertTriangle,
  ArrowDownCircle,
  Building,
  Calendar,
  CheckCircle,
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
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Approver, CartType, Rental } from '../types';
import { ReturnConfirmModal } from './ReturnConfirmModal';

interface RentalListProps {
  rentals: Rental[];
  approvers: Approver[];
  isPast1630: boolean;
  onReturn: (
    rental: Rental,
    returnData: { returnApprover: string; returnNotes: string }
  ) => Promise<void>;
  returningId: string | null;
}

export const RentalList: React.FC<RentalListProps> = ({
  rentals,
  approvers,
  isPast1630,
  onReturn,
  returningId,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'returned' | 'all'>('active');
  const [filterCart, setFilterCart] = useState<'ALL' | '보관함 1' | '보관함 2'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnTargetRental, setReturnTargetRental] = useState<Rental | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Reset to 5 when active tab, storage filter, or search query changes
  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab, filterCart, searchQuery]);

  const filteredRentals = rentals.filter((rental) => {
    // Tab filter
    if (activeTab === 'active' && rental.status !== '대여 중') return false;
    if (activeTab === 'returned' && rental.status !== '반납 완료') return false;

    // Cart filter
    if (filterCart !== 'ALL') {
      const isCart1 = rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함';
      if (filterCart === '보관함 1' && !isCart1) return false;
      if (filterCart === '보관함 2' && isCart1) return false;
    }

    // Search query (teacher, gradeClass, period, rep, approver, returnApprover, returnNotes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
            {isPast1630 && activeRentalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] sm:text-[11px] font-black border border-rose-200 animate-pulse whitespace-nowrap">
                16:30 일과 후 미반납 확인 필요
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
              {activeRentalsCount}
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
              {returnedRentalsCount}
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
            전체 ({rentals.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-1.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="교사명, 학년반, 승인자, 특이사항 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8.5 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Storage filter buttons */}
        <div className="flex items-center gap-1.5 select-none shrink-0">
          <span className="text-slate-500 font-bold flex items-center gap-1 text-xs whitespace-nowrap">
            <Filter className="w-3 h-3" />
            보관함:
          </span>
          {(['ALL', '보관함 1', '보관함 2'] as const).map((cart) => (
            <button
              key={cart}
              type="button"
              onClick={() => setFilterCart(cart)}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                filterCart === cart
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cart === 'ALL' ? '전체' : cart}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals List Content - Structured single-row presentation */}
      <div className="divide-y divide-slate-100">
        {filteredRentals.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Tablet className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-1.5" />
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

            return (
              <div
                key={rental.id}
                className={`p-2 sm:p-2.5 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-2 ${
                  isOverdue
                    ? 'bg-rose-50/60 border-l-4 border-rose-500'
                    : rental.status === '대여 중'
                    ? 'hover:bg-slate-50/80 bg-white'
                    : isNotesWarning
                    ? 'bg-amber-50/40 border-l-4 border-amber-400'
                    : 'bg-slate-50/30 text-slate-600'
                }`}
              >
                {/* Main Single-line Content Stream */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Cart Avatar Number 1 or 2 */}
                  <div
                    className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-2xs border ${
                      isCart1
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}
                  >
                    {cartNum}
                  </div>

                  {/* Information Row: Fully unified with whitespace-nowrap on all elements */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0 flex-1 text-xs sm:text-sm">
                    {/* Teacher & Class & Cart info */}
                    <span className="font-black text-slate-900 text-sm sm:text-base whitespace-nowrap">
                      {rental.teacherName} 선생님
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 whitespace-nowrap">
                      {rental.gradeClass}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 whitespace-nowrap">
                      {rental.period}
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <RotateCcw className="w-3 h-3 text-emerald-600 shrink-0" />
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
                          <span>16:30 초과</span>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>반납 완료</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return Confirmation Modal */}
      <ReturnConfirmModal
        isOpen={Boolean(returnTargetRental)}
        rental={returnTargetRental}
        approvers={approvers}
        onClose={() => setReturnTargetRental(null)}
        onConfirm={onReturn}
        isSubmitting={Boolean(returningId && returnTargetRental?.id === returningId)}
      />
    </div>
  );
};
