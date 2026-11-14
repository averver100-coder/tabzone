import {
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Tablet,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { APP_VERSION } from '../lib/appVersion';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
import {
  backupData,
  deleteBackupSnapshot,
  exportBackupPayloadToExcel,
  fetchBackups,
  restoreFromBackup,
  subscribeToBackups,
} from '../services/backupService';
import {
  Approver,
  AuthUser,
  BackupRecord,
  Rental,
  TabletDevice,
  Teacher,
  WhitelistUser,
} from '../types';

interface BackupManagementTabProps {
  currentUser?: AuthUser | null;
  devices: TabletDevice[];
  rentals: Rental[];
  whitelistUsers: WhitelistUser[];
  teachers: Teacher[];
  approvers: Approver[];
  auditLogsCount: number;
  onStatusMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

function formatDateOnly(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTimeFull(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export const BackupManagementTab: React.FC<BackupManagementTabProps> = ({
  currentUser,
  devices,
  rentals,
  whitelistUsers,
  teachers,
  approvers,
  auditLogsCount,
  onStatusMessage,
}) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 2-Step Hard Confirmation Modal State
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const operator = useMemo(
    () => ({
      uid: currentUser?.uid || 'superadmin-sso',
      email: currentUser?.email || SUPER_ADMIN_EMAIL,
    }),
    [currentUser]
  );

  useEffect(() => {
    const unsub = subscribeToBackups((list) => {
      setBackups(list);
    });
    return () => unsub();
  }, []);

  // Strictly separate backups into two distinct lists by backupType
  const manualBackups = useMemo(
    () =>
      backups
        .filter((b) => b.backupType === 'manual')
        .sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() || 0) -
            (new Date(a.createdAt).getTime() || 0)
        ),
    [backups]
  );

  const autoBackups = useMemo(
    () =>
      backups
        .filter((b) => b.backupType === 'auto')
        .sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() || 0) -
            (new Date(a.createdAt).getTime() || 0)
        ),
    [backups]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const list = await fetchBackups();
      setBackups(list);
      onStatusMessage({
        type: 'success',
        text: `백업 목록을 서버에서 새로고침했습니다. (영구 ${
          list.filter((b) => b.backupType === 'manual').length
        }건 · 자동 ${list.filter((b) => b.backupType === 'auto').length}건)`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '백업 목록 새로고침 중 오류가 발생했습니다.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    if (isCreatingManual) return;
    setIsCreatingManual(true);
    try {
      const created = await backupData(
        operator,
        'manual',
        '자산 실사 확정 영구 스냅샷'
      );
      onStatusMessage({
        type: 'success',
        text: `자산 실사 확정 영구 스냅샷이 생성되었습니다. (${formatDateTimeFull(
          created.createdAt
        )})`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '영구 스냅샷 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleDownloadLiveExcel = () => {
    try {
      exportBackupPayloadToExcel(
        {
          devices,
          rentals,
          whitelist: whitelistUsers,
          teachers,
          approvers,
        },
        {
          version: APP_VERSION,
          auditLogsExcludedCount: auditLogsCount,
        }
      );
      onStatusMessage({
        type: 'success',
        text: '현재 전체 자산 데이터 엑셀(.xlsx) 백업 파일을 다운로드했습니다.',
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '엑셀 파일 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDownloadSnapshotExcel = (backup: BackupRecord) => {
    try {
      exportBackupPayloadToExcel(backup.data, {
        label:
          backup.backupType === 'manual'
            ? '수동 영구 스냅샷'
            : '자동 순환 백업',
        createdAt: backup.createdAt,
        version: backup.version,
      });
      onStatusMessage({
        type: 'success',
        text: `[${formatDateOnly(backup.createdAt)}] 백업 스냅샷 엑셀(.xlsx)을 저장했습니다.`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '스냅샷 엑셀 저장 중 오류가 발생했습니다.',
      });
    }
  };

  const handleOpenRestoreModal = (backup: BackupRecord) => {
    setRestoreTarget(backup);
    setRestoreConfirmInput('');
  };

  const handleCloseRestoreModal = () => {
    if (isRestoring) return;
    setRestoreTarget(null);
    setRestoreConfirmInput('');
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreTarget) return;
    if (restoreConfirmInput.trim() !== '복원합니다') return;

    setIsRestoring(true);
    try {
      const restored = await restoreFromBackup(operator, restoreTarget);
      onStatusMessage({
        type: 'success',
        text: `[${formatDateTimeFull(
          restoreTarget.createdAt
        )}] 시점으로 데이터 복원이 완료되었습니다. (기기 ${
          restored.devices?.length ?? 0
        }대, 대여 ${restored.rentals.length}건, 화이트리스트 ${
          restored.whitelist.length
        }명)`,
      });
      setRestoreTarget(null);
      setRestoreConfirmInput('');
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '백업 데이터 복원 중 오류가 발생했습니다.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupRecord) => {
    setDeletingBackupId(backup.id);
    try {
      await deleteBackupSnapshot(operator, backup);
      setConfirmDeleteId(null);
      onStatusMessage({
        type: 'success',
        text: `[${formatDateTimeFull(backup.createdAt)}] 백업 항목이 삭제되었습니다.`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '백업 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setDeletingBackupId(null);
    }
  };

  const renderBackupRow = (backup: BackupRecord, isManual: boolean) => {
    const counts = backup.counts || {
      devices: backup.data?.devices?.length || 0,
      rentals: backup.data?.rentals?.length || 0,
      whitelist: backup.data?.whitelist?.length || 0,
      teachers: backup.data?.teachers?.length || 0,
      approvers: backup.data?.approvers?.length || 0,
    };
    const deviceCount = counts.devices ?? backup.data?.devices?.length ?? 0;
    const staffTotal = (counts.teachers || 0) + (counts.approvers || 0);

    return (
      <div
        key={backup.id}
        className={`rounded-xl border px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition ${
          isManual
            ? 'bg-white border-amber-200/90 hover:border-amber-300 shadow-2xs'
            : 'bg-white border-slate-200 hover:border-indigo-200'
        }`}
      >
        {/* Left Metadata */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900">
              <Calendar
                className={`w-4 h-4 ${
                  isManual ? 'text-amber-500' : 'text-indigo-500'
                }`}
              />
              <span>{formatDateOnly(backup.createdAt)}</span>
            </span>

            {isManual ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-black">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                수동 영구 스냅샷
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
                <Clock className="w-3 h-3 text-emerald-600" />
                자동 순환 백업
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold">
              Firebase DB
            </span>

            {backup.note && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                {backup.note}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-slate-500 font-medium">
            <span className="font-mono text-slate-600">
              생성: {formatDateTimeFull(backup.createdAt)}
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-indigo-700">기기리스트 {deviceCount}대</span>
            <span className="text-slate-300">·</span>
            <span>대여 {counts.rentals}건</span>
            <span className="text-slate-300">·</span>
            <span>화이트리스트 {counts.whitelist}명</span>
            <span className="text-slate-300">·</span>
            <span>교사/승인자 {staffTotal}명</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">감사로그 제외</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-500">
              {backup.version || APP_VERSION}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => handleOpenRestoreModal(backup)}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>불러와 복원하기</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadSnapshotExcel(backup)}
            className="h-9 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀 저장</span>
          </button>

          {confirmDeleteId === backup.id ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={deletingBackupId === backup.id}
                onClick={() => handleDeleteBackup(backup)}
                className="h-9 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deletingBackupId === backup.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>삭제확인</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="h-9 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeleteId(backup.id)}
              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-200/70 flex items-center justify-center transition cursor-pointer"
              title="백업 스냅샷 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Dark Navy Hero Dashboard Banner (matching mockup UI) */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0A1638] via-[#0F1E49] to-[#081230] text-white p-5 sm:p-6 shadow-lg border border-indigo-900/50 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                  서버 자동 순환 백업 · 영구 스냅샷 보관함
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-100 font-mono text-[11px] font-bold">
                  {APP_VERSION}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[11px] font-bold">
                  <Clock className="w-3 h-3" />
                  변동 시 자동 순환 (1시간·최대 10개)
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                용량 및 비용 최적화를 위해 핵심 자산(기기리스트·대여·화이트리스트·교사·승인자)만 백업하며{' '}
                <strong className="text-amber-300 font-bold">
                  보안 감사 로그(auditLogs)는 백업에서 제외
                </strong>
                됩니다.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>목록 새로고침</span>
            </button>

            <button
              type="button"
              onClick={handleCreateManualSnapshot}
              disabled={isCreatingManual}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isCreatingManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookmarkCheck className="w-4 h-4" />
              )}
              <span>자산 실사 확정 스냅샷 생성</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadLiveExcel}
              className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>전체 백업 엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* Bottom 5 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Stat 1: Tablet Devices */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-300">
                기기리스트 (백업 대상)
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-sky-400">
                  {devices.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">대</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/25 flex items-center justify-center">
              <Tablet className="w-4 h-4 text-sky-300" />
            </div>
          </div>

          {/* Stat 2: Rentals */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-300">
                대여·반납 내역 (백업 대상)
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {rentals.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">건</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/25 flex items-center justify-center">
              <History className="w-4 h-4 text-indigo-300" />
            </div>
          </div>

          {/* Stat 3: Whitelist */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-300">
                화이트리스트 (백업 대상)
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {whitelistUsers.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">명</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/25 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* Stat 4: Teachers & Approvers */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-300">
                교사·승인자 (백업 대상)
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {teachers.length + approvers.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">명</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/25 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          {/* Stat 5: Excluded Audit Logs */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">
                보안 감사 로그 (백업 제외)
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-200">
                  {auditLogsCount}
                </span>
                <span className="text-xs text-slate-500 font-semibold">건</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-700/40 border border-slate-600/40 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP HIGHLIGHTED SECTION: 중요 영구 보관함 (manual ONLY) */}
      <section className="rounded-2xl bg-amber-50/70 border-2 border-amber-300/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-sm sm:text-base font-black text-slate-900">
                  중요 영구 보관함 ({manualBackups.length}건)
                </h5>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  자동 삭제 제외 · 영구 보존 (manual)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                관리자가 직접 확정 생성한 수동 영구 스냅샷입니다. 10개 초과 자동 순환 정리 대상에서 완전히 제외됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateManualSnapshot}
            disabled={isCreatingManual}
            className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 self-start sm:self-center disabled:opacity-50"
          >
            {isCreatingManual ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>+ 영구 스냅샷 추가 생성</span>
          </button>
        </div>

        {manualBackups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-white/80 py-8 px-4 text-center space-y-1.5">
            <BookmarkCheck className="w-7 h-7 text-amber-400 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-amber-950">
              보관 중인 수동 영구 스냅샷이 아직 없습니다.
            </p>
            <p className="text-[11px] sm:text-xs text-amber-800/80">
              상단 [자산 실사 확정 스냅샷 생성] 버튼을 클릭하면 자동 삭제되지 않는 영구 보관 스냅샷이 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {manualBackups.map((backup) => renderBackupRow(backup, true))}
          </div>
        )}
      </section>

      {/* 3. LOWER GENERAL SECTION: 자동 순환 백업 (auto ONLY) */}
      <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-sm sm:text-base font-black text-slate-900">
                  자동 순환 백업 ({autoBackups.length} / 10건)
                </h5>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                  <Clock className="w-3 h-3" />
                  1시간 디바운스 · 최신 10개 유지 (auto)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                자산 데이터(대여·반납·화이트리스트·교사·승인자) 추가/수정/삭제 직후 자동 생성되며, 11번째 이후 오래된 자동 백업만 순환 삭제됩니다.
              </p>
            </div>
          </div>
        </div>

        {autoBackups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 px-4 text-center space-y-1.5">
            <History className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              생성된 자동 순환 백업이 아직 없습니다.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400">
              대여·반납 처리나 교직원·교사·승인자 정보 변경 시 자동으로 백업이 누적됩니다. (1시간 내 중복 생성 방지)
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {autoBackups.map((backup) => renderBackupRow(backup, false))}
          </div>
        )}
      </section>

      {/* 4. 2-STEP HARD CONFIRMATION MODAL BEFORE RESTORE */}
      {restoreTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <form
            onSubmit={handleExecuteRestore}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Warning Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-black leading-tight">
                    백업 데이터 복원 최종 확인
                  </h4>
                  <p className="text-[11px] text-rose-100">
                    실수 방지를 위한 2단계 안전 확인 절차입니다
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRestoreModal}
                disabled={isRestoring}
                className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center cursor-pointer disabled:opacity-40"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-start gap-2 text-xs text-rose-900 font-bold leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    이 작업을 실행하면 현재 Firestore 서버와 앱의{' '}
                    <strong className="underline">
                      기기리스트, 대여/반납 내역, 화이트리스트, 담당 교사, 승인자 목록이 모두 아래 스냅샷 시점으로 덮어씌워집니다.
                    </strong>{' '}
                    (기본 시스템 슈퍼관리자 계정은 보호됩니다)
                  </span>
                </div>
              </div>

              {/* Target Snapshot Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">복원 대상 유형</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                      restoreTarget.backupType === 'manual'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {restoreTarget.backupType === 'manual'
                      ? '수동 영구 스냅샷 (manual)'
                      : '자동 순환 백업 (auto)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">스냅샷 일시</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDateTimeFull(restoreTarget.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500 shrink-0">포함 데이터</span>
                  <span className="font-bold text-slate-800 text-right">
                    기기 {restoreTarget.counts?.devices ?? restoreTarget.data?.devices?.length ?? 0}대 ·
                    대여 {restoreTarget.counts?.rentals ?? restoreTarget.data?.rentals?.length ?? 0}건 ·
                    교직원 {restoreTarget.counts?.whitelist ?? restoreTarget.data?.whitelist?.length ?? 0}명 ·
                    교사/승인 {(restoreTarget.counts?.teachers ?? 0) + (restoreTarget.counts?.approvers ?? 0)}명
                  </span>
                </div>
              </div>

              {/* Verification Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  복원을 진행하려면 아래 입력창에 정확히{' '}
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-black">
                    복원합니다
                  </span>{' '}
                  라고 입력해 주세요.
                </label>
                <input
                  type="text"
                  autoFocus
                  value={restoreConfirmInput}
                  onChange={(e) => setRestoreConfirmInput(e.target.value)}
                  placeholder="복원합니다"
                  disabled={isRestoring}
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-300 focus:border-rose-500 focus:outline-none text-sm font-black text-slate-900 bg-white"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseRestoreModal}
                  disabled={isRestoring}
                  className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    restoreConfirmInput.trim() !== '복원합니다' || isRestoring
                  }
                  className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRestoring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>복원 실행</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
