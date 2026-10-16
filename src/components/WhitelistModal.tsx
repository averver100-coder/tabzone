import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  FolderLock,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
import { DEFAULT_OPERATING_HOURS, OperatingHoursSchedule } from '../services/settingsService';
import { Approver, Teacher, WhitelistUser } from '../types';

interface WhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  whitelistUsers: WhitelistUser[];
  onAddUser: (user: { email: string; name: string; department: string }) => Promise<void>;
  onRemoveUser: (email: string) => Promise<void>;
  teachers: Teacher[];
  onAddTeacher: (teacher: { name: string; subject: string }) => Promise<void>;
  onRemoveTeacher: (teacherId: string, name: string) => Promise<void>;
  approvers: Approver[];
  onAddApprover: (approver: { name: string; position: string }) => Promise<void>;
  onRemoveApprover: (approverId: string, name: string) => Promise<void>;
  operatingHours?: OperatingHoursSchedule;
  onUpdateOperatingHours?: (hours: OperatingHoursSchedule) => Promise<void>;
  initialTab?: 'whitelist' | 'teachers' | 'approvers' | 'hours';
}

export const WhitelistModal: React.FC<WhitelistModalProps> = ({
  isOpen,
  onClose,
  whitelistUsers,
  onAddUser,
  onRemoveUser,
  teachers,
  onAddTeacher,
  onRemoveTeacher,
  approvers,
  onAddApprover,
  onRemoveApprover,
  operatingHours = DEFAULT_OPERATING_HOURS,
  onUpdateOperatingHours,
  initialTab = 'whitelist',
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'teachers' | 'approvers' | 'hours'>(initialTab);

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

  // Operating Hours State
  const [hoursForm, setHoursForm] = useState<OperatingHoursSchedule>(operatingHours);

  useEffect(() => {
    if (operatingHours) {
      setHoursForm(operatingHours);
    }
  }, [operatingHours]);

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

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
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user.email.toLowerCase() === 'edutech@sangilmedia.hs.kr') {
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

  // 7. Save Operating Hours Schedule
  const handleSaveOperatingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateOperatingHours) return;

    try {
      setIsSubmitting(true);
      setMsg(null);
      await onUpdateOperatingHours(hoursForm);
      setMsg({
        type: 'success',
        text: '요일별 마감 시간 및 스마트 플러그 전원 연동 설정이 저장되었습니다.',
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || '운영 시간 저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaultHours = () => {
    setHoursForm(DEFAULT_OPERATING_HOURS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 sm:px-7 py-4.5 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">교직원 & 관리자 통합 설정</h3>
              <p className="text-xs sm:text-sm text-purple-200">
                슈퍼어드민 전용 · 화이트리스트 계정 · 대여 승인자 · 담당 교사 · 운영 시간 관리
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
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5 shrink-0 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => { setActiveTab('whitelist'); setMsg(null); }}
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'whitelist'
                ? 'border-purple-600 bg-white text-purple-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>화이트리스트 교직원 ({whitelistUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('approvers'); setMsg(null); }}
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
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
            onClick={() => { setActiveTab('teachers'); setMsg(null); }}
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
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
            onClick={() => { setActiveTab('hours'); setMsg(null); }}
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'hours'
                ? 'border-amber-600 bg-white text-amber-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>운영시간 & 마감 설정</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
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

          {/* TAB 1: WHITELIST MANAGEMENT */}
          {activeTab === 'whitelist' && (
            <div className="space-y-6">
              <form onSubmit={handleAddWhitelist} className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-purple-900">
                  <Plus className="w-4 h-4" />
                  <span>새 교직원 화이트리스트 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">구글 이메일 주소 *</label>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1">성명 (이름) *</label>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1">소속 부서 / 교무실</label>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
                      <div key={u.email} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isProtected ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                            {isProtected ? <ShieldCheck className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5" />}
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
                            <div className="text-xs text-slate-500">{u.email} • {u.department || '교무실'}</div>
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
                            {deletingId === u.email ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
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
              <form onSubmit={handleAddApprover} className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-blue-900">
                  <Plus className="w-4 h-4" />
                  <span>새 대여 승인자 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">성명 (이름) *</label>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1">직책 / 부서 *</label>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
                    <div key={a.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
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
                        {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
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
              <form onSubmit={handleAddTeacher} className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-900">
                  <Plus className="w-4 h-4" />
                  <span>새 담당 교사 등록</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">선생님 성함 *</label>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1">담당 교과 / 과목 *</label>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>담당 교사 등록하기</span>
                  </button>
                </div>
              </form>

              {/* Teachers Table */}
              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  등록된 담당 교사 목록 ({teachers.length}명)
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {teachers.map((t) => (
                    <div key={t.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
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
                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OPERATING HOURS & CLOSING TIME SETTINGS */}
          {activeTab === 'hours' && (
            <form onSubmit={handleSaveOperatingHours} className="space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-amber-900">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>요일별 마감 시간 및 스마트 플러그 전원 연동</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaultHours}
                    className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>기본값(월화 16:30 / 수목금 16:00) 복원</span>
                  </button>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  스마트 플러그 및 교내 일과 시간에 맞추어 요일별 마감 시간을 지정할 수 있습니다. <br />
                  마감 시간이 경과하거나 스마트 플러그 전원이 꺼지면 **Screen Wake Lock이 자동으로 해제되어 안드로이드 설정(30분)에 따라 태블릿 화면이 자동으로 꺼집니다.**
                </p>
              </div>

              {/* Day-of-week Closing Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Mon */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      월요일 마감 시간
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      스마트플러그 16:30
                    </span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.mon}
                    onChange={(e) => setHoursForm({ ...hoursForm, mon: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {['16:00', '16:30', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoursForm({ ...hoursForm, mon: preset })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${hoursForm.mon === preset ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tue */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      화요일 마감 시간
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      스마트플러그 16:30
                    </span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.tue}
                    onChange={(e) => setHoursForm({ ...hoursForm, tue: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {['16:00', '16:30', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoursForm({ ...hoursForm, tue: preset })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${hoursForm.tue === preset ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wed */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      수요일 마감 시간
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      스마트플러그 16:00
                    </span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.wed}
                    onChange={(e) => setHoursForm({ ...hoursForm, wed: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {['16:00', '16:30', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoursForm({ ...hoursForm, wed: preset })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${hoursForm.wed === preset ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thu */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      목요일 마감 시간
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      스마트플러그 16:00
                    </span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.thu}
                    onChange={(e) => setHoursForm({ ...hoursForm, thu: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {['16:00', '16:30', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoursForm({ ...hoursForm, thu: preset })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${hoursForm.thu === preset ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fri */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      금요일 마감 시간
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      스마트플러그 16:00
                    </span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.fri}
                    onChange={(e) => setHoursForm({ ...hoursForm, fri: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {['16:00', '16:30', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoursForm({ ...hoursForm, fri: preset })}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${hoursForm.fri === preset ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sat / Sun */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">주말 (토/일) 마감 시간</span>
                  </div>
                  <input
                    type="time"
                    value={hoursForm.sat}
                    onChange={(e) => setHoursForm({ ...hoursForm, sat: e.target.value, sun: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  />
                  <div className="text-[11px] text-slate-500">주말 기본 마감시간 (동일 적용)</div>
                </div>
              </div>

              {/* Auto Release WakeLock Toggle Option */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>마감 시간 경과 및 전원 차단 시 화면 자동 꺼짐 수용</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      권장 (스마트 플러그 연동)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    마감 시간이 지나거나 충전기 전원이 꺼지면 Screen Wake Lock을 해제하여 안드로이드 설정(30분)에 따라 태블릿 화면이 자동으로 꺼지도록 합니다.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hoursForm.autoReleaseWakeLockOnClosing}
                    onChange={(e) =>
                      setHoursForm({ ...hoursForm, autoReleaseWakeLockOnClosing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-7 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>요일별 마감 시간 저장하기</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
