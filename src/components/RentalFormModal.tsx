import {
  AlertCircle,
  Building,
  Check,
  Clock,
  History,
  Info,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Tablet,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Approver, CartCapacity, CartType, Rental, Teacher } from '../types';

interface RentalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedCart: CartType;
  cartA: CartCapacity;
  cartB: CartCapacity;
  teachers: Teacher[];
  approvers: Approver[];
  onSubmit: (data: {
    period: string;
    gradeClass: string;
    teacherName: string;
    studentRep: string;
    cartUsed: CartType;
    quantity: number;
    approver: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  rentals?: Rental[];
}

export interface StudentRepRecord {
  name: string;
  gradeClass: string;
  lastUsed: string;
}

const LOCAL_STORAGE_STUDENT_REPS = 'tabzone_student_reps_history';

function getLocalStudentReps(): StudentRepRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STUDENT_REPS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return [];
}

function saveLocalStudentRep(name: string, gradeClass: string) {
  const cleanName = name.trim();
  if (!cleanName) return;
  try {
    const existing = getLocalStudentReps().filter(
      (r) => !(r.name.toLowerCase() === cleanName.toLowerCase() && r.gradeClass === gradeClass)
    );
    const updated: StudentRepRecord[] = [
      { name: cleanName, gradeClass, lastUsed: new Date().toISOString() },
      ...existing,
    ].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_STUDENT_REPS, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

// School timetable from 2026.03.04 schedule
const TIMETABLE_PERIODS = [
  '1교시',
  '2교시',
  '3교시',
  '4교시',
  '점심 시간',
  '5교시',
  '6교시',
  '7교시',
];

// Grade & Class specifications:
// 1학년: 10반, 2학년: 9반, 3학년: 11반
const GRADE_CLASS_MAPPING: Record<string, string[]> = {
  '1학년': Array.from({ length: 10 }, (_, i) => `${i + 1}반`),
  '2학년': Array.from({ length: 9 }, (_, i) => `${i + 1}반`),
  '3학년': Array.from({ length: 11 }, (_, i) => `${i + 1}반`),
};

// Preset quantities: 10대, 15대, 20대, 25대, 30대
const QUICK_PRESETS = [10, 15, 20, 25, 30];

/* =========================================================================
   Subcomponents wrapped in React.memo to isolate DOM and GPU repaint triggers
   ========================================================================= */

// 1. Cart Selector Component
interface CartSelectorSectionProps {
  cartUsed: CartType;
  recommendedCart: CartType;
  cartA: CartCapacity;
  cartB: CartCapacity;
  onSelectCart: (cart: CartType) => void;
}

const CartSelectorSection = React.memo<CartSelectorSectionProps>(({
  cartUsed,
  recommendedCart,
  cartA,
  cartB,
  onSelectCart,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>대여 보관함</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">교차 대여 권장</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Cart 1 Option */}
        <label
          className={`relative flex flex-col p-3.5 rounded-2xl border-2 cursor-pointer transition-all select-none ${
            cartUsed === '보관함 1' || cartUsed === 'A보관함'
              ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-200'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 whitespace-nowrap shrink-0">
              <input
                type="radio"
                name="cartRadio"
                checked={cartUsed === '보관함 1' || cartUsed === 'A보관함'}
                onChange={() => onSelectCart('보관함 1')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <span>보관함 1</span>
            </span>
            {(recommendedCart === '보관함 1' || recommendedCart === 'A보관함') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5" />
                <span>추천</span>
              </span>
            )}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
            <span>잔여</span>
            <span
              className={
                cartA.available > 0
                  ? 'text-blue-700 font-extrabold text-sm'
                  : 'text-rose-600 font-extrabold text-sm'
              }
            >
              {cartA.available} / {cartA.total}대
            </span>
          </div>
        </label>

        {/* Cart 2 Option */}
        <label
          className={`relative flex flex-col p-3.5 rounded-2xl border-2 cursor-pointer transition-all select-none ${
            cartUsed === '보관함 2' || cartUsed === 'B보관함'
              ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-200'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 whitespace-nowrap shrink-0">
              <input
                type="radio"
                name="cartRadio"
                checked={cartUsed === '보관함 2' || cartUsed === 'B보관함'}
                onChange={() => onSelectCart('보관함 2')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
              />
              <span>보관함 2</span>
            </span>
            {(recommendedCart === '보관함 2' || recommendedCart === 'B보관함') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5" />
                <span>추천</span>
              </span>
            )}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
            <span>잔여</span>
            <span
              className={
                cartB.available > 0
                  ? 'text-emerald-700 font-extrabold text-sm'
                  : 'text-rose-600 font-extrabold text-sm'
              }
            >
              {cartB.available} / {cartB.total}대
            </span>
          </div>
        </label>
      </div>
    </div>
  );
});
CartSelectorSection.displayName = 'CartSelectorSection';

// 2. Quantity Selector Component
interface QuantitySelectorSectionProps {
  quantity: number;
  currentCartAvailable: number;
  onAdjustQuantity: (delta: number) => void;
  onSetQuantity: (val: number) => void;
}

const QuantitySelectorSection = React.memo<QuantitySelectorSectionProps>(({
  quantity,
  currentCartAvailable,
  onAdjustQuantity,
  onSetQuantity,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 select-none">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Tablet className="w-4 h-4 text-blue-600" />
          <span>대여 수량</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">
          최대 가능: <strong className="text-slate-900">{currentCartAvailable}대</strong>
        </span>
      </div>

      {/* Touch Stepper */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjustQuantity(-5)}
          className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
          title="5대 감소"
        >
          -5
        </button>
        <button
          type="button"
          onClick={() => onAdjustQuantity(-1)}
          className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
          title="1대 감소"
        >
          <Minus className="w-4 h-4 stroke-[3]" />
        </button>
        <div className="flex-1 relative">
          <input
            type="number"
            min="1"
            max="30"
            inputMode="numeric"
            autoComplete="off"
            value={quantity}
            onChange={(e) => onSetQuantity(Number(e.target.value))}
            className="w-full h-11 text-center text-xl sm:text-2xl font-black text-slate-900 rounded-xl bg-white border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-inner"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            대
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAdjustQuantity(1)}
          className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
          title="1대 증가"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
        <button
          type="button"
          onClick={() => onAdjustQuantity(5)}
          className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
          title="5대 증가"
        >
          +5
        </button>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSetQuantity(preset)}
            className={`h-9 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer flex items-center justify-center ${
              quantity === preset
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {preset}대
          </button>
        ))}
      </div>
    </div>
  );
});
QuantitySelectorSection.displayName = 'QuantitySelectorSection';

// 3. Period Selector Component
interface PeriodSelectorSectionProps {
  period: string;
  onSelectPeriod: (val: string) => void;
  showTimetableInfo: boolean;
  onToggleTimetableInfo: () => void;
}

const PeriodSelectorSection = React.memo<PeriodSelectorSectionProps>(({
  period,
  onSelectPeriod,
  showTimetableInfo,
  onToggleTimetableInfo,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>사용 교시</span>
        </label>
        <button
          type="button"
          onClick={onToggleTimetableInfo}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-blue-50"
        >
          <Info className="w-3.5 h-3.5" />
          <span>시간표 보기</span>
        </button>
      </div>

      {showTimetableInfo && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
          <div className="font-bold text-blue-950 flex items-center justify-between text-xs">
            <span>※ 교내 시종표 기준 (50분 운영)</span>
            <span className="text-blue-700">월·화 7교시 / 수·목·금 6교시</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-slate-700 font-mono text-[11px]">
            <span>1교시: 08:30~09:20</span>
            <span>2교시: 09:30~10:20</span>
            <span>3교시: 10:30~11:20</span>
            <span>4교시: 11:30~12:20</span>
            <span>5교시: 13:20~14:10</span>
            <span>6교시: 14:20~15:10</span>
            <span>7교시: 15:20~16:10</span>
          </div>
        </div>
      )}

      <select
        value={period}
        onChange={(e) => onSelectPeriod(e.target.value)}
        className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-xs ${
          !period ? 'border-slate-300 text-slate-400' : 'border-blue-500'
        }`}
      >
        <option value="">교시를 선택해 주세요</option>
        {TIMETABLE_PERIODS.map((opt) => (
          <option key={opt} value={opt} className="text-slate-800">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});
PeriodSelectorSection.displayName = 'PeriodSelectorSection';

// 4. Grade and Class Selector Component
interface GradeClassSectionProps {
  grade: string;
  classNum: string;
  availableClasses: string[];
  onGradeChange: (newGrade: string) => void;
  onClassNumChange: (newClassNum: string) => void;
}

const GradeClassSection = React.memo<GradeClassSectionProps>(({
  grade,
  classNum,
  availableClasses,
  onGradeChange,
  onClassNumChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>학년</span>
        </label>
        <select
          value={grade}
          onChange={(e) => onGradeChange(e.target.value)}
          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-xs ${
            !grade ? 'border-slate-300 text-slate-400' : 'border-blue-500'
          }`}
        >
          <option value="">학년 선택</option>
          <option value="1학년">1학년</option>
          <option value="2학년">2학년</option>
          <option value="3학년">3학년</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-blue-600" />
          <span>반</span>
        </label>
        <select
          value={classNum}
          disabled={!grade}
          onChange={(e) => onClassNumChange(e.target.value)}
          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-xs ${
            !classNum ? 'border-slate-300 text-slate-400' : 'border-blue-500'
          } ${!grade ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <option value="">{grade ? `${grade} 반 선택` : '학년 먼저'}</option>
          {availableClasses.map((c) => (
            <option key={c} value={c} className="text-slate-800">
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
GradeClassSection.displayName = 'GradeClassSection';

// 5. Teacher Selector Component
interface TeacherSectionProps {
  teacherName: string;
  uniqueTeachers: Teacher[];
  teachersCount: number;
  onSelectTeacher: (name: string) => void;
}

const TeacherSection = React.memo<TeacherSectionProps>(({
  teacherName,
  uniqueTeachers,
  teachersCount,
  onSelectTeacher,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-blue-600" />
        <span>담당 교사</span>
      </label>
      <select
        value={teacherName}
        onChange={(e) => onSelectTeacher(e.target.value)}
        className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-xs ${
          !teacherName ? 'border-slate-300 text-slate-400' : 'border-blue-500'
        }`}
      >
        <option value="">{teachersCount > 0 ? '교사 선택' : '미등록'}</option>
        {uniqueTeachers.map((t) => (
          <option key={t.id} value={t.name} className="text-slate-800">
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
});
TeacherSection.displayName = 'TeacherSection';

// 6. Student Representative Input Component (Isolated from whole modal to prevent Galaxy Tab black flicker)
interface StudentRepInputSectionProps {
  studentRep: string;
  classSpecificRep: StudentRepRecord | null;
  selectedGradeClass: string;
  filteredSuggestions: StudentRepRecord[];
  quickChips: StudentRepRecord[];
  onStudentRepChange: (val: string) => void;
  onClearStudentRep: () => void;
  onSelectChip: (name: string) => void;
}

const StudentRepInputSection = React.memo<StudentRepInputSectionProps>(({
  studentRep,
  classSpecificRep,
  selectedGradeClass,
  filteredSuggestions,
  quickChips,
  onStudentRepChange,
  onClearStudentRep,
  onSelectChip,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>학생 대표</span>
        </label>
        {classSpecificRep && (
          <span
            className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5 truncate max-w-[130px]"
            title={`${selectedGradeClass} 이전 대표: ${classSpecificRep.name}`}
          >
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{classSpecificRep.name}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="예: 상미고"
          value={studentRep}
          onChange={(e) => {
            onStudentRepChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-sm text-slate-900 shadow-xs outline-none font-bold"
        />
        {studentRep && (
          <button
            type="button"
            onClick={onClearStudentRep}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            title="이름 지우기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popup */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[60px] z-30 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 max-h-48 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-blue-500" />
              <span>이전 대여 학생 대표</span>
            </span>
            <span className="text-slate-400">터치 시 입력</span>
          </div>
          {filteredSuggestions.map((item, idx) => {
            const isMatchClass = selectedGradeClass && item.gradeClass === selectedGradeClass;
            return (
              <button
                key={`${item.name}-${item.gradeClass}-${idx}`}
                type="button"
                onMouseDown={() => {
                  onSelectChip(item.name);
                  setShowSuggestions(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between text-xs transition cursor-pointer active:bg-blue-100"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{item.name}</span>
                  {item.gradeClass && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-semibold">
                      {item.gradeClass}
                    </span>
                  )}
                </div>
                {isMatchClass && (
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>이 학급 직전 대표</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Quick-tap recommendation chips */}
      {quickChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 shrink-0">
            <History className="w-2.5 h-2.5 text-blue-500" />
            <span>추천:</span>
          </span>
          {quickChips.map((chip) => {
            const isMatchClass = selectedGradeClass && chip.gradeClass === selectedGradeClass;
            const isSelected = studentRep === chip.name;
            return (
              <button
                key={`${chip.name}-${chip.gradeClass}`}
                type="button"
                onClick={() => onSelectChip(chip.name)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : isMatchClass
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 ring-1 ring-blue-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                title={`${chip.gradeClass ? `${chip.gradeClass} ` : ''}대표 학생 (${chip.name})`}
              >
                {isMatchClass && <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                <span>{chip.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
StudentRepInputSection.displayName = 'StudentRepInputSection';

// 7. Approver Selector Component
interface ApproverSelectorSectionProps {
  approver: string;
  uniqueApprovers: Approver[];
  approversCount: number;
  onSelectApprover: (name: string) => void;
}

const ApproverSelectorSection = React.memo<ApproverSelectorSectionProps>(({
  approver,
  uniqueApprovers,
  approversCount,
  onSelectApprover,
}) => {
  return (
    <div className="space-y-2 pt-1 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>대여 승인자</span>
        </label>
      </div>

      {approversCount === 0 ? (
        <div className="text-xs text-slate-500 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
          등록된 대여 승인자가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {uniqueApprovers.map((appr) => {
            const isSelected = approver === appr.name;
            return (
              <label
                key={appr.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition select-none ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 font-black text-purple-950 shadow-xs ring-1 ring-purple-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="approverRadio"
                  checked={isSelected}
                  onChange={() => onSelectApprover(appr.name)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                />
                <span className="font-bold text-slate-900 text-xs truncate">
                  {appr.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
});
ApproverSelectorSection.displayName = 'ApproverSelectorSection';

/* =========================================================================
   Main RentalFormModal Component
   ========================================================================= */

export const RentalFormModal: React.FC<RentalFormModalProps> = ({
  isOpen,
  onClose,
  recommendedCart,
  cartA,
  cartB,
  teachers,
  approvers,
  onSubmit,
  isSubmitting,
  rentals = [],
}) => {
  const [cartUsed, setCartUsed] = useState<CartType>(recommendedCart);
  const [period, setPeriod] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [classNum, setClassNum] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [studentRep, setStudentRep] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(20);
  const [approver, setApprover] = useState<string>('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showTimetableInfo, setShowTimetableInfo] = useState<boolean>(false);

  // Track if studentRep was auto-filled so changing class can update it seamlessly
  const autoFilledRepRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCartUsed(recommendedCart);
      setPeriod('');
      setGrade('');
      setClassNum('');
      setTeacherName('');
      setStudentRep('');
      setQuantity(20);
      setApprover('');
      setMissingFields([]);
      setShowTimetableInfo(false);
      autoFilledRepRef.current = null;
    }
  }, [isOpen, recommendedCart]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  const uniqueTeachers = useMemo(() => {
    return Array.from(
      new Map(teachers.map((t) => [`${t.name?.trim()}__${t.subject?.trim()}`, t])).values()
    );
  }, [teachers]);

  const uniqueApprovers = useMemo(() => {
    return Array.from(
      new Map(approvers.map((a) => [a.name?.trim(), a])).values()
    );
  }, [approvers]);

  // Combined remembered student representatives from real-time Rentals + Local Storage
  const rememberedStudentReps = useMemo(() => {
    const list: StudentRepRecord[] = [];
    const seen = new Set<string>();

    // 1. From real-time rentals history (most recent first)
    if (rentals && rentals.length > 0) {
      const sortedRentals = [...rentals].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      for (const r of sortedRentals) {
        if (r.studentRep && r.studentRep.trim()) {
          const repName = r.studentRep.trim();
          const gClass = r.gradeClass ? r.gradeClass.trim() : '';
          const key = `${repName}__${gClass}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              name: repName,
              gradeClass: gClass,
              lastUsed: r.createdAt,
            });
          }
        }
      }
    }

    // 2. From local persistent cache
    const local = getLocalStudentReps();
    for (const r of local) {
      const key = `${r.name}__${r.gradeClass}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(r);
      }
    }

    return list;
  }, [rentals]);

  const selectedGradeClass = grade && classNum ? `${grade} ${classNum}` : '';

  // Class-specific previous student representative
  const classSpecificRep = useMemo(() => {
    if (!selectedGradeClass) return null;
    return (
      rememberedStudentReps.find(
        (r) => r.gradeClass.trim() === selectedGradeClass.trim()
      ) || null
    );
  }, [rememberedStudentReps, selectedGradeClass]);

  // Auto-fill student representative when Grade and Class are chosen
  useEffect(() => {
    if (selectedGradeClass && classSpecificRep) {
      if (!studentRep || studentRep === autoFilledRepRef.current) {
        setStudentRep(classSpecificRep.name);
        autoFilledRepRef.current = classSpecificRep.name;
      }
    }
  }, [selectedGradeClass, classSpecificRep]);

  // Quick Chips: unique recent names for 1-tap entry
  const quickChips = useMemo(() => {
    const result: StudentRepRecord[] = [];
    const namesSeen = new Set<string>();

    if (classSpecificRep) {
      namesSeen.add(classSpecificRep.name.toLowerCase());
      result.push(classSpecificRep);
    }

    for (const item of rememberedStudentReps) {
      if (!namesSeen.has(item.name.toLowerCase())) {
        namesSeen.add(item.name.toLowerCase());
        result.push(item);
        if (result.length >= 5) break;
      }
    }

    return result;
  }, [rememberedStudentReps, classSpecificRep]);

  // Filtered suggestions for autocomplete dropdown
  const filteredSuggestions = useMemo(() => {
    const query = studentRep.trim().toLowerCase();
    const result: StudentRepRecord[] = [];
    const namesSeen = new Set<string>();

    for (const item of rememberedStudentReps) {
      if (!query || item.name.toLowerCase().includes(query) || item.gradeClass.toLowerCase().includes(query)) {
        const key = `${item.name.toLowerCase()}__${item.gradeClass}`;
        if (!namesSeen.has(key)) {
          namesSeen.add(key);
          result.push(item);
        }
      }
      if (result.length >= 8) break;
    }

    return result;
  }, [rememberedStudentReps, studentRep]);

  const handleGradeChange = useCallback((newGrade: string) => {
    setGrade(newGrade);
    setClassNum('');
  }, []);

  const handleClassNumChange = useCallback((newClassNum: string) => {
    setClassNum(newClassNum);
  }, []);

  const handleSelectCart = useCallback((cart: CartType) => {
    setCartUsed(cart);
  }, []);

  const handleAdjustQuantity = useCallback((delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return Math.min(30, Math.max(1, next));
    });
  }, []);

  const handleSetQuantity = useCallback((val: number) => {
    setQuantity(Math.min(30, Math.max(1, val)));
  }, []);

  const handleSelectPeriod = useCallback((val: string) => {
    setPeriod(val);
  }, []);

  const handleToggleTimetableInfo = useCallback(() => {
    setShowTimetableInfo((prev) => !prev);
  }, []);

  const handleSelectTeacher = useCallback((name: string) => {
    setTeacherName(name);
  }, []);

  const handleStudentRepChange = useCallback((val: string) => {
    setStudentRep(val);
  }, []);

  const handleClearStudentRep = useCallback(() => {
    setStudentRep('');
    autoFilledRepRef.current = null;
  }, []);

  const handleSelectChip = useCallback((name: string) => {
    setStudentRep(name);
    autoFilledRepRef.current = name;
  }, []);

  const handleSelectApprover = useCallback((name: string) => {
    setApprover(name);
  }, []);

  if (!isOpen) return null;

  const currentCartAvailable =
    cartUsed === '보관함 1' || cartUsed === 'A보관함' ? cartA.available : cartB.available;

  const availableClasses = grade ? GRADE_CLASS_MAPPING[grade] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];

    if (!cartUsed) {
      missing.push('대여 보관함');
    }
    if (!period) {
      missing.push('사용 교시');
    }
    if (!grade) {
      missing.push('학년');
    }
    if (!classNum) {
      missing.push('반');
    }
    if (!teacherName) {
      missing.push('담당 교사');
    }
    if (!studentRep.trim()) {
      missing.push('학생 대표 이름');
    }
    if (!approver) {
      missing.push('대여 승인자');
    }
    if (quantity <= 0) {
      missing.push('대여 수량 (최소 1대 이상)');
    } else if (quantity > currentCartAvailable) {
      missing.push(
        `선택 보관함(${cartUsed}) 잔여 수량 초과 (현재 잔여: ${currentCartAvailable}대, 요청: ${quantity}대)`
      );
    }

    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }

    setMissingFields([]);
    const combinedGradeClass = `${grade} ${classNum}`;

    try {
      saveLocalStudentRep(studentRep.trim(), combinedGradeClass);
      await onSubmit({
        period,
        gradeClass: combinedGradeClass,
        teacherName,
        studentRep: studentRep.trim(),
        cartUsed,
        quantity,
        approver,
      });
      onClose();
    } catch (err: any) {
      setMissingFields([err.message || '대여 등록 중 오류가 발생했습니다.']);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 overflow-y-auto transform-gpu"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Tablet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">태블릿 스마트 대여 등록</h2>
              <p className="text-xs text-blue-100 font-medium mt-0.5">교실 수업용 스마트 태블릿 대여 및 반납 기록</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 flex-1 overflow-y-auto flex flex-col justify-between">
          {/* Missing Fields Error Alert Notice */}
          {missingFields.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1 shrink-0">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>다음 항목을 확인해 주세요:</span>
              </div>
              <ul className="text-xs text-rose-800 list-disc list-inside space-y-1 font-bold pl-1">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-rose-950 font-extrabold">{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1">
            {/* Left Column: Cart Selection & Quantity */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* 1. Storage Selection (Memoized) */}
              <CartSelectorSection
                cartUsed={cartUsed}
                recommendedCart={recommendedCart}
                cartA={cartA}
                cartB={cartB}
                onSelectCart={handleSelectCart}
              />

              {/* 2. Quantity Selector (Memoized) */}
              <QuantitySelectorSection
                quantity={quantity}
                currentCartAvailable={currentCartAvailable}
                onAdjustQuantity={handleAdjustQuantity}
                onSetQuantity={handleSetQuantity}
              />
            </div>

            {/* Right Column: Period, Grade/Class, Teacher, Student, Approver */}
            <div className="space-y-3.5 flex flex-col justify-between">
              {/* 3. Period Selection (Memoized) */}
              <PeriodSelectorSection
                period={period}
                onSelectPeriod={handleSelectPeriod}
                showTimetableInfo={showTimetableInfo}
                onToggleTimetableInfo={handleToggleTimetableInfo}
              />

              {/* 4. Grade and Class (Memoized) */}
              <GradeClassSection
                grade={grade}
                classNum={classNum}
                availableClasses={availableClasses}
                onGradeChange={handleGradeChange}
                onClassNumChange={handleClassNumChange}
              />

              {/* 5. Teacher & Student Representative */}
              <div className="grid grid-cols-2 gap-3">
                {/* Teacher Section (Memoized) */}
                <TeacherSection
                  teacherName={teacherName}
                  uniqueTeachers={uniqueTeachers}
                  teachersCount={teachers.length}
                  onSelectTeacher={handleSelectTeacher}
                />

                {/* Student Representative Input Section (Isolated & Memoized) */}
                <StudentRepInputSection
                  studentRep={studentRep}
                  classSpecificRep={classSpecificRep}
                  selectedGradeClass={selectedGradeClass}
                  filteredSuggestions={filteredSuggestions}
                  quickChips={quickChips}
                  onStudentRepChange={handleStudentRepChange}
                  onClearStudentRep={handleClearStudentRep}
                  onSelectChip={handleSelectChip}
                />
              </div>

              {/* 6. Approver Selection (Memoized) */}
              <ApproverSelectorSection
                approver={approver}
                uniqueApprovers={uniqueApprovers}
                approversCount={approvers.length}
                onSelectApprover={handleSelectApprover}
              />
            </div>
          </div>

          {/* Footer Submit Bar */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-11 sm:h-12 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>대여 기록 등록 중...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>태블릿 {quantity}대 대여 확정하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
