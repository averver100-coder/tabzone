import {
  AlertCircle,
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Tablet,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Approver, Rental } from '../types';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  rental: Rental | null;
  approvers: Approver[];
  onClose: () => void;
  onConfirm: (
    rental: Rental,
    returnData: { returnApprover: string; returnNotes: string }
  ) => Promise<void>;
  isSubmitting: boolean;
}

const PRESET_RETURN_NOTES = [
  '전량 정상 반납 (이상 없음)',
  '1대 미반납 (교실 확인 중)',
  '2대 미반납',
  'S펜 분실/미반납',
  '충전 케이블 분실',
  '기기 액정/파손 점검 필요',
];

export const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  rental,
  approvers,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [returnApprover, setReturnApprover] = useState<string>('');
  const [isCustomApprover, setIsCustomApprover] = useState<boolean>(false);
  const [customApproverName, setCustomApproverName] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // When modal opens with a rental, reset state
  useEffect(() => {
    if (isOpen && rental) {
      // Default to empty or rental approver, but user can easily pick
      setReturnApprover('');
      setIsCustomApprover(false);
      setCustomApproverName('');
      setReturnNotes('');
      setValidationError(null);
    }
  }, [isOpen, rental]);

  if (!isOpen || !rental) return null;

  const isCart1 = rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함';
  const cartLabel = isCart1 ? '보관함 1' : '보관함 2';

  // Handle preset note chip click
  const handleSelectPresetNote = (preset: string) => {
    if (!returnNotes.trim()) {
      setReturnNotes(preset);
    } else if (returnNotes.includes(preset)) {
      // remove if clicked again
      const updated = returnNotes
        .replace(preset, '')
        .replace(/^,\s*|,\s*$/g, '')
        .trim();
      setReturnNotes(updated);
    } else {
      setReturnNotes((prev) => `${prev.trim()}, ${preset}`);
    }
  };

  const handleQuickSameApprover = () => {
    setIsCustomApprover(false);
    setCustomApproverName('');
    setReturnApprover(rental.approver);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const finalApprover = isCustomApprover
      ? customApproverName.trim()
      : returnApprover.trim();

    if (!finalApprover) {
      setValidationError('반납 승인자를 선택하거나 직접 입력해 주세요. (대여승인자와 동일할 수도 있습니다)');
      return;
    }

    try {
      await onConfirm(rental, {
        returnApprover: finalApprover,
        returnNotes: returnNotes.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to confirm return:', err);
      setValidationError(err?.message || '반납 처리 중 오류가 발생했습니다.');
    }
  };

  // Deduplicate approvers list
  const uniqueApprovers = Array.from(
    new Map(approvers.map((a) => [`${a.name?.trim()}__${a.position?.trim()}`, a])).values()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-hidden">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header (Emerald / Green returning theme) */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <RotateCcw className="w-6 h-6 text-emerald-200 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>태블릿 반납 확인 및 입고 검수</span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                대여승인자와 반납승인자를 구분하여 기록하고 특이사항 메모를 저장합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl text-emerald-100 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            {/* 1. Target Rental Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  반납 대상 대여 내역
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isCart1
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {cartLabel} · 총 {rental.quantity}대
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-black text-slate-900">
                <span className="text-blue-900">{rental.teacherName} 선생님</span>
                <span className="text-slate-400">·</span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                  {rental.gradeClass}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                  {rental.period}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>수령학생: <strong>{rental.studentRep}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>대여 승인자: <strong className="text-purple-900">{rental.approver}</strong></span>
                </div>
              </div>
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* 2. 반납 승인자 (Return Approver) - Required */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>반납 승인자</span>
                  <span className="text-rose-600 font-black">*필수</span>
                </label>

                {/* Quick button to reuse rental approver */}
                <button
                  type="button"
                  onClick={handleQuickSameApprover}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition cursor-pointer self-start sm:self-auto"
                >
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>대여승인자와 동일 ({rental.approver})</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                대여승인자와 반납승인자는 다를 수 있습니다. 현재 반납을 확인하는 담당 교직원을 선택해 주세요.
              </p>

              {/* Approvers Selection Radio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uniqueApprovers.map((appr) => {
                  const labelText = appr.name;
                  const isSelected = !isCustomApprover && returnApprover === labelText;

                  return (
                    <label
                      key={appr.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 cursor-pointer transition select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 font-black text-emerald-950 shadow-xs ring-2 ring-emerald-200'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnApproverRadio"
                        checked={isSelected}
                        onChange={() => {
                          setIsCustomApprover(false);
                          setReturnApprover(labelText);
                          setValidationError(null);
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {appr.name}
                      </div>
                    </label>
                  );
                })}

                {/* Direct Custom Input Option */}
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition select-none ${
                    isCustomApprover
                      ? 'border-emerald-600 bg-emerald-50/80 font-black text-emerald-950 shadow-xs ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="returnApproverRadio"
                    checked={isCustomApprover}
                    onChange={() => {
                      setIsCustomApprover(true);
                      setValidationError(null);
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">기타 / 직접 입력</div>
                    <div className="text-[11px] text-slate-500 font-medium">목록 외 교직원 성명 입력</div>
                  </div>
                </label>
              </div>

              {/* Custom Approver Input Box if selected */}
              {isCustomApprover && (
                <div className="pt-1.5 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="반납 승인자 성명 및 소속 (예: 이정훈 선생님 / 교육정보부)"
                    value={customApproverName}
                    onChange={(e) => {
                      setCustomApproverName(e.target.value);
                      if (e.target.value.trim()) setValidationError(null);
                    }}
                    className="w-full h-12 px-4 rounded-2xl border border-emerald-400 bg-emerald-50/30 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-100 shadow-xs"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 3. 반납 비고란 (Return Notes & Remarks) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>반납 확인 비고 (특이사항 메모)</span>
                  <span className="text-slate-400 font-normal text-xs">(선택)</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                1대 미반납, 파손 점검 등 특수한 상황이 있을 경우 메모를 남겨주세요.
              </p>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {PRESET_RETURN_NOTES.map((preset) => {
                  const isIncluded = returnNotes.includes(preset);
                  const isWarning = preset.includes('미반납') || preset.includes('분실') || preset.includes('파손');

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPresetNote(preset)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl font-bold transition active:scale-95 cursor-pointer border ${
                        isIncluded
                          ? isWarning
                            ? 'bg-rose-100 text-rose-800 border-rose-300 font-black shadow-xs'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Textarea for Return Notes */}
              <div className="pt-1">
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="예: 1대 미반납 (2학년 3반 교실에 충전 중), 3번 태블릿 전원 불량 등 자유롭게 입력..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 shadow-xs resize-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer (Action Buttons: Height 56px for tablet touch) */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-13 sm:h-14 px-5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-100 transition active:scale-95 cursor-pointer"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-13 sm:h-14 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-300 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center gap-2.5 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>반납 처리 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>반납 확인 및 수량 복구</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
