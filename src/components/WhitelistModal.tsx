import {
  AlertCircle,
  Building,
  CheckCircle,
  FolderLock,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
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
  initialTab?: 'whitelist' | 'teachers' | 'approvers';
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
  initialTab = 'whitelist',
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'teachers' | 'approvers'>(initialTab);

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
  const handleRemoveWhitelist = async (email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setMsg({
        type: 'error',
        text: '슈퍼어드민 계정(averver100@gmail.com)은 시스템 보안을 위해 영구 보존되며 삭제할 수 없습니다.',
      });
      return;
    }

    try {
      setDeletingId(email);
      setMsg(null);
      await onRemoveUser(email);
      setMsg({ type: 'success', text: `${email} 계정이 화이트리스트에서 정상 삭제되었습니다.` });
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
      setMsg({ type: 'error', text: '담당 교사 이름을 입력해 주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTeacher({
        name: teacherName.trim(),
        subject: teacherSubject.trim() || '교과',
      });
      const addedName = teacherName.trim();
      setTeacherName('');
      setMsg({ type: 'success', text: `담당 교사 [${addedName}] 선생님이 등록되었습니다. 프론트 화면 드롭다운에 즉시 반영됩니다.` });
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
                슈퍼어드민 전용 · 화이트리스트 계정 · 대여 승인자 · 담당 교사 마스터 관리
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

        {/* Tab Selection (Large Touch Tabs: Height 52px) */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5 shrink-0 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => { setActiveTab('whitelist'); setMsg(null); }}
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
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
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
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
            className={`h-12 px-5 rounded-t-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'teachers'
                ? 'border-emerald-600 bg-white text-emerald-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>담당 교사 관리 ({teachers.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {msg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* TAB 1: WHITELIST */}
          {activeTab === 'whitelist' && (
            <div className="space-y-4">
              {/* Whitelist Add Form */}
              <form
                onSubmit={handleAddWhitelist}
                className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    화이트리스트 교직원 계정 등록
                  </span>
                  <span className="text-[11px] text-purple-600 font-semibold">
                    등록 즉시 Google 로그인 허용
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600">구글 이메일</label>
                    <input
                      type="email"
                      placeholder="teacher@school.kr"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">성명</label>
                    <input
                      type="text"
                      placeholder="이교사"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">소속 부서</label>
                    <input
                      type="text"
                      placeholder="교육정보부 / 2학년부"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-500 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>등록 처리 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>화이트리스트 계정 추가하기</span>
                    </>
                  )}
                </button>
              </form>

              {/* Whitelist Users List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                  <span>등록된 교직원 계정 ({whitelistUsers.length}명)</span>
                  <span className="text-xs text-slate-400">averver100@gmail.com 영구 보존</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {whitelistUsers.map((user) => {
                    const isSuper = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                    return (
                      <div
                        key={user.email}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSuper
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isSuper ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900">{user.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                  isSuper
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isSuper ? '슈퍼어드민' : '일반관리자'}
                              </span>
                              <span className="text-xs text-slate-500">{user.department}</span>
                            </div>
                            <div className="text-xs font-mono text-slate-500 mt-0.5">{user.email}</div>
                          </div>
                        </div>

                        <div>
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              영구 보존
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={deletingId === user.email}
                              onClick={() => handleRemoveWhitelist(user.email)}
                              className="w-11 h-11 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
                              title="화이트리스트 권한 해제"
                              aria-label="삭제"
                            >
                              {deletingId === user.email ? (
                                <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVERS MANAGEMENT */}
          {activeTab === 'approvers' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-900 font-medium">
                승인자는 교육정보부 등 태블릿 관리를 책임지는 담당자입니다.
                대여 승인뿐만 아니라 <strong>반납 승인 시에도 동일한 승인자 목록</strong>에서 선택하거나 확인할 수 있습니다. (대여승인자와 반납승인자는 서로 다를 수 있습니다)
              </div>

              {/* Approver Add Form */}
              <form
                onSubmit={handleAddApprover}
                className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    신규 대여/반납 승인자 추가
                  </span>
                  <span className="text-xs text-blue-600 font-semibold">
                    대여 및 반납 승인자 목록에 즉시 연동
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600">성명 및 직책</label>
                    <input
                      type="text"
                      placeholder="예: 정스마트 부장교사"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">부서 / 역할</label>
                    <input
                      type="text"
                      placeholder="예: 교육정보부 스마트기기 담당"
                      value={approverPosition}
                      onChange={(e) => setApproverPosition(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 rounded-2xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>등록 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>대여 승인자 등록하기</span>
                    </>
                  )}
                </button>
              </form>

              {/* Approvers List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                  <span>
                    등록된 대여 승인자 목록 (
                    {Array.from(new Map(approvers.map((a) => [`${a.name?.trim()}__${a.position?.trim()}`, a])).values()).length}
                    명)
                  </span>
                  <span className="text-xs text-slate-400">대여 폼에서 필수로 선택됩니다</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {Array.from(
                    new Map(approvers.map((a) => [`${a.name?.trim()}__${a.position?.trim()}`, a])).values()
                  ).map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                          <FolderLock className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{appr.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{appr.position}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === appr.id}
                        onClick={() => handleRemoveApprover(appr)}
                        className="w-11 h-11 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
                        title="승인자 삭제"
                        aria-label="삭제"
                      >
                        {deletingId === appr.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
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
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-900 font-medium">
                여기서 등록된 교사만 대여 폼의 <strong>[담당 교사 드롭다운]</strong>에 노출됩니다.
                수업 책임자가 명확해지도록 신임 교사나 시간강사도 필요한 경우 등록해 주세요.
              </div>

              {/* Teacher Add Form */}
              <form
                onSubmit={handleAddTeacher}
                className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    신규 담당 교사 등록
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">
                    프론트 드롭다운 목록 즉시 추가
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600">교사 성명</label>
                    <input
                      type="text"
                      placeholder="예: 홍길동"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">담당 교과</label>
                    <input
                      type="text"
                      placeholder="예: 정보 / 수학 / 과학"
                      value={teacherSubject}
                      onChange={(e) => setTeacherSubject(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>교사 등록 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>담당 교사 등록하기</span>
                    </>
                  )}
                </button>
              </form>

              {/* Teachers List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                  <span>
                    등록된 담당 교사 목록 (
                    {Array.from(new Map(teachers.map((t) => [`${t.name?.trim()}__${t.subject?.trim()}`, t])).values()).length}
                    명)
                  </span>
                  <span className="text-xs text-slate-400">대여 폼 드롭다운 연동</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                  {Array.from(
                    new Map(teachers.map((t) => [`${t.name?.trim()}__${t.subject?.trim()}`, t])).values()
                  ).map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{t.name} 선생님</div>
                          <div className="text-xs text-slate-500 mt-0.5">담당 교과: {t.subject}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => handleRemoveTeacher(t)}
                        className="w-11 h-11 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
                        title="교사 삭제"
                        aria-label="삭제"
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
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
