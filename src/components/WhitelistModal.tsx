import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Edit3,
  FolderLock,
  GraduationCap,
  KeyRound,
  Loader2,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Tablet,
  Trash2,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
import { RentalUpdateInput } from '../services/rentalService';
import { compareTeachers } from '../services/teacherService';
import {
  Approver,
  AuthUser,
  CartType,
  formatCartName,
  Rental,
  RentalStatus,
  Teacher,
  WhitelistUser,
} from '../types';

export type MasterTabType = 'rentals' | 'whitelist' | 'teachers' | 'approvers';

interface WhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  rentals: Rental[];
  onUpdateRental: (originalRental: Rental, updates: RentalUpdateInput) => Promise<void>;
  onDeleteRental?: (rental: Rental) => Promise<void>;
  whitelistUsers: WhitelistUser[];
  onAddUser: (user: { email: string; name: string; department: string }) => Promise<void>;
  onRemoveUser: (email: string) => Promise<void>;
  teachers: Teacher[];
  onAddTeacher: (teacher: { name: string; subject: string }) => Promise<void>;
  onRemoveTeacher: (teacherId: string, name: string) => Promise<void>;
  approvers: Approver[];
  onAddApprover: (approver: { name: string; position: string }) => Promise<void>;
  onRemoveApprover: (approverId: string, name: string) => Promise<void>;
  initialTab?: MasterTabType;
}

const TIMETABLE_PERIODS = [
  '1교시',
  '2교시',
  '3교시',
  '4교시',
  '점심 시간',
  '5교시',
  '6교시',
  '7교시',
  '방과후',
];

const GRADE_CLASS_MAPPING: Record<string, string[]> = {
  '1학년': [...Array.from({ length: 10 }, (_, i) => `${i + 1}반`), '동아리'],
  '2학년': [...Array.from({ length: 9 }, (_, i) => `${i + 1}반`), '동아리'],
  '3학년': [...Array.from({ length: 11 }, (_, i) => `${i + 1}반`), '동아리'],
  '동아리': ['동아리'],
};

