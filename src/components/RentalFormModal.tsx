import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
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
import React, { useEffect, useMemo, useState } from 'react';
import { Approver, CartCapacity, CartType, Teacher } from '../types';

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

  if (!isOpen) return null;

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setClassNum('');
  };

  const currentCartAvailable =
    cartUsed === '보관함 1' || cartUsed === 'A보관함' ? cartA.available : cartB.available;
  const availableClasses = grade ? GRADE_CLASS_MAPPING[grade] || [] : [];

  const handleQuantityAdjust = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return Math.min(30, Math.max(1, next));
    });
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/50 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Compact) */}
        <div className="px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Tablet className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">태블릿 스마트 대여 등록</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Single Screen No Scroll Optimized) */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-2.5 flex-1 overflow-y-auto flex flex-col justify-between">
          {/* Missing Fields Error Alert Notice */}
          {missingFields.length > 0 && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-0.5 animate-in slide-in-from-top-2 shrink-0">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>다음 항목을 확인해 주세요:</span>
              </div>
              <ul className="text-[11px] text-rose-800 list-disc list-inside space-y-0.5 font-bold pl-1">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="leading-tight">
                    <span className="text-rose-950 font-extrabold">{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2-Column Grid (sm:grid-cols-2 for Tablet landscape/portrait) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 flex-1">
            {/* Left Column: Cart Selection & Quantity */}
            <div className="space-y-2.5 flex flex-col justify-between">
              {/* 1. Storage Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>대여 보관함</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    교차 대여 권장
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Cart 1 Option */}
                  <label
                    className={`relative flex flex-col p-2 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      cartUsed === '보관함 1' || cartUsed === 'A보관함'
                        ? 'border-blue-600 bg-blue-50/80 shadow-2xs ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <input
                          type="radio"
                          name="cartRadio"
                          checked={cartUsed === '보관함 1' || cartUsed === 'A보관함'}
                          onChange={() => setCartUsed('보관함 1')}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span>보관함 1</span>
                      </span>
                      {(recommendedCart === '보관함 1' || recommendedCart === 'A보관함') && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold shrink-0 whitespace-nowrap">
                          <Sparkles className="w-2 h-2" />
                          <span>추천</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
                      <span>잔여</span>
                      <span
                        className={
                          cartA.available > 0 ? 'text-blue-700 font-extrabold' : 'text-rose-600 font-extrabold'
                        }
                      >
                        {cartA.available} / {cartA.total}대
                      </span>
                    </div>
                  </label>

                  {/* Cart 2 Option */}
                  <label
                    className={`relative flex flex-col p-2 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      cartUsed === '보관함 2' || cartUsed === 'B보관함'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <input
                          type="radio"
                          name="cartRadio"
                          checked={cartUsed === '보관함 2' || cartUsed === 'B보관함'}
                          onChange={() => setCartUsed('보관함 2')}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span>보관함 2</span>
                      </span>
                      {(recommendedCart === '보관함 2' || recommendedCart === 'B보관함') && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold shrink-0 whitespace-nowrap">
                          <Sparkles className="w-2 h-2" />
                          <span>추천</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
                      <span>잔여</span>
                      <span
                        className={
                          cartB.available > 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-600 font-extrabold'
                        }
                      >
                        {cartB.available} / {cartB.total}대
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Quantity Selector (Compact) */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 select-none">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tablet className="w-3.5 h-3.5 text-blue-600" />
                    <span>대여 수량</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    최대 가능: <strong className="text-slate-900">{currentCartAvailable}대</strong>
                  </span>
                </div>

                {/* Touch Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(-5)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="5대 감소"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(-1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="1대 감소"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      inputMode="numeric"
                      autoComplete="off"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full h-8 text-center text-lg sm:text-xl font-black text-slate-900 rounded-lg bg-white border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-inner"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      대
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="1대 증가"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(5)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="5대 증가"
                  >
                    +5
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={`h-6.5 rounded-md text-[11px] font-bold transition active:scale-95 cursor-pointer flex items-center justify-center ${
                        quantity === preset
                          ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-300'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}대
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Period, Grade/Class, Teacher, Student, Approver */}
            <div className="space-y-2 flex flex-col justify-between">
              {/* 3. Period Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>사용 교시</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTimetableInfo(!showTimetableInfo)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer py-0.2 px-1 rounded hover:bg-blue-50"
                  >
                    <Info className="w-3 h-3" />
                    <span>시간표 보기</span>
                  </button>
                </div>

                {showTimetableInfo && (
                  <div className="p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-0.5 animate-in fade-in">
                    <div className="font-bold text-blue-950 flex items-center justify-between text-[10px]">
                      <span>※ 교내 시종표 기준 (50분 운영)</span>
                      <span className="text-blue-700">월·화 7교시 / 수·목·금 6교시</span>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 text-slate-700 font-mono text-[9px]">
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
                  onChange={(e) => setPeriod(e.target.value)}
                  className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs ${
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

              {/* 4. Grade and Class */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>학년</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs ${
                      !grade ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    }`}
                  >
                    <option value="">학년 선택</option>
                    <option value="1학년">1학년</option>
                    <option value="2학년">2학년</option>
                    <option value="3학년">3학년</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-600" />
                    <span>반</span>
                  </label>
                  <select
                    value={classNum}
                    disabled={!grade}
                    onChange={(e) => setClassNum(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs ${
                      !classNum ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    } ${!grade ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="">
                      {grade ? `${grade} 반 선택` : '학년 먼저'}
                    </option>
                    {availableClasses.map((c) => (
                      <option key={c} value={c} className="text-slate-800">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Teacher & Student Representative */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" />
                    <span>담당 교사</span>
                  </label>
                  <select
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs ${
                      !teacherName ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    }`}
                  >
                    <option value="">
                      {teachers.length > 0 ? '교사 선택' : '미등록'}
                    </option>
                    {uniqueTeachers.map((t) => (
                      <option key={t.id} value={`${t.name} (${t.subject})`} className="text-slate-800">
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>학생 대표</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 실장 김민우"
                    value={studentRep}
                    onChange={(e) => setStudentRep(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-xs text-slate-900 shadow-2xs outline-none font-bold"
                  />
                </div>
              </div>

              {/* 6. Approver Selection (이름 아래 부서명 삭제 & 콤팩트 라디오) */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>대여 승인자</span>
                  </label>
                </div>

                {approvers.length === 0 ? (
                  <div className="text-[11px] text-slate-500 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    등록된 대여 승인자가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {uniqueApprovers.map((appr) => {
                      const isSelected = approver === appr.name;

                      return (
                        <label
                          key={appr.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 font-black text-purple-950 shadow-2xs ring-1 ring-purple-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="approverRadio"
                            checked={isSelected}
                            onChange={() => setApprover(appr.name)}
                            className="w-3 h-3 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
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
            </div>
          </div>

          {/* Footer Submit Bar (스크롤 없이 즉시 확정) */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-9 sm:h-9.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>대여 기록 등록 중...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
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
