import {
  AlertCircle,
  ArrowUpDown,
  BarChart2,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Layers,
  PieChart,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tablet,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import { Approver, AuthUser, Rental, Teacher } from '../types';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentals: Rental[];
  teachers: Teacher[];
  approvers: Approver[];
  currentUser: AuthUser | null;
}

type TabType = 'weekday-period' | 'trends' | 'teacher-grade' | 'approvers' | 'raw-data';
type MetricView = 'count' | 'quantity';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const SCHOOL_DAYS_ORDER = ['월', '화', '수', '목', '금', '토', '일'];

const PERIOD_ORDER = [
  '1교시',
  '2교시',
  '3교시',
  '4교시',
  '점심 시간',
  '5교시',
  '6교시',
  '7교시',
  '방과후/기타',
];

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({
  isOpen,
  onClose,
  rentals,
  teachers,
  approvers,
  currentUser,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('weekday-period');
  const [metricView, setMetricView] = useState<MetricView>('count');

  // Filter States
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedCart, setSelectedCart] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Table pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);

  if (!isOpen) return null;

  // Security Gate
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">접근 권한 제한</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            대여 분석 현황 및 엑셀 추출 기능은 <strong>슈퍼어드민(최고 관리자)</strong> 전용 보안 페이지입니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // 1. Date filter range computation
  const { filterStart, filterEnd } = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (datePreset === '7days') {
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === '30days') {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (datePreset === 'custom') {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    return { filterStart: start, filterEnd: end };
  }, [datePreset, startDate, endDate]);

  // 2. Filter Rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      // Date filter
      if (r.createdAt) {
        const itemDate = new Date(r.createdAt);
        if (filterStart && itemDate < filterStart) return false;
        if (filterEnd && itemDate > filterEnd) return false;
      }

      // Teacher filter
      if (selectedTeacher !== 'all' && r.teacherName !== selectedTeacher) {
        return false;
      }

      // Grade filter
      if (selectedGrade !== 'all') {
        if (!r.gradeClass || !r.gradeClass.startsWith(selectedGrade)) {
          return false;
        }
      }

      // Cart filter
      if (selectedCart !== 'all') {
        const standardCart = (r.cartUsed === '보관함 1' || r.cartUsed === 'A보관함') ? '보관함 1' : '보관함 2';
        if (standardCart !== selectedCart) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const tName = (r.teacherName || '').toLowerCase();
        const gClass = (r.gradeClass || '').toLowerCase();
        const sRep = (r.studentRep || '').toLowerCase();
        const period = (r.period || '').toLowerCase();
        const notes = (r.returnNotes || '').toLowerCase();
        const appr = (r.approver || '').toLowerCase();

        const match =
          tName.includes(q) ||
          gClass.includes(q) ||
          sRep.includes(q) ||
          period.includes(q) ||
          notes.includes(q) ||
          appr.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    rentals,
    filterStart,
    filterEnd,
    selectedTeacher,
    selectedGrade,
    selectedCart,
    selectedStatus,
    searchKeyword,
  ]);

  // 3. Summary Statistics
  const summary = useMemo(() => {
    const totalCount = filteredRentals.length;
    const totalQuantity = filteredRentals.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const activeCount = filteredRentals.filter((r) => r.status === '대여 중').length;
    const returnedCount = filteredRentals.filter((r) => r.status === '반납 완료').length;

    // Cart Breakdown
    const cart1Count = filteredRentals.filter((r) => r.cartUsed === '보관함 1' || r.cartUsed === 'A보관함').length;
    const cart2Count = filteredRentals.filter((r) => r.cartUsed === '보관함 2' || r.cartUsed === 'B보관함').length;

    return {
      totalCount,
      totalQuantity,
      activeCount,
      returnedCount,
      cart1Count,
      cart2Count,
    };
  }, [filteredRentals]);

  // 4. Analytics: Day of the Week
  const weekdayData = useMemo(() => {
    const map = new Map<string, { day: string; count: number; quantity: number }>();
    SCHOOL_DAYS_ORDER.forEach((day) => {
      map.set(day, { day: `${day}요일`, count: 0, quantity: 0 });
    });

    filteredRentals.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const dayName = DAY_NAMES[d.getDay()];
      const entry = map.get(dayName);
      if (entry) {
        entry.count += 1;
        entry.quantity += r.quantity || 0;
      }
    });

    return Array.from(map.values());
  }, [filteredRentals]);

  // 5. Analytics: Period (교시별)
  const periodData = useMemo(() => {
    const map = new Map<string, { period: string; count: number; quantity: number }>();
    PERIOD_ORDER.forEach((p) => {
      map.set(p, { period: p, count: 0, quantity: 0 });
    });

    filteredRentals.forEach((r) => {
      const p = (r.period || '').trim();
      let matchedKey = '방과후/기타';
      for (const known of PERIOD_ORDER) {
        if (p.includes(known) || known.includes(p)) {
          matchedKey = known;
          break;
        }
      }

      let entry = map.get(matchedKey);
      if (!entry) {
        entry = { period: matchedKey, count: 0, quantity: 0 };
        map.set(matchedKey, entry);
      }
      entry.count += 1;
      entry.quantity += r.quantity || 0;
    });

    return Array.from(map.values());
  }, [filteredRentals]);

  // 6. Analytics: Teacher Ranking (Top 10)
  const teacherRankingData = useMemo(() => {
    const map = new Map<string, { name: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      const name = (r.teacherName || '미지정').trim();
      const entry = map.get(name) || { name, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      map.set(name, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredRentals]);

  // 7. Analytics: Grade & Class Distribution
  const gradeData = useMemo(() => {
    const map = new Map<string, { grade: string; count: number; quantity: number }>();
    ['1학년', '2학년', '3학년', '기타'].forEach((g) => {
      map.set(g, { grade: g, count: 0, quantity: 0 });
    });

    filteredRentals.forEach((r) => {
      const gc = (r.gradeClass || '').trim();
      let matchedGrade = '기타';
      if (gc.startsWith('1학년')) matchedGrade = '1학년';
      else if (gc.startsWith('2학년')) matchedGrade = '2학년';
      else if (gc.startsWith('3학년')) matchedGrade = '3학년';

      const entry = map.get(matchedGrade)!;
      entry.count += 1;
      entry.quantity += r.quantity || 0;
    });

    return Array.from(map.values());
  }, [filteredRentals]);

  // 8. Analytics: Top 10 Classes
  const classRankingData = useMemo(() => {
    const map = new Map<string, { gradeClass: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      const gc = (r.gradeClass || '미지정').trim();
      const entry = map.get(gc) || { gradeClass: gc, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      map.set(gc, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredRentals]);

  // 9. Analytics: Weekly / Monthly Trend
  const trendData = useMemo(() => {
    // Group by Date YYYY-MM-DD
    const dateMap = new Map<string, { date: string; label: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${date}`;
      const label = `${month}.${date}`;

      const entry = dateMap.get(key) || { date: key, label, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      dateMap.set(key, entry);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // show last 14 active days
  }, [filteredRentals]);

  // 10. Monthly Aggregate (연월별 추이)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      const entry = map.get(key) || { month: key, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredRentals]);

  // 11. Pagination for Raw Data Table
  const totalPages = Math.ceil(filteredRentals.length / rowsPerPage) || 1;
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRentals.slice(start, start + rowsPerPage);
  }, [filteredRentals, currentPage, rowsPerPage]);

  // Reset to page 1 on filter changes
  const resetPage = () => setCurrentPage(1);

  // 11-1. Analytics: Rental Approver Ranking (대여 승인자 순위)
  const rentalApproverData = useMemo(() => {
    const map = new Map<string, { name: string; position: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      const name = (r.approver || '미지정').trim();
      const pos = approvers.find((a) => a.name === name)?.position || '교직원';
      const entry = map.get(name) || { name, position: pos, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      map.set(name, entry);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || b.quantity - a.quantity
    );
  }, [filteredRentals, approvers]);

  // 11-2. Analytics: Return Approver Ranking (반납 승인자 순위)
  const returnApproverData = useMemo(() => {
    const map = new Map<string, { name: string; position: string; count: number; quantity: number }>();

    filteredRentals.forEach((r) => {
      if (r.status !== '반납 완료' && !r.returnApprover) return;
      const name = (r.returnApprover || '미지정/자동').trim();
      const pos = approvers.find((a) => a.name === name)?.position || '교직원';
      const entry = map.get(name) || { name, position: pos, count: 0, quantity: 0 };
      entry.count += 1;
      entry.quantity += r.quantity || 0;
      map.set(name, entry);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || b.quantity - a.quantity
    );
  }, [filteredRentals, approvers]);

  // 11-3. Analytics: Combined Comparison (대여승인 vs 반납승인 비교)
  const combinedApproverData = useMemo(() => {
    const map = new Map<string, {
      name: string;
      position: string;
      rentalCount: number;
      rentalQuantity: number;
      returnCount: number;
      returnQuantity: number;
      totalActions: number;
    }>();

    rentalApproverData.forEach((ra) => {
      map.set(ra.name, {
        name: ra.name,
        position: ra.position,
        rentalCount: ra.count,
        rentalQuantity: ra.quantity,
        returnCount: 0,
        returnQuantity: 0,
        totalActions: ra.count,
      });
    });

    returnApproverData.forEach((retA) => {
      const existing = map.get(retA.name);
      if (existing) {
        existing.returnCount = retA.count;
        existing.returnQuantity = retA.quantity;
        existing.totalActions += retA.count;
      } else {
        map.set(retA.name, {
          name: retA.name,
          position: retA.position,
          rentalCount: 0,
          rentalQuantity: 0,
          returnCount: retA.count,
          returnQuantity: retA.quantity,
          totalActions: retA.count,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalActions - a.totalActions || b.rentalCount - a.rentalCount)
      .slice(0, 10);
  }, [rentalApproverData, returnApproverData]);

  // 12. Excel Export Functionality (.xlsx)
  const handleExportExcel = () => {
    try {
      const exportRows = filteredRentals.map((r, index) => ({
        '연번': index + 1,
        '대여일시': r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '-',
        '사용교시': r.period || '-',
        '학년반': r.gradeClass || '-',
        '담당교사': r.teacherName || '-',
        '학생대표': r.studentRep || '-',
        '대여보관함': r.cartUsed || '-',
        '대여수량(대)': r.quantity || 0,
        '대여승인자': r.approver || '-',
        '대여상태': r.status || '-',
        '반납일시': r.returnedAt ? new Date(r.returnedAt).toLocaleString('ko-KR') : '-',
        '반납승인자': r.returnApprover || '-',
        '반납비고': r.returnNotes || '',
      }));

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(exportRows);

      // Define column widths for Excel
      ws['!cols'] = [
        { wch: 6 },  // 연번
        { wch: 22 }, // 대여일시
        { wch: 12 }, // 사용교시
        { wch: 14 }, // 학년반
        { wch: 14 }, // 담당교사
        { wch: 14 }, // 학생대표
        { wch: 12 }, // 대여보관함
        { wch: 14 }, // 대여수량
        { wch: 12 }, // 대여상태
        { wch: 22 }, // 반납일시
        { wch: 14 }, // 반납승인자
        { wch: 28 }, // 반납비고
      ];

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '태블릿_대여현황');

      // Add a summary worksheet
      const summaryRows = [
        { '항목': '총 대여 건수', '수치': `${summary.totalCount}건` },
        { '항목': '총 대여 기기 수량', '수치': `${summary.totalQuantity}대` },
        { '항목': '현재 대여 중', '수치': `${summary.activeCount}건` },
        { '항목': '반납 완료', '수치': `${summary.returnedCount}건` },
        { '항목': '보관함 1 대여', '수치': `${summary.cart1Count}건` },
        { '항목': '보관함 2 대여', '수치': `${summary.cart2Count}건` },
        { '항목': '데이터 추출 일시', '수치': new Date().toLocaleString('ko-KR') },
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, '통계요약');

      // Generate Filename
      const now = new Date();
      const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `상일미디어고_태블릿대여통계_${dateTag}.xlsx`;

      // Trigger download
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                  스마트 태블릿 대여 분석 대시보드
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] sm:text-xs font-black border border-purple-400/40">
                  슈퍼관리자 전용
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                요일·시간대·주간·월간 빈도, 교사 및 학급별 대여 통계 시각화 및 엑셀 데이터 추출
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/40 transition cursor-pointer"
              title="현재 필터링된 대여 목록을 엑셀(.xlsx) 파일로 다운로드합니다"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">엑셀 추출 (.xlsx)</span>
              <span className="sm:hidden">엑셀</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Period Control Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          {/* Top Row: Presets & Custom Range */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date Preset Buttons */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>조회 기간:</span>
              </span>
              {(
                [
                  { key: 'all', label: '전체' },
                  { key: 'today', label: '오늘' },
                  { key: '7days', label: '최근 7일' },
                  { key: '30days', label: '최근 30일' },
                  { key: 'thisMonth', label: '이번 달' },
                  { key: 'custom', label: '직접 지정' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setDatePreset(preset.key);
                    resetPage();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                    datePreset === preset.key
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Metric Toggle: 건수 vs 대수 */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 px-2">집계 기준:</span>
              <button
                type="button"
                onClick={() => setMetricView('count')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  metricView === 'count'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                대여 건수(건)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('quantity')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  metricView === 'quantity'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                기기 대수(대)
              </button>
            </div>
          </div>

          {/* Custom Date Pickers (Shown when custom is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
              <span className="text-xs font-bold text-slate-700">시작일:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  resetPage();
                }}
                className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
              />
              <span className="text-slate-400">~</span>
              <span className="text-xs font-bold text-slate-700">종료일:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  resetPage();
                }}
                className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
              />
            </div>
          )}

          {/* Filter Dropdowns & Keyword Search */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {/* Teacher Select */}
            <select
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value);
                resetPage();
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="all">전체 담당 교사</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} 선생님
                </option>
              ))}
            </select>

            {/* Grade Select */}
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                resetPage();
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="all">전체 학년</option>
              <option value="1학년">1학년</option>
              <option value="2학년">2학년</option>
              <option value="3학년">3학년</option>
            </select>

            {/* Cart Select */}
            <select
              value={selectedCart}
              onChange={(e) => {
                setSelectedCart(e.target.value);
                resetPage();
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="all">전체 보관함</option>
              <option value="보관함 1">보관함 1</option>
              <option value="보관함 2">보관함 2</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                resetPage();
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="all">전체 대여 상태</option>
              <option value="대여 중">대여 중</option>
              <option value="반납 완료">반납 완료</option>
            </select>

            {/* Keyword Search Input */}
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="검색어 (학생, 교사, 반)"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  resetPage();
                }}
                className="w-full h-9 pl-8 pr-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* KPI Mini-Cards Bar */}
        <div className="px-5 sm:px-7 py-3 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700">총 대여 건수</p>
              <p className="text-xl sm:text-2xl font-black text-blue-950 mt-0.5">
                {summary.totalCount.toLocaleString()}
                <span className="text-xs font-bold text-blue-600 ml-1">건</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-700">누적 대여 수량</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-950 mt-0.5">
                {summary.totalQuantity.toLocaleString()}
                <span className="text-xs font-bold text-indigo-600 ml-1">대</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Tablet className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700">반납 완료율</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-0.5">
                {summary.totalCount > 0
                  ? `${Math.round((summary.returnedCount / summary.totalCount) * 100)}%`
                  : '100%'}
                <span className="text-xs font-bold text-emerald-600 ml-1">
                  ({summary.returnedCount}/{summary.totalCount})
                </span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700">보관함 1 vs 2</p>
              <p className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
                {summary.cart1Count}건 : {summary.cart2Count}건
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-5 sm:px-7 pt-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('weekday-period')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'weekday-period'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>요일별 / 시간대(교시)별 빈도</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>누적 · 주간 · 월간 추이</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teacher-grade')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'teacher-grade'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>선생님별 / 학년반별 빈도</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvers')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'approvers'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>승인자별 통계 (대여·반납)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw-data')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'raw-data'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>기간별 대여 내역 리스트 ({filteredRentals.length}건)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: 요일별 & 시간대별 빈도 */}
          {activeTab === 'weekday-period' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 요일별 대여 빈도 차트 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          요일별 대여 빈도 분석
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          월요일부터 일요일까지 요일별 {metricView === 'count' ? '대여 건수' : '기기 대수'} 분포
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        >
                          {weekdayData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.day.includes('토') || entry.day.includes('일') ? '#94a3b8' : '#3b82f6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. 시간대별(교시별) 대여 빈도 차트 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          시간대(교시)별 대여 빈도 분석
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          1교시 ~ 7교시 및 방과후 수업 교시별 {metricView === 'count' ? '대여 건수' : '기기 대수'} 집중도
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={periodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 누적 · 주간 · 월간 추이 */}
          {activeTab === 'trends' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 최근 일자별 대여 추이 (최근 14일) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          최근 일별 대여 추이 (주간 분석)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          최근 활동일 기준 일자별 {metricView === 'count' ? '대여 건수' : '대여 대수'} 변화
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. 월별 대여 누적 추이 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          월간 대여 빈도 집계 (월별 누적)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          학사 일정에 따른 연월별 {metricView === 'count' ? '대여 건수' : '대여 대수'} 총량
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          fill="#8b5cf6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 선생님별 & 학년반별 빈도 */}
          {activeTab === 'teacher-grade' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 선생님별 대여 순위 Top 10 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          선생님별 대여 빈도 순위 (Top 10)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          수업에 태블릿을 가장 활발하게 활용하시는 선생님 순위
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teacherRankingData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }}
                          width={70}
                        />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          fill="#3b82f6"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. 학년별 및 학급별 대여 순위 Top 10 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          학급별(학년·반) 대여 빈도 순위 (Top 10)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          가장 대여 빈도가 높은 상위 10개 학급
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={classRankingData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="gradeClass"
                          tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }}
                          width={85}
                        />
                        <Tooltip
                          formatter={(value: any) => [
                            `${value} ${metricView === 'count' ? '건' : '대'}`,
                            metricView === 'count' ? '대여 건수' : '대여 대수',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar
                          dataKey={metricView === 'count' ? 'count' : 'quantity'}
                          fill="#10b981"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3. 학년별 총량 비교 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>학년별(1·2·3학년) 대여 총량 비교</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    전체 필터 대상: {summary.totalCount}건
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {gradeData.map((g) => (
                    <div key={g.grade} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-bold text-slate-500">{g.grade}</p>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {g.count}건
                        <span className="text-xs font-semibold text-slate-500 ml-1.5">
                          ({g.quantity}대)
                        </span>
                      </p>
                      <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: summary.totalCount > 0 ? `${(g.count / summary.totalCount) * 100}%` : '0%',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 대여·반납 승인자별 통계 */}
          {activeTab === 'approvers' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Approvers KPI Top Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">총 대여 승인</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-700">{summary.totalCount}</span>
                    <span className="text-xs font-bold text-blue-600">건</span>
                  </div>
                  <p className="text-[11px] text-blue-800/80 mt-1 font-medium">
                    대여 승인 교직원 {rentalApproverData.length}명 활동
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">최다 대여 승인자</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-indigo-700 truncate">
                      {rentalApproverData[0]?.name || '-'}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      ({rentalApproverData[0]?.count || 0}건)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800/80 mt-1 font-medium">
                    총 {rentalApproverData[0]?.quantity || 0}대 태블릿 대여 승인
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">총 반납 승인</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-700">{summary.returnedCount}</span>
                    <span className="text-xs font-bold text-emerald-600">건</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 mt-1 font-medium">
                    반납 확인 교직원 {returnApproverData.length}명 활동
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50/50 border border-teal-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">최다 반납 승인자</span>
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-teal-700 truncate">
                      {returnApproverData[0]?.name || '-'}
                    </span>
                    <span className="text-xs font-bold text-teal-600">
                      ({returnApproverData[0]?.count || 0}건)
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-800/80 mt-1 font-medium">
                    총 {returnApproverData[0]?.quantity || 0}대 태블릿 반납 검수
                  </p>
                </div>
              </div>

              {/* 2-Column Ranking Charts: Rental Approvers vs Return Approvers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 대여 승인자 순위 차트 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          대여 승인자별 빈도 순위 (Top 10)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          대여 신청을 승인한 담당 교직원별 통계
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      {metricView === 'count' ? '승인 건수 기준' : '승인 대수 기준'}
                    </span>
                  </div>

                  <div className="h-64 w-full pt-2">
                    {rentalApproverData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        데이터가 없습니다.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rentalApproverData.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }}
                            width={80}
                          />
                          <Tooltip
                            formatter={(value: any) => [
                              `${value} ${metricView === 'count' ? '건' : '대'}`,
                              metricView === 'count' ? '대여 승인 건수' : '대여 대수',
                            ]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          />
                          <Bar
                            dataKey={metricView === 'count' ? 'count' : 'quantity'}
                            fill="#3b82f6"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. 반납 승인자 순위 차트 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          반납 승인자별 빈도 순위 (Top 10)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          태블릿 반납을 최종 확인·승인한 담당 교직원별 통계
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      {metricView === 'count' ? '반납 건수 기준' : '반납 대수 기준'}
                    </span>
                  </div>

                  <div className="h-64 w-full pt-2">
                    {returnApproverData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        반납 승인 데이터가 없습니다.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={returnApproverData.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }}
                            width={80}
                          />
                          <Tooltip
                            formatter={(value: any) => [
                              `${value} ${metricView === 'count' ? '건' : '대'}`,
                              metricView === 'count' ? '반납 승인 건수' : '반납 대수',
                            ]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          />
                          <Bar
                            dataKey={metricView === 'count' ? 'count' : 'quantity'}
                            fill="#10b981"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Combined Comparison Bar Chart (대여승인 vs 반납승인 비교) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        승인자별 대여 승인 vs 반납 승인 교차 비교
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        주요 교직원별 대여 업무(블루)와 반납 확인(에메랄드) 참여 건수 비교
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  {combinedApproverData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      데이터가 없습니다.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={combinedApproverData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `${value}건`,
                            name === 'rentalCount' ? '대여 승인' : '반납 승인',
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          formatter={(value) => (value === 'rentalCount' ? '대여 승인 건수' : '반납 승인 건수')}
                        />
                        <Bar dataKey="rentalCount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="returnCount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* 4. Detailed Ranking Tables: Rental Approvers & Return Approvers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 대여 승인자 상세 테이블 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs sm:text-sm font-black text-slate-800">
                        대여 승인자 상세 통계 ({rentalApproverData.length}명)
                      </h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold sticky top-0 bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">순위</th>
                          <th className="py-2.5 px-3">승인자명</th>
                          <th className="py-2.5 px-3">직책/소속</th>
                          <th className="py-2.5 px-3 text-right">대여 승인</th>
                          <th className="py-2.5 px-3 text-right">승인 수량</th>
                          <th className="py-2.5 px-3 text-right">점유율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rentalApproverData.map((a, idx) => {
                          const share = summary.totalCount > 0 ? Math.round((a.count / summary.totalCount) * 100) : 0;
                          return (
                            <tr key={a.name} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {idx < 3 ? (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white ${
                                    idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                ) : (
                                  idx + 1
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{a.name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{a.position}</td>
                              <td className="py-2.5 px-3 text-right font-black text-blue-600">{a.count}건</td>
                              <td className="py-2.5 px-3 text-right text-slate-700 font-bold">{a.quantity}대</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-600">{share}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 반납 승인자 상세 테이블 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs sm:text-sm font-black text-slate-800">
                        반납 승인자 상세 통계 ({returnApproverData.length}명)
                      </h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold sticky top-0 bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">순위</th>
                          <th className="py-2.5 px-3">승인자명</th>
                          <th className="py-2.5 px-3">직책/소속</th>
                          <th className="py-2.5 px-3 text-right">반납 승인</th>
                          <th className="py-2.5 px-3 text-right">반납 수량</th>
                          <th className="py-2.5 px-3 text-right">반납 점유율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {returnApproverData.map((a, idx) => {
                          const share = summary.returnedCount > 0 ? Math.round((a.count / summary.returnedCount) * 100) : 0;
                          return (
                            <tr key={a.name} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {idx < 3 ? (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white ${
                                    idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                ) : (
                                  idx + 1
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{a.name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{a.position}</td>
                              <td className="py-2.5 px-3 text-right font-black text-emerald-600">{a.count}건</td>
                              <td className="py-2.5 px-3 text-right text-slate-700 font-bold">{a.quantity}대</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-600">{share}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Raw Data Table & Excel Export */}
          {activeTab === 'raw-data' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  총 <span className="text-blue-600 font-extrabold">{filteredRentals.length}</span>건 검색됨
                  <span className="text-slate-400 ml-1.5 font-normal">
                    (총 대여 수량: {summary.totalQuantity.toLocaleString()}대)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                  >
                    <option value={10}>10개씩 보기</option>
                    <option value={15}>15개씩 보기</option>
                    <option value={30}>30개씩 보기</option>
                    <option value={50}>50개씩 보기</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>엑셀 다운로드</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold select-none">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">연번</th>
                        <th className="py-3 px-3 whitespace-nowrap">대여 일시</th>
                        <th className="py-3 px-3 whitespace-nowrap">교시</th>
                        <th className="py-3 px-3 whitespace-nowrap">학년·반</th>
                        <th className="py-3 px-3 whitespace-nowrap">담당 교사</th>
                        <th className="py-3 px-3 whitespace-nowrap">학생 대표</th>
                        <th className="py-3 px-3 whitespace-nowrap">보관함</th>
                        <th className="py-3 px-3 whitespace-nowrap text-right">대여수량</th>
                        <th className="py-3 px-3 whitespace-nowrap text-center">상태</th>
                        <th className="py-3 px-3 whitespace-nowrap">반납일시 / 승인자</th>
                        <th className="py-3 px-3 whitespace-nowrap">비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedRentals.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-400">
                            조회 조건에 일치하는 대여 기록이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        paginatedRentals.map((rental, idx) => {
                          const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                          const rDate = rental.createdAt ? new Date(rental.createdAt) : null;
                          const isReturned = rental.status === '반납 완료';

                          return (
                            <tr key={rental.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                {rowNum}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-mono">
                                {rDate
                                  ? `${rDate.getFullYear()}.${String(rDate.getMonth() + 1).padStart(2, '0')}.${String(rDate.getDate()).padStart(2, '0')} ${String(rDate.getHours()).padStart(2, '0')}:${String(rDate.getMinutes()).padStart(2, '0')}`
                                  : '-'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
                                {rental.period ? rental.period.replace(/\s*\(.*\)/, '') : '-'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                                {rental.gradeClass}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap font-bold text-blue-700">
                                {rental.teacherName ? rental.teacherName.replace(/\s*\(.*\)/, '') : ''} 선생님
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                {rental.studentRep || '-'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {rental.cartUsed}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-right font-black text-slate-900 font-mono">
                                {rental.quantity}대
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isReturned
                                      ? 'bg-slate-100 text-slate-600'
                                      : 'bg-amber-100 text-amber-800 animate-pulse font-black'
                                  }`}
                                >
                                  {rental.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                                {isReturned && rental.returnedAt ? (
                                  <div>
                                    <span>
                                      {new Date(rental.returnedAt).toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                    {rental.returnApprover && (
                                      <span className="text-slate-400 ml-1">
                                        ({rental.returnApprover})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={rental.returnNotes || ''}>
                                {rental.returnNotes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      페이지 {currentPage} / {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>이전</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                      >
                        <span>다음</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>상일미디어고등학교 IT Desk · 교직원 스마트태블릿 대여 관리 시스템 정밀 통계</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