function toLocalDateTimeInputValue(isoString?: string | null): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalDateTimeInputValue(localValue: string): string {
  if (!localValue) return new Date().toISOString();
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export const WhitelistModal: React.FC<WhitelistModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  rentals,
  onUpdateRental,
  onDeleteRental,
  whitelistUsers,
  onAddUser,
  onRemoveUser,
  teachers,
  onAddTeacher,
  onRemoveTeacher,
  approvers,
  onAddApprover,
  onRemoveApprover,
  initialTab = 'rentals',
}) => {
  const [activeTab, setActiveTab] = useState<MasterTabType>(initialTab);

  // Whitelist Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('교육정보부');

  // Teacher Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('정보');

  // Approver Form State
  const [approverName, setApproverName] = useState('');
  const [approverPosition, setApproverPosition] = useState('교육정보부');

  // Rental Edit & Filter State
  const [rentalSearch, setRentalSearch] = useState('');
  const [rentalStatusFilter, setRentalStatusFilter] = useState<'ALL' | '대여 중' | '반납 완료'>('ALL');
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [confirmDeleteRentalId, setConfirmDeleteRentalId] = useState<string | null>(null);

  // Rental Edit Form Fields
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editGradeClass, setEditGradeClass] = useState('');
  const [editQuickGrade, setEditQuickGrade] = useState('');
  const [editQuickClass, setEditQuickClass] = useState('');
  const [editPeriod, setEditPeriod] = useState('');
  const [editStudentRep, setEditStudentRep] = useState('');
  const [editApprover, setEditApprover] = useState('');
  const [editCartUsed, setEditCartUsed] = useState<CartType>('보관함 1');
  const [editQuantity, setEditQuantity] = useState<number>(20);
  const [editStatus, setEditStatus] = useState<RentalStatus>('대여 중');
  const [editReturnApprover, setEditReturnApprover] = useState('');
  const [editReturnNotes, setEditReturnNotes] = useState('');
  const [editReturnedAtLocal, setEditReturnedAtLocal] = useState('');

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMsg(null);
      setConfirmDeleteRentalId(null);
    }
  }, [isOpen]);

  // Sorted teachers with "미등록 선생님" at the very end
  const sortedTeachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((t) => {
      const key = t.name.trim();
      if (key && !map.has(key)) {
        map.set(key, t);
      }
    });
    return Array.from(map.values()).sort(compareTeachers);
  }, [teachers]);

  // Filtered rentals for Master Management
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (rentalStatusFilter !== 'ALL' && r.status !== rentalStatusFilter) {
        return false;
      }
      if (rentalSearch.trim()) {
        const q = rentalSearch.trim().toLowerCase();
        const match =
          r.teacherName.toLowerCase().includes(q) ||
          r.gradeClass.toLowerCase().includes(q) ||
          r.period.toLowerCase().includes(q) ||
          r.studentRep.toLowerCase().includes(q) ||
          r.approver.toLowerCase().includes(q) ||
          formatCartName(r.cartUsed).toLowerCase().includes(q) ||
          (r.returnApprover && r.returnApprover.toLowerCase().includes(q)) ||
          (r.returnNotes && r.returnNotes.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [rentals, rentalStatusFilter, rentalSearch]);

  const activeRentalCount = useMemo(
    () => rentals.filter((r) => r.status === '대여 중').length,
    [rentals]
  );
  const returnedRentalCount = useMemo(
    () => rentals.filter((r) => r.status === '반납 완료').length,
    [rentals]
  );

  if (!isOpen) return null;

  const startEditingRental = (rental: Rental) => {
    setMsg(null);
    setConfirmDeleteRentalId(null);
    setEditingRentalId(rental.id);
    setEditTeacherName(rental.teacherName || '');
    setEditGradeClass(rental.gradeClass || '');

    // Parse grade & class if it matches "X학년 Y반"
    const match = (rental.gradeClass || '').match(/^(\d학년)\s+(\d+반)$/);
    if (match) {
      setEditQuickGrade(match[1]);
      setEditQuickClass(match[2]);
    } else {
      setEditQuickGrade('');
      setEditQuickClass('');
    }

    setEditPeriod(rental.period || '');
    setEditStudentRep(rental.studentRep || '');
    setEditApprover(rental.approver || '');
    setEditCartUsed(formatCartName(rental.cartUsed));
    setEditQuantity(Number(rental.quantity) || 20);
    setEditStatus(rental.status);
    setEditReturnApprover(rental.returnApprover || rental.approver || '');
    setEditReturnNotes(rental.returnNotes || '');
    setEditReturnedAtLocal(toLocalDateTimeInputValue(rental.returnedAt));
  };

  const cancelEditingRental = () => {
    setEditingRentalId(null);
    setConfirmDeleteRentalId(null);
  };

  const handleTogglePeriodChip = (p: string) => {
    const currentList = editPeriod
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = currentList.includes(p);
    let nextList: string[];
    if (exists) {
      nextList = currentList.filter((item) => item !== p);
    } else {
      nextList = [...currentList, p];
      // Sort known periods in timetable order while keeping custom strings at the end
      nextList.sort((a, b) => {
        const idxA = TIMETABLE_PERIODS.indexOf(a);
        const idxB = TIMETABLE_PERIODS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    setEditPeriod(nextList.join(', '));
  };

  const handleSaveRentalEdit = async (e: React.FormEvent, originalRental: Rental) => {
    e.preventDefault();
    setMsg(null);

    if (!editTeacherName.trim()) {
      setMsg({ type: 'error', text: '담당 선생님 성함을 입력해 주세요.' });
      return;
    }
    if (!editGradeClass.trim()) {
      setMsg({ type: 'error', text: '학년반 정보를 입력해 주세요.' });
      return;
    }
    if (!editPeriod.trim()) {
      setMsg({ type: 'error', text: '교시 정보를 입력해 주세요.' });
      return;
    }
    if (!editStudentRep.trim()) {
      setMsg({ type: 'error', text: '수령자(학생 대표) 이름을 입력해 주세요.' });
      return;
    }
    if (!editApprover.trim()) {
      setMsg({ type: 'error', text: '대여 승인자를 입력하거나 선택해 주세요.' });
      return;
    }
    if (editStatus === '반납 완료' && !editReturnApprover.trim()) {
      setMsg({ type: 'error', text: '반납 완료 상태일 때는 반납 승인자를 입력하거나 선택해 주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateRental(originalRental, {
        teacherName: editTeacherName.trim(),
        gradeClass: editGradeClass.trim(),
        period: editPeriod.trim(),
        studentRep: editStudentRep.trim(),
        approver: editApprover.trim(),
        cartUsed: editCartUsed,
        quantity: Math.min(30, Math.max(1, Number(editQuantity) || 1)),
        status: editStatus,
        returnedAt:
          editStatus === '반납 완료'
            ? fromLocalDateTimeInputValue(editReturnedAtLocal)
            : null,
        returnApprover: editStatus === '반납 완료' ? editReturnApprover.trim() : null,
        returnNotes: editStatus === '반납 완료' ? editReturnNotes.trim() || null : null,
      });

      setEditingRentalId(null);
      setMsg({
        type: 'success',
        text: `[${editTeacherName.trim()} / ${editGradeClass.trim()}] 대여·반납 내역이 성공적으로 수정되었습니다.`,
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || '대여·반납 정보 수정 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteRental = async (rental: Rental) => {
    if (!onDeleteRental) return;
    try {
      setDeletingId(rental.id);
      setMsg(null);
      await onDeleteRental(rental);
      setConfirmDeleteRentalId(null);
      if (editingRentalId === rental.id) {
        setEditingRentalId(null);
      }
      setMsg({
        type: 'success',
        text: `[${rental.teacherName} / ${rental.gradeClass}] 대여 기록이 삭제되었습니다.`,
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || '대여 기록 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Add Whitelist User
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const emailTrim = newEmail.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes('@')) {
      setMsg({ type: 'error', text: '올바른 구글 이메일 형식을 입력해 주세요.' });
      return;
    }
    if (!newName.trim()) {
      setMsg({ type: 'error', text: '교직원 이름을 입력해 주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddUser({
        email: emailTrim,
        name: newName.trim(),
        department: newDept.trim() || '교무실',
      });
      setNewEmail('');
      setNewName('');
      setMsg({ type: 'success', text: `교직원 [${newName.trim()}] 계정이 화이트리스트에 즉시 등록되었습니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '등록 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Remove Whitelist User
  const handleRemoveWhitelist = async (user: WhitelistUser) => {
    if (
      user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
      user.email.toLowerCase() === 'edutech@sangilmedia.hs.kr'
    ) {
      setMsg({ type: 'error', text: '기본 내장 시스템 최고관리자는 영구 보호 계정이므로 삭제할 수 없습니다.' });
      return;
    }

    try {
      setDeletingId(user.email);
      setMsg(null);
      await onRemoveUser(user.email);
      setMsg({ type: 'success', text: `화이트리스트 계정 [${user.name} / ${user.email}]이(가) 즉시 삭제되었습니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '삭제 중 오류가 발생했습니다.' });
    } finally {
      setDeletingId(null);
    }
  };

  // 3. Add Teacher
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!teacherName.trim()) {
      setMsg({ type: 'error', text: '선생님 성함을 입력해 주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTeacher({
        name: teacherName.trim(),
        subject: teacherSubject.trim() || '일반',
      });
      const addedName = teacherName.trim();
      setTeacherName('');
      setMsg({ type: 'success', text: `담당 교사 [${addedName}] 선생님이 등록되었습니다. 대여 폼에서 선택 가능합니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '교사 등록 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Remove Teacher
  const handleRemoveTeacher = async (t: Teacher) => {
    try {
      setDeletingId(t.id);
      setMsg(null);
      await onRemoveTeacher(t.id, t.name);
      setMsg({ type: 'success', text: `담당 교사 [${t.name}] 선생님이 삭제되었습니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '교사 삭제 중 오류가 발생했습니다.' });
    } finally {
      setDeletingId(null);
    }
  };

  // 5. Add Approver
  const handleAddApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!approverName.trim()) {
      setMsg({ type: 'error', text: '대여 승인자 성명과 직책을 입력해 주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddApprover({
        name: approverName.trim(),
        position: approverPosition.trim() || '교육정보부',
      });
      const added = approverName.trim();
      setApproverName('');
      setMsg({ type: 'success', text: `대여 승인자 [${added}]님이 등록되었습니다. 대여 신청 시 선택 가능합니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '승인자 등록 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Remove Approver
  const handleRemoveApprover = async (a: Approver) => {
    try {
      setDeletingId(a.id);
      setMsg(null);
      await onRemoveApprover(a.id, a.name);
      setMsg({ type: 'success', text: `대여 승인자 [${a.name}]님이 삭제되었습니다.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '승인자 삭제 중 오류가 발생했습니다.' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${day} ${h}:${min}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 overflow-hidden">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 sm:px-7 py-4.5 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">마스터 통합 관리</h3>
                {currentUser && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-purple-100 border border-white/20">
                    {currentUser.role === 'superadmin' ? '슈퍼관리자' : '관리자'} 권한
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-purple-200">
                대여·반납 내역 임의 수정 · 대여 승인자 · 담당 교사 · 화이트리스트 계정 관리
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('rentals');
              setMsg(null);
            }}
            className={`h-12 px-4 sm:px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'rentals'
                ? 'border-indigo-600 bg-white text-indigo-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <span>대여/반납 내역 수정 ({rentals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('approvers');
              setMsg(null);
            }}
            className={`h-12 px-4 sm:px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'approvers'
                ? 'border-blue-600 bg-white text-blue-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderLock className="w-4 h-4 text-blue-600" />
            <span>대여/반납 승인자 관리 ({approvers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('teachers');
              setMsg(null);
            }}
            className={`h-12 px-4 sm:px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'border-emerald-600 bg-white text-emerald-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>담당 교사 관리 ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('whitelist');
              setMsg(null);
            }}
            className={`h-12 px-4 sm:px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'whitelist'
                ? 'border-purple-600 bg-white text-purple-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>화이트리스트 교직원 ({whitelistUsers.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                msg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {msg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* TAB 0: RENTAL & RETURN RECORDS EDITING */}
          {activeTab === 'rentals' && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>태블릿 대여 및 반납 기록 관리자 수정</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-indigo-700 font-medium">
                    담당 선생님, 학년반, 교시, 수령자(학생 대표), 대여승인자, 보관함/수량 및 반납 상태(반납승인자·반납시각·비고)를 임의로 수정할 수 있습니다.
                  </p>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-200/80 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setRentalStatusFilter('ALL')}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      rentalStatusFilter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    전체 ({rentals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentalStatusFilter('대여 중')}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      rentalStatusFilter === '대여 중'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    대여 중 ({activeRentalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentalStatusFilter('반납 완료')}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      rentalStatusFilter === '반납 완료'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    반납 완료 ({returnedRentalCount})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rentalSearch}
                  onChange={(e) => setRentalSearch(e.target.value)}
                  placeholder="담당 선생님, 학년반, 교시, 수령자, 대여/반납 승인자, 비고 검색..."
                  className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {rentalSearch && (
                  <button
                    type="button"
                    onClick={() => setRentalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Rentals List */}
              <div className="space-y-3">
                {filteredRentals.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400">
                    <Tablet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs sm:text-sm font-bold text-slate-600">
                      조건에 해당하는 대여/반납 내역이 없습니다.
                    </p>
                  </div>
                ) : (
                  filteredRentals.map((rental) => {
                    const isEditing = editingRentalId === rental.id;
                    const isReturned = rental.status === '반납 완료';
                    const standardizedCart = formatCartName(rental.cartUsed);
                    const isCart1 = standardizedCart === '보관함 1';

                    return (
                      <div
                        key={rental.id}
                        className={`rounded-2xl border transition-all ${
                          isEditing
                            ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                            : isReturned
                            ? 'border-emerald-200/80 bg-emerald-50/15 hover:bg-emerald-50/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Summary Row */}
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black ${
                                  isReturned
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}
                              >
                                {isReturned ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-blue-600" />
                                )}
                                {rental.status}
                              </span>

                              {/* Cart & Quantity Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black ${
                                  isCart1
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {standardizedCart} · {rental.quantity}대
                              </span>

                              {/* Teacher & Grade/Class */}
                              <span className="text-sm font-black text-slate-900">
                                {rental.teacherName} 선생님
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-extrabold border border-slate-200">
                                {rental.gradeClass}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                                {rental.period}
                              </span>
                            </div>

                            {/* Sub details */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>
                                <strong className="text-slate-700">수령자:</strong> {rental.studentRep}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                <strong className="text-slate-700">대여승인:</strong> {rental.approver}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="font-mono text-[11px] text-slate-500">
                                대여일시: {formatDateTime(rental.createdAt)}
                              </span>

                              {isReturned && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-emerald-800 font-semibold">
                                    <strong>반납승인:</strong> {rental.returnApprover || rental.approver || '-'}
                                  </span>
                                  <span className="font-mono text-[11px] text-emerald-700">
                                    (반납일시: {formatDateTime(rental.returnedAt)})
                                  </span>
                                  {rental.returnNotes && (
                                    <span className="px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 text-[11px] font-bold">
                                      비고: {rental.returnNotes}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={cancelEditingRental}
                                className="h-9 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>수정 닫기</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditingRental(rental)}
                                className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>대여/반납 수정</span>
                              </button>
                            )}

                            {onDeleteRental && (
                              <>
                                {confirmDeleteRentalId === rental.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={deletingId === rental.id}
                                      onClick={() => handleConfirmDeleteRental(rental)}
                                      className="h-9 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      {deletingId === rental.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>삭제확인</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteRentalId(null)}
                                      className="h-9 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRentalId(rental.id)}
                                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                                    title="기록 삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expandable Edit Form */}
                        {isEditing && (
                          <form
                            onSubmit={(e) => handleSaveRentalEdit(e, rental)}
                            className="p-4 sm:p-5 border-t border-indigo-200 bg-white rounded-b-2xl space-y-5"
                          >
                            {/* Section 1: 대여 정보 수정 */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                                  <Tablet className="w-4 h-4 text-indigo-600" />
                                  1. 대여 기본 정보 수정 (임의 입력 및 목록 선택 모두 가능)
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ID: {rental.id}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* 1) 담당 선생님 */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700">
                                      담당 선생님 *
                                    </label>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setEditTeacherName(e.target.value);
                                        }
                                      }}
                                      className="h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-indigo-700 cursor-pointer"
                                    >
                                      <option value="">등록 교사에서 선택...</option>
                                      {sortedTeachers.map((t) => (
                                        <option key={t.id} value={t.name}>
                                          {t.name} ({t.subject})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    value={editTeacherName}
                                    onChange={(e) => setEditTeacherName(e.target.value)}
                                    placeholder="담당 선생님 성함 직접 입력"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* 2) 학년반 */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-1">
                                    <label className="text-xs font-black text-slate-700 shrink-0">
                                      학년반 *
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={editQuickGrade}
                                        onChange={(e) => {
                                          const g = e.target.value;
                                          setEditQuickGrade(g);
                                          if (g) {
                                            const defaultC = editQuickClass || '1반';
                                            setEditQuickClass(defaultC);
                                            setEditGradeClass(`${g} ${defaultC}`);
                                          }
                                        }}
                                        className="h-7 px-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-indigo-700 cursor-pointer"
                                      >
                                        <option value="">학년 선택</option>
                                        {Object.keys(GRADE_CLASS_MAPPING).map((g) => (
                                          <option key={g} value={g}>
                                            {g}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={editQuickClass}
                                        onChange={(e) => {
                                          const c = e.target.value;
                                          setEditQuickClass(c);
                                          if (editQuickGrade && c) {
                                            setEditGradeClass(`${editQuickGrade} ${c}`);
                                          }
                                        }}
                                        className="h-7 px-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-indigo-700 cursor-pointer"
                                      >
                                        <option value="">반 선택</option>
                                        {(GRADE_CLASS_MAPPING[editQuickGrade] || GRADE_CLASS_MAPPING['1학년']).map(
                                          (c) => (
                                            <option key={c} value={c}>
                                              {c}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    value={editGradeClass}
                                    onChange={(e) => setEditGradeClass(e.target.value)}
                                    placeholder="예: 2학년 3반, 동아리 등 직접 입력"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* 3) 수령자 (학생 대표) */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-black text-slate-700 leading-7">
                                    수령자 (학생 대표) *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={editStudentRep}
                                    onChange={(e) => setEditStudentRep(e.target.value)}
                                    placeholder="수령 학생 또는 수령자 이름 입력"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* 4) 대여 승인자 */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700">
                                      대여 승인자 *
                                    </label>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setEditApprover(e.target.value);
                                        }
                                      }}
                                      className="h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-indigo-700 cursor-pointer"
                                    >
                                      <option value="">등록 승인자에서 선택...</option>
                                      {approvers.map((a) => (
                                        <option key={a.id} value={a.name}>
                                          {a.name} ({a.position})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    value={editApprover}
                                    onChange={(e) => setEditApprover(e.target.value)}
                                    placeholder="대여 승인자 직접 입력"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                {/* 5) 보관함 선택 */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-black text-slate-700 leading-7">
                                    대여 보관함 *
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['보관함 1', '보관함 2'] as const).map((cart) => (
                                      <button
                                        key={cart}
                                        type="button"
                                        onClick={() => setEditCartUsed(cart)}
                                        className={`h-10 rounded-xl text-xs font-black border transition cursor-pointer ${
                                          editCartUsed === cart
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                      >
                                        {cart}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 6) 대여 수량 */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-black text-slate-700 leading-7">
                                    대여 수량 (1~30대) *
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    required
                                    value={editQuantity}
                                    onChange={(e) =>
                                      setEditQuantity(
                                        Math.min(30, Math.max(1, Number(e.target.value) || 1))
                                      )
                                    }
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>

                              {/* 7) 교시 (임의 입력 + 빠른 칩 토글) */}
                              <div className="space-y-2 pt-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <label className="text-xs font-black text-slate-700">
                                    사용 교시 * <span className="font-normal text-slate-500">(버튼 클릭으로 다중 선택하거나 직접 입력 가능)</span>
                                  </label>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {TIMETABLE_PERIODS.map((p) => {
                                    const selectedList = editPeriod
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean);
                                    const isSelected = selectedList.includes(p);
                                    return (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleTogglePeriodChip(p)}
                                        className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {p}
                                      </button>
                                    );
                                  })}
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={editPeriod}
                                  onChange={(e) => setEditPeriod(e.target.value)}
                                  placeholder="예: 1교시, 2교시 또는 방과후 등 임의 수정"
                                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            {/* Section 2: 반납 상태 및 반납 상세 정보 수정 */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                                  2. 반납 상태 및 반납 정보 수정
                                </span>

                                {/* Status Toggle */}
                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => setEditStatus('대여 중')}
                                    className={`h-8 px-3.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                                      editStatus === '대여 중'
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>대여 중 (미반납)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditStatus('반납 완료');
                                      if (!editReturnApprover.trim()) {
                                        setEditReturnApprover(editApprover || approvers[0]?.name || '');
                                      }
                                      if (!editReturnedAtLocal) {
                                        setEditReturnedAtLocal(toLocalDateTimeInputValue(new Date().toISOString()));
                                      }
                                    }}
                                    className={`h-8 px-3.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                                      editStatus === '반납 완료'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>반납 완료</span>
                                  </button>
                                </div>
                              </div>

                              {editStatus === '대여 중' ? (
                                <p className="text-xs text-slate-600 font-medium">
                                  현재 상태가 <strong className="text-blue-700">대여 중</strong>으로 설정되어 있습니다. (반납 완료였던 항목을 '대여 중'으로 변경하여 저장하면 반납 처리가 취소되고 대여 중 상태로 복원됩니다.)
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                  {/* 반납 승인자 */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-black text-emerald-900">
                                        반납 승인자 *
                                      </label>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            setEditReturnApprover(e.target.value);
                                          }
                                        }}
                                        className="h-6 px-1.5 rounded border border-emerald-200 bg-white text-[11px] font-bold text-emerald-700 cursor-pointer"
                                      >
                                        <option value="">승인자 선택...</option>
                                        {approvers.map((a) => (
                                          <option key={a.id} value={a.name}>
                                            {a.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      value={editReturnApprover}
                                      onChange={(e) => setEditReturnApprover(e.target.value)}
                                      placeholder="반납 승인자 성함 직접 입력"
                                      className="w-full h-10 px-3 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>

                                  {/* 반납 일시 */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-black text-emerald-900 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                        반납 일시
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditReturnedAtLocal(
                                            toLocalDateTimeInputValue(new Date().toISOString())
                                          )
                                        }
                                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                      >
                                        현재 시각으로 설정
                                      </button>
                                    </div>
                                    <input
                                      type="datetime-local"
                                      value={editReturnedAtLocal}
                                      onChange={(e) => setEditReturnedAtLocal(e.target.value)}
                                      className="w-full h-10 px-3 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>

                                  {/* 반납 확인 비고 */}
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-black text-emerald-900 leading-6">
                                      반납 확인 비고 (특이사항)
                                    </label>
                                    <input
                                      type="text"
                                      value={editReturnNotes}
                                      onChange={(e) => setEditReturnNotes(e.target.value)}
                                      placeholder="예: 1대 미반납, 이상 없음 등"
                                      className="w-full h-10 px-3 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Form Submit / Cancel Footer */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={cancelEditingRental}
                                className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                              >
                                취소
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                              >
                                {isSubmitting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                <span>수정 내용 저장하기</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 1: WHITELIST MANAGEMENT */}
          {activeTab === 'whitelist' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddWhitelist}
                className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-black text-purple-900">
                  <Plus className="w-4 h-4" />
                  <span>새 교직원 화이트리스트 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      구글 이메일 주소 *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="example@sangilmedia.hs.kr"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      성명 (이름) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 홍길동"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      소속 부서 / 교무실
                    </label>
                    <input
                      type="text"
                      placeholder="예: 교육정보부"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>화이트리스트 등록하기</span>
                  </button>
                </div>
              </form>

              {/* Whitelist Table */}
              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  승인된 화이트리스트 목록 ({whitelistUsers.length}명)
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {whitelistUsers.map((u) => {
                    const isProtected =
                      u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
                      u.email.toLowerCase() === 'edutech@sangilmedia.hs.kr';

                    return (
                      <div
                        key={u.email}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isProtected
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isProtected ? (
                              <ShieldCheck className="w-5 h-5 text-amber-600" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <span>{u.name}</span>
                              {isProtected && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                  시스템 영구 관리자
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {u.email} • {u.department || '교무실'}
                            </div>
                          </div>
                        </div>

                        {!isProtected && (
                          <button
                            type="button"
                            disabled={deletingId === u.email}
                            onClick={() => handleRemoveWhitelist(u)}
                            className="w-10 h-10 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition flex items-center justify-center cursor-pointer"
                            title="삭제"
                          >
                            {deletingId === u.email ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVERS MANAGEMENT */}
          {activeTab === 'approvers' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddApprover}
                className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-black text-blue-900">
                  <Plus className="w-4 h-4" />
                  <span>새 대여 승인자 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      성명 (이름) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 김민수"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      직책 / 부서 *
                    </label>
                    <input
                      type="text"
                      placeholder="예: 교육정보부 부장교사"
                      value={approverPosition}
                      onChange={(e) => setApproverPosition(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>대여 승인자 등록하기</span>
                  </button>
                </div>
              </form>

              {/* Approvers Table */}
              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  등록된 대여 승인자 목록 ({approvers.length}명)
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {approvers.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                          <FolderLock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.position}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === a.id}
                        onClick={() => handleRemoveApprover(a)}
                        className="w-10 h-10 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="삭제"
                      >
                        {deletingId === a.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHERS MANAGEMENT */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddTeacher}
                className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-black text-emerald-900">
                  <Plus className="w-4 h-4" />
                  <span>새 담당 교사 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      선생님 성함 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 이영희"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      담당 교과 / 과목 *
                    </label>
                    <input
                      type="text"
                      placeholder="예: 컴퓨터 / 정보"
                      value={teacherSubject}
                      onChange={(e) => setTeacherSubject(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>담당 교사 등록하기</span>
                  </button>
                </div>
              </form>

              {/* Teachers Table */}
              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  등록된 담당 교사 목록 ({sortedTeachers.length}명)
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {sortedTeachers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                          <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{t.name} 선생님</div>
                          <div className="text-xs text-slate-500">담당 교과: {t.subject}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => handleRemoveTeacher(t)}
                        className="w-10 h-10 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="삭제"
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};