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
import React, { useEffect, useState } from 'react';
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
  '1교시 (08:30 ~ 09:20)',
  '2교시 (09:30 ~ 10:20)',
  '3교시 (10:30 ~ 11:20)',
  '4교시 (11:30 ~ 12:20)',
  '점심 시간 (12:20 ~ 13:20)',
  '5교시 (13:20 ~ 14:10)',
  '6교시 (14:20 ~ 15:10)',
  '7교시 (15:20 ~ 16:10)',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-7 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
              <Tablet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">태블릿 스마트 대여 등록</h2>
              <p className="text-xs text-blue-100">Galaxy Tab S6 Lite 터치 최적화 키오스크</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-12 h-12 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {/* Missing Fields Error Alert Notice */}
          {missingFields.length > 0 && (
            <div className="p-4 sm:p-4.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>대여 확정을 위해 다음 미선택 / 미기입 항목을 완료해 주세요</span>
              </div>
              <ul className="text-xs sm:text-sm text-rose-800 list-disc list-inside space-y-1 font-bold pl-1">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="text-rose-950 font-extrabold">{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Galaxy Tab S6 Lite 5:3 Landscape Widescreen 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Left Column: Cart Selection & Quantity */}
            <div className="space-y-4">
              {/* 1. Storage Selection (Auto Recommendation) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>대여 보관함 선택</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    교차 대여 권장
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Cart 1 Option */}
                  <label
                    className={`relative flex flex-col p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                      cartUsed === '보관함 1' || cartUsed === 'A보관함'
                        ? 'border-blue-600 bg-blue-50/80 shadow-sm ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 whitespace-nowrap shrink-0">
                        <input
                          type="radio"
                          name="cartRadio"
                          checked={cartUsed === '보관함 1' || cartUsed === 'A보관함'}
                          onChange={() => setCartUsed('보관함 1')}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span>보관함 1</span>
                      </span>
                      {(recommendedCart === '보관함 1' || recommendedCart === 'A보관함') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black shrink-0 whitespace-nowrap">
                          <Sparkles className="w-3 h-3" />
                          <span>추천</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
                      <span>잔여 수량</span>
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
                    className={`relative flex flex-col p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                      cartUsed === '보관함 2' || cartUsed === 'B보관함'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 whitespace-nowrap shrink-0">
                        <input
                          type="radio"
                          name="cartRadio"
                          checked={cartUsed === '보관함 2' || cartUsed === 'B보관함'}
                          onChange={() => setCartUsed('보관함 2')}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span>보관함 2</span>
                      </span>
                      {(recommendedCart === '보관함 2' || recommendedCart === 'B보관함') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black shrink-0 whitespace-nowrap">
                          <Sparkles className="w-3 h-3" />
                          <span>추천</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-600 flex justify-between items-center whitespace-nowrap">
                      <span>잔여 수량</span>
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

              {/* 2. Quantity Selector (Presets 10, 15, 20, 25, 30) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 select-none">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Tablet className="w-4 h-4 text-blue-600" />
                    <span>대여 수량 선택</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    선택 보관함 최대 잔여: <strong className="text-slate-900">{currentCartAvailable}대</strong>
                  </span>
                </div>

                {/* Touch Stepper (Height 56px / 14) */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(-5)}
                    className="w-13 sm:w-14 h-13 sm:h-14 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="5대 감소"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(-1)}
                    className="w-13 sm:w-14 h-13 sm:h-14 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-base flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="1대 감소"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full h-13 sm:h-14 text-center text-3xl font-black text-slate-900 rounded-2xl bg-white border-2 border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-inner"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      대
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(1)}
                    className="w-13 sm:w-14 h-13 sm:h-14 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-base flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="1대 증가"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(5)}
                    className="w-13 sm:w-14 h-13 sm:h-14 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="5대 증가"
                  >
                    +5
                  </button>
                </div>

                {/* Quick Presets: 10대, 15대, 20대, 25대, 30대 (Large Touch Pills) */}
                <div className="pt-1">
                  <div className="text-xs font-bold text-slate-500 mb-2">빠른 수량 선택:</div>
                  <div className="grid grid-cols-5 gap-2">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuantity(preset)}
                        className={`h-11 rounded-xl text-sm font-black transition active:scale-95 cursor-pointer flex items-center justify-center ${
                          quantity === preset
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-300'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset}대
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Period, Grade/Class, Teacher, Student, Approver */}
            <div className="space-y-4">
              {/* 3. Period Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>사용 교시 (시종표 기준)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTimetableInfo(!showTimetableInfo)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>시간표 보기</span>
                  </button>
                </div>

                {showTimetableInfo && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1 animate-in fade-in">
                    <div className="font-bold text-blue-950 flex items-center justify-between">
                      <span>※ 교내 시종표 운영 기준 (매시간 50분 운영)</span>
                      <span className="text-[11px] text-blue-700">월·화 7교시 / 수·목·금 6교시</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-slate-700 font-mono text-[11px]">
                      <span>1교시: 08:30~09:20</span>
                      <span>2교시: 09:30~10:20</span>
                      <span>3교시: 10:30~11:20</span>
                      <span>4교시: 11:30~12:20</span>
                      <span>점심: 12:20~13:20</span>
                      <span>5교시: 13:20~14:10</span>
                      <span>6교시: 14:20~15:10</span>
                      <span>7교시: 15:20~16:10</span>
                    </div>
                  </div>
                )}

                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className={`w-full h-13 px-4 rounded-2xl border bg-white text-sm sm:text-base font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 cursor-pointer shadow-xs ${
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

              {/* 4. Grade and Class - SPLIT DROPDOWNS (1, 2, 3학년 ONLY) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Grade Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>학년 선택</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className={`w-full h-13 px-4 rounded-2xl border bg-white text-sm sm:text-base font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 cursor-pointer shadow-xs ${
                      !grade ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    }`}
                  >
                    <option value="">학년 선택</option>
                    <option value="1학년">1학년</option>
                    <option value="2학년">2학년</option>
                    <option value="3학년">3학년</option>
                  </select>
                </div>

                {/* Class Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>반 선택</span>
                  </label>
                  <select
                    value={classNum}
                    disabled={!grade}
                    onChange={(e) => setClassNum(e.target.value)}
                    className={`w-full h-13 px-4 rounded-2xl border bg-white text-sm sm:text-base font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 shadow-xs ${
                      !classNum ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    } ${!grade ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="">
                      {grade ? `${grade} 반 선택` : '먼저 학년 선택'}
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
              <div className="grid grid-cols-2 gap-3">
                {/* Teacher Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>담당 교사</span>
                  </label>
                  <select
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={`w-full h-13 px-3.5 rounded-2xl border bg-white text-sm sm:text-base font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 cursor-pointer shadow-xs ${
                      !teacherName ? 'border-slate-300 text-slate-400' : 'border-blue-500'
                    }`}
                  >
                    <option value="">
                      {teachers.length > 0 ? '담당 교사 선택' : '교사 미등록'}
                    </option>
                    {Array.from(
                      new Map(teachers.map((t) => [`${t.name?.trim()}__${t.subject?.trim()}`, t])).values()
                    ).map((t) => (
                      <option key={t.id} value={`${t.name} (${t.subject})`} className="text-slate-800">
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Representative */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>학생 대표</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 3반 실장 김민우"
                    value={studentRep}
                    onChange={(e) => setStudentRep(e.target.value)}
                    className={`w-full h-13 px-4 rounded-2xl border bg-white text-sm sm:text-base text-slate-900 focus:ring-4 focus:ring-blue-100 shadow-xs ${
                      !studentRep.trim() ? 'border-slate-300' : 'border-blue-500 font-bold'
                    }`}
                  />
                </div>
              </div>

              {/* 6. Approver Selection */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>대여 승인자 (교육정보부)</span>
                  </label>
                </div>

                {approvers.length === 0 ? (
                  <div className="text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    등록된 대여 승인자가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {Array.from(
                      new Map(approvers.map((a) => [`${a.name?.trim()}__${a.position?.trim()}`, a])).values()
                    ).map((appr) => {
                      const labelText = `${appr.name} (${appr.position})`;
                      const isSelected = approver === labelText;

                      return (
                        <label
                          key={appr.id}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/80 font-black text-purple-950 shadow-xs ring-2 ring-purple-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="approverRadio"
                            checked={isSelected}
                            onChange={() => setApprover(labelText)}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{appr.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{appr.position}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit (Height 56px / 14 buttons) */}
          <div className="pt-4 flex items-center justify-end gap-3.5 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-14 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-base transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-black text-base sm:text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
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
