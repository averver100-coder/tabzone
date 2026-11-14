import {
  Check,
  Edit3,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Tablet,
  Trash2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
import {
  addDevice,
  removeDevice,
  resetDefault60Devices,
  updateDevice,
} from '../services/deviceService';
import { AuthUser, DeviceStatus, TabletDevice } from '../types';

interface DeviceManagementTabProps {
  currentUser?: AuthUser | null;
  devices: TabletDevice[];
  onStatusMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

const DEVICE_STATUS_OPTIONS: DeviceStatus[] = ['정상', '점검필요', '수리중', '분실/폐기'];

export const DeviceManagementTab: React.FC<DeviceManagementTabProps> = ({
  currentUser,
  devices,
  onStatusMessage,
}) => {
  const [cartFilter, setCartFilter] = useState<'ALL' | '보관함 1' | '보관함 2'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DeviceStatus>('ALL');
  const [searchText, setSearchText] = useState('');

  // Add Device Form State
  const [cartName, setCartName] = useState<'보관함 1' | '보관함 2'>('보관함 1');
  const [slotNumber, setSlotNumber] = useState<number>(31);
  const [assetNumber, setAssetNumber] = useState('');
  const [modelName, setModelName] = useState('Galaxy Tab S6 Lite');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('정상');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Edit Device State
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editCartName, setEditCartName] = useState<'보관함 1' | '보관함 2'>('보관함 1');
  const [editSlotNumber, setEditSlotNumber] = useState<number>(1);
  const [editAssetNumber, setEditAssetNumber] = useState('');
  const [editModelName, setEditModelName] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editStatus, setEditStatus] = useState<DeviceStatus>('정상');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirm State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const operator = useMemo(
    () => ({
      uid: currentUser?.uid || 'superadmin-sso',
      email: currentUser?.email || SUPER_ADMIN_EMAIL,
    }),
    [currentUser]
  );

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (cartFilter !== 'ALL' && d.cartName !== cartFilter) return false;
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const hit =
          d.assetNumber.toLowerCase().includes(q) ||
          d.modelName.toLowerCase().includes(q) ||
          (d.serialNumber || '').toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q) ||
          `${d.slotNumber}번`.includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [devices, cartFilter, statusFilter, searchText]);

  const cart1Count = useMemo(
    () => devices.filter((d) => d.cartName === '보관함 1').length,
    [devices]
  );
  const cart2Count = useMemo(
    () => devices.filter((d) => d.cartName === '보관함 2').length,
    [devices]
  );
  const issueCount = useMemo(
    () => devices.filter((d) => d.status !== '정상').length,
    [devices]
  );

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetNumber.trim()) {
      onStatusMessage({ type: 'error', text: '기기 관리번호(예: TAB1-31)를 입력해 주세요.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addDevice(operator, {
        cartName,
        slotNumber,
        assetNumber: assetNumber.trim(),
        modelName: modelName.trim() || 'Galaxy Tab S6 Lite',
        serialNumber: serialNumber.trim(),
        status,
        notes: notes.trim(),
      });
      setAssetNumber('');
      setSerialNumber('');
      setNotes('');
      setSlotNumber((prev) => prev + 1);
      onStatusMessage({
        type: 'success',
        text: `[${created.cartName}] ${created.assetNumber} 기기가 기기리스트에 등록되었습니다.`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '기기 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (d: TabletDevice) => {
    setConfirmDeleteId(null);
    setEditingDeviceId(d.id);
    setEditCartName(d.cartName);
    setEditSlotNumber(d.slotNumber);
    setEditAssetNumber(d.assetNumber);
    setEditModelName(d.modelName);
    setEditSerialNumber(d.serialNumber || '');
    setEditStatus(d.status);
    setEditNotes(d.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent, original: TabletDevice) => {
    e.preventDefault();
    if (!editAssetNumber.trim()) {
      onStatusMessage({ type: 'error', text: '관리번호를 입력해 주세요.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await updateDevice(operator, original, {
        cartName: editCartName,
        slotNumber: editSlotNumber,
        assetNumber: editAssetNumber.trim(),
        modelName: editModelName.trim() || 'Galaxy Tab S6 Lite',
        serialNumber: editSerialNumber.trim(),
        status: editStatus,
        notes: editNotes.trim(),
      });
      setEditingDeviceId(null);
      onStatusMessage({
        type: 'success',
        text: `[${updated.cartName}] ${updated.assetNumber} 기기 정보가 수정되었습니다.`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '기기 정보 수정 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (d: TabletDevice) => {
    setDeletingId(d.id);
    try {
      await removeDevice(operator, d);
      setConfirmDeleteId(null);
      if (editingDeviceId === d.id) setEditingDeviceId(null);
      onStatusMessage({
        type: 'success',
        text: `[${d.cartName}] ${d.assetNumber} 기기가 목록에서 삭제되었습니다.`,
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '기기 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    setIsResetting(true);
    try {
      await resetDefault60Devices(operator);
      onStatusMessage({
        type: 'success',
        text: '보관함 1·2 기본 태블릿 60대 기기리스트가 생성/동기화되었습니다.',
      });
    } catch (err: any) {
      onStatusMessage({
        type: 'error',
        text: err?.message || '기본 기기리스트 초기화 중 오류가 발생했습니다.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusBadgeStyle = (s: DeviceStatus) => {
    switch (s) {
      case '정상':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case '점검필요':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '수리중':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case '분실/폐기':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Info & Summary Header */}
      <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs sm:text-sm font-black text-sky-950 flex items-center gap-1.5">
            <Tablet className="w-4 h-4 text-sky-600" />
            <span>태블릿 기기리스트 자산 대장 (보관함 1·2)</span>
          </div>
          <p className="text-[11px] sm:text-xs text-sky-800 font-medium">
            총 <strong>{devices.length}대</strong> (보관함1 {cart1Count}대 · 보관함2 {cart2Count}대 · 특이사항 {issueCount}대) — 모든 기기 정보는 수동 영구 스냅샷 및 자동 백업 대상에 포함됩니다.
          </p>
        </div>

        {devices.length === 0 && (
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isResetting}
            className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isResetting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>기본 60대 일괄 생성</span>
          </button>
        )}
      </div>

      {/* Add New Device Form */}
      <form
        onSubmit={handleAddDevice}
        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
      >
        <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-sky-600" />
          <span>새 태블릿 기기 추가 등록</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">보관함</label>
            <select
              value={cartName}
              onChange={(e) => setCartName(e.target.value as '보관함 1' | '보관함 2')}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
            >
              <option value="보관함 1">보관함 1</option>
              <option value="보관함 2">보관함 2</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">슬롯 번호</label>
            <input
              type="number"
              min={1}
              max={999}
              value={slotNumber}
              onChange={(e) => setSlotNumber(Number(e.target.value) || 1)}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">관리번호 *</label>
            <input
              type="text"
              required
              placeholder="예: TAB1-31"
              value={assetNumber}
              onChange={(e) => setAssetNumber(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">모델명</label>
            <input
              type="text"
              placeholder="Galaxy Tab S6 Lite"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">시리얼 번호</label>
            <input
              type="text"
              placeholder="선택 입력"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DeviceStatus)}
              className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
            >
              {DEVICE_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="비고/점검 메모 (예: 충전케이블 교체, 강화유리 파손 등)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>기기 등록하기</span>
          </button>
        </div>
      </form>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="관리번호(TAB1-01), 모델명, 시리얼, 비고 검색..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', '보관함 1', '보관함 2'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCartFilter(c)}
              className={`h-9 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                cartFilter === c
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'ALL' ? `전체 (${devices.length})` : c}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | DeviceStatus)}
            className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">상태 전체</option>
            {DEVICE_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices List */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto border border-slate-200 rounded-2xl bg-white">
        {filteredDevices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-1.5">
            <Tablet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              조건에 해당하는 태블릿 기기가 없습니다.
            </p>
          </div>
        ) : (
          filteredDevices.map((d) => {
            const isEditing = editingDeviceId === d.id;
            return (
              <div key={d.id} className="p-3 sm:p-3.5 hover:bg-slate-50/70 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${
                        d.cartName === '보관함 1'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {d.cartName} #{String(d.slotNumber).padStart(2, '0')}
                    </span>

                    <span className="text-sm font-black text-slate-900 font-mono">
                      {d.assetNumber}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${getStatusBadgeStyle(
                        d.status
                      )}`}
                    >
                      {d.status}
                    </span>

                    <span className="text-xs text-slate-600 font-semibold">{d.modelName}</span>

                    {d.serialNumber && (
                      <span className="text-[11px] font-mono text-slate-400">
                        S/N: {d.serialNumber}
                      </span>
                    )}

                    {d.notes && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold">
                        {d.notes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingDeviceId(null) : startEditing(d))}
                      className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isEditing ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>닫기</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>수정</span>
                        </>
                      )}
                    </button>

                    {confirmDeleteId === d.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={deletingId === d.id}
                          onClick={() => handleDelete(d)}
                          className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === d.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>삭제</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 px-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                        title="기기 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <form
                    onSubmit={(e) => handleSaveEdit(e, d)}
                    className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                  >
                    <select
                      value={editCartName}
                      onChange={(e) =>
                        setEditCartName(e.target.value as '보관함 1' | '보관함 2')
                      }
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="보관함 1">보관함 1</option>
                      <option value="보관함 2">보관함 2</option>
                    </select>

                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={editSlotNumber}
                      onChange={(e) => setEditSlotNumber(Number(e.target.value) || 1)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      placeholder="슬롯번호"
                    />

                    <input
                      type="text"
                      required
                      value={editAssetNumber}
                      onChange={(e) => setEditAssetNumber(e.target.value)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      placeholder="관리번호"
                    />

                    <input
                      type="text"
                      value={editModelName}
                      onChange={(e) => setEditModelName(e.target.value)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                      placeholder="모델명"
                    />

                    <input
                      type="text"
                      value={editSerialNumber}
                      onChange={(e) => setEditSerialNumber(e.target.value)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                      placeholder="시리얼 번호"
                    />

                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as DeviceStatus)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      {DEVICE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex items-center gap-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="flex-1 h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                        placeholder="비고/특이사항 메모"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>저장</span>
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
  );
};
