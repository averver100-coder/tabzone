import {
  Calendar,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Mail,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { AuditLog } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  if (!isOpen) return null;

  const actions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        log.userEmail.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <History className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">시스템 감사 및 변경 이력 로그</h3>
              <p className="text-xs text-slate-300">
                수정자 고유 ID/이메일 · 수정일시 · 수행 작업 · 변경 내역 요약 (일반관리자 이상 열람)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Toolbar (Tablet Touch Enhanced) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3.5 shrink-0 text-xs sm:text-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="작업자 이메일, 요약 내용 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 select-none">
            <span className="text-slate-600 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <Filter className="w-4 h-4" />
              작업 필터:
            </span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 shadow-xs cursor-pointer"
            >
              <option value="ALL">전체 작업 ({auditLogs.length})</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs List Table */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">감사 로그 내역이 없습니다.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                          log.action.includes('대여')
                            ? 'bg-blue-100 text-blue-800'
                            : log.action.includes('반납')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action.includes('화이트리스트')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{log.summary}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <strong>작업자:</strong> {log.userEmail}
                    </span>
                    <span className="font-mono text-slate-400 truncate max-w-[200px]">
                      UID: {log.userId}
                    </span>
                    {log.details && (
                      <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                        {log.details}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
