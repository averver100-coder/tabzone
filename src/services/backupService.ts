import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { APP_VERSION } from '../lib/appVersion';
import { db } from '../lib/firebase';
import {
  Approver,
  BackupPayloadData,
  BackupRecord,
  BackupType,
  formatCartName,
  Rental,
  TabletDevice,
  Teacher,
  WhitelistUser,
} from '../types';
import { createAuditLog } from './auditService';
import { BUILTIN_ADMIN_EMAILS, isBuiltinAdmin, SUPER_ADMIN_EMAIL } from './authService';

const BACKUPS_COLLECTION = 'backups';
const LOCAL_STORAGE_BACKUPS_KEY = 'tabzone_backups_cache';
const LAST_AUTO_BACKUP_TS_KEY = 'tabzone_last_auto_backup_ts';

// Core asset/operation collections to copy (explicitly EXCLUDES 'audit_logs' / 'auditLogs')
export const BACKUP_INCLUDED_COLLECTIONS = [
  'devices',
  'rentals',
  'whitelist',
  'teachers',
  'approvers',
] as const;

export const EXCLUDED_BACKUP_COLLECTIONS = ['audit_logs', 'auditLogs'] as const;

export const AUTO_BACKUP_DEBOUNCE_MS = 60 * 60 * 1000; // 1 hour
export const MAX_AUTO_BACKUPS = 10;

const LOCAL_DEVICES_KEY = 'tabzone_devices_cache';
const LOCAL_RENTALS_KEY = 'tabzone_rentals_cache';
const LOCAL_WHITELIST_KEY = 'tabzone_whitelist_cache';
const LOCAL_TEACHERS_KEY = 'tabzone_teachers_cache';
const LOCAL_APPROVERS_KEY = 'tabzone_approvers_cache';

let isAutoBackupInFlight = false;

const backupListeners = new Set<(backups: BackupRecord[]) => void>();

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = stripUndefinedDeep(v);
      }
    }
    return result as T;
  }
  return value;
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore parse error
  }
  return fallback;
}

function writeLocalJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota error
  }
}

function getLocalBackups(): BackupRecord[] {
  const list = readLocalJson<BackupRecord[]>(LOCAL_STORAGE_BACKUPS_KEY, []);
  return sortBackupsDesc(Array.isArray(list) ? list : []);
}

function saveLocalBackups(backups: BackupRecord[]) {
  const sorted = sortBackupsDesc(backups);
  // Keep all manual backups + up to 10 auto backups in local cache
  const manuals = sorted.filter((b) => b.backupType === 'manual');
  const autos = sorted.filter((b) => b.backupType === 'auto').slice(0, MAX_AUTO_BACKUPS);
  writeLocalJson(LOCAL_STORAGE_BACKUPS_KEY, sortBackupsDesc([...manuals, ...autos]));
}

function sortBackupsDesc(list: BackupRecord[]): BackupRecord[] {
  return [...list].sort((a, b) => {
    const tA = new Date(a.createdAt).getTime() || 0;
    const tB = new Date(b.createdAt).getTime() || 0;
    return tB - tA;
  });
}

function notifyAllBackups(backups: BackupRecord[]) {
  const sorted = sortBackupsDesc(backups);
  saveLocalBackups(sorted);
  backupListeners.forEach((listener) => {
    try {
      listener(sorted);
    } catch (e) {
      console.error('Error notifying backup listener:', e);
    }
  });
}

function getDocIdForEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

function ensureBuiltinAdminsList(list: WhitelistUser[]): WhitelistUser[] {
  const result = [...list];
  BUILTIN_ADMIN_EMAILS.forEach((adminEmail) => {
    const exists = result.some(
      (u) => u.email.toLowerCase() === adminEmail.toLowerCase()
    );
    if (!exists) {
      const isSuper = adminEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      result.unshift({
        email: adminEmail,
        name: isSuper ? '슈퍼관리자 (교육정보부)' : '에듀테크 총괄관리자 (상일미디어고)',
        role: 'superadmin',
        department: '교육정보부 총괄',
        createdAt: new Date().toISOString(),
        addedBy: '시스템 영구 보존',
      });
    }
  });
  return result;
}

/**
 * Subscribe to backups list in real-time with local cache fallback
 */
export function subscribeToBackups(
  callback: (backups: BackupRecord[]) => void
): () => void {
  backupListeners.add(callback);
  callback(getLocalBackups());

  let unsubscribeFirestore = () => {};
  try {
    const q = query(
      collection(db, BACKUPS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const list: BackupRecord[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as BackupRecord;
          if (item && item.id) {
            list.push({
              ...item,
              backupType: item.backupType === 'manual' ? 'manual' : 'auto',
            });
          }
        });
        notifyAllBackups(list);
      },
      (error) => {
        console.warn('Firestore backups subscription notice, using local cache:', error);
        callback(getLocalBackups());
      }
    );
  } catch (err) {
    console.warn('Failed to attach backups listener, using local cache:', err);
  }

  return () => {
    backupListeners.delete(callback);
    unsubscribeFirestore();
  };
}

/**
 * Manually fetch latest backups from Firestore
 */
export async function fetchBackups(): Promise<BackupRecord[]> {
  try {
    const q = query(
      collection(db, BACKUPS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const list: BackupRecord[] = [];
    snap.forEach((docSnap) => {
      const item = docSnap.data() as BackupRecord;
      if (item && item.id) {
        list.push({
          ...item,
          backupType: item.backupType === 'manual' ? 'manual' : 'auto',
        });
      }
    });
    notifyAllBackups(list);
    return sortBackupsDesc(list);
  } catch (error) {
    console.warn('fetchBackups Firestore fallback to local cache:', error);
    const local = getLocalBackups();
    notifyAllBackups(local);
    return local;
  }
}

/**
 * Collect core data ONLY from Firestore/local cache.
 * IMPORTANT: Explicitly excludes 'audit_logs' / 'auditLogs' to optimize storage & cost.
 */
async function collectCoreBackupPayload(): Promise<BackupPayloadData> {
  let devices: TabletDevice[] = [];
  let rentals: Rental[] = [];
  let whitelist: WhitelistUser[] = [];
  let teachers: Teacher[] = [];
  let approvers: Approver[] = [];

  try {
    const [devicesSnap, rentalsSnap, whitelistSnap, teachersSnap, approversSnap] = await Promise.all([
      getDocs(collection(db, 'devices')),
      getDocs(query(collection(db, 'rentals'), orderBy('createdAt', 'desc'), limit(500))),
      getDocs(collection(db, 'whitelist')),
      getDocs(collection(db, 'teachers')),
      getDocs(collection(db, 'approvers')),
    ]);

    devicesSnap.forEach((d) => {
      const item = d.data() as TabletDevice;
      if (item && item.id) devices.push(item);
    });
    rentalsSnap.forEach((d) => {
      const item = d.data() as Rental;
      if (item && item.id) rentals.push(item);
    });
    whitelistSnap.forEach((d) => {
      const item = d.data() as WhitelistUser;
      if (item && item.email) whitelist.push(item);
    });
    teachersSnap.forEach((d) => {
      const item = d.data() as Teacher;
      if (item && item.id) teachers.push(item);
    });
    approversSnap.forEach((d) => {
      const item = d.data() as Approver;
      if (item && item.id) approvers.push(item);
    });
  } catch (err) {
    console.warn('Collecting backup payload from Firestore had a notice, merging local cache:', err);
  }

  // Merge local cache fallbacks so offline/optimistic changes are captured
  const localDevices = readLocalJson<TabletDevice[]>(LOCAL_DEVICES_KEY, []);
  if (devices.length === 0 && localDevices.length > 0) {
    devices = localDevices;
  }

  const localRentals = readLocalJson<Rental[]>(LOCAL_RENTALS_KEY, []);
  if (rentals.length === 0 && localRentals.length > 0) {
    rentals = localRentals;
  }

  const localWhitelist = readLocalJson<WhitelistUser[]>(LOCAL_WHITELIST_KEY, []);
  if (whitelist.length === 0 && localWhitelist.length > 0) {
    whitelist = localWhitelist;
  }
  whitelist = ensureBuiltinAdminsList(whitelist);

  const localTeachers = readLocalJson<Teacher[]>(LOCAL_TEACHERS_KEY, []);
  if (teachers.length === 0 && localTeachers.length > 0) {
    teachers = localTeachers;
  }

  const localApprovers = readLocalJson<Approver[]>(LOCAL_APPROVERS_KEY, []);
  if (approvers.length === 0 && localApprovers.length > 0) {
    approvers = localApprovers;
  }

  // Safety guard for Firestore 1MB document size limit
  let sanitizedRentals = stripUndefinedDeep(rentals);
  const sanitizedDevices = stripUndefinedDeep(devices);
  const basePayload = stripUndefinedDeep({
    devices: sanitizedDevices,
    rentals: sanitizedRentals,
    whitelist,
    teachers,
    approvers,
  });

  if (JSON.stringify(basePayload).length > 780_000 && sanitizedRentals.length > 200) {
    sanitizedRentals = sanitizedRentals.slice(0, 200);
  }

  return stripUndefinedDeep({
    devices: sanitizedDevices,
    rentals: sanitizedRentals,
    whitelist,
    teachers,
    approvers,
  });
}

/**
 * Rotate auto backups:
 * Query ONLY documents where backupType == 'auto' ordered by createdAt desc.
 * Keep latest 10 and delete the 11th+ oldest 'auto' docs.
 * CRITICAL: backupType === 'manual' documents are NEVER queried or deleted.
 */
async function rotateAutoBackups(): Promise<number> {
  let deletedCount = 0;

  try {
    let autoDocs: Array<{ id: string; createdAt: string; backupType: BackupType }> = [];

    try {
      const autoQuery = query(
        collection(db, BACKUPS_COLLECTION),
        where('backupType', '==', 'auto'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(autoQuery);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Partial<BackupRecord>;
        // Double verification: strictly only 'auto' documents
        if (data && data.backupType === 'auto') {
          autoDocs.push({
            id: docSnap.id,
            createdAt: data.createdAt || '',
            backupType: 'auto',
          });
        }
      });
    } catch (indexErr) {
      // Fallback if composite index (backupType + createdAt) is not created yet
      console.warn('Composite index fallback for auto backup rotation:', indexErr);
      const fallbackQuery = query(
        collection(db, BACKUPS_COLLECTION),
        where('backupType', '==', 'auto')
      );
      const snap = await getDocs(fallbackQuery);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Partial<BackupRecord>;
        if (data && data.backupType === 'auto') {
          autoDocs.push({
            id: docSnap.id,
            createdAt: data.createdAt || '',
            backupType: 'auto',
          });
        }
      });
      autoDocs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    const toDelete = autoDocs.slice(MAX_AUTO_BACKUPS);
    for (const target of toDelete) {
      if (target.backupType === 'auto') {
        await deleteDoc(doc(db, BACKUPS_COLLECTION, target.id));
        deletedCount++;
      }
    }

    if (toDelete.length > 0) {
      const deletedSet = new Set(toDelete.map((d) => d.id));
      const updatedLocal = getLocalBackups().filter((b) => !deletedSet.has(b.id));
      notifyAllBackups(updatedLocal);
    }
  } catch (err) {
    console.warn('Auto backup rotation notice:', err);
  }

  return deletedCount;
}

/**
 * Create a backup snapshot in Firestore (/backups/{backupId}).
 * - backupType: 'auto' | 'manual'
 * - Explicitly EXCLUDES 'audit_logs' / 'auditLogs'
 * - Rotates only 'auto' backups (keeping latest 10) when backupType === 'auto'
 */
export async function backupData(
  operator: { uid: string; email: string },
  backupType: BackupType,
  note?: string
): Promise<BackupRecord> {
  const nowIso = new Date().toISOString();
  const backupId =
    (backupType === 'manual' ? 'manual_' : 'auto_') +
    Date.now() +
    '_' +
    Math.random().toString(36).substring(2, 6);

  const payload = await collectCoreBackupPayload();

  const record: BackupRecord = stripUndefinedDeep({
    id: backupId,
    backupType,
    createdAt: nowIso,
    createdBy: operator?.email || SUPER_ADMIN_EMAIL,
    version: APP_VERSION,
    source: backupType === 'manual' ? 'Firebase DB · 영구 스냅샷' : 'Firebase DB · 자동 순환',
    note:
      note?.trim() ||
      (backupType === 'manual'
        ? '관리자 수동 확정 영구 스냅샷'
        : '데이터 변동 감지 자동 순환 백업'),
    counts: {
      devices: payload.devices?.length || 0,
      rentals: payload.rentals.length,
      whitelist: payload.whitelist.length,
      teachers: payload.teachers.length,
      approvers: payload.approvers.length,
    },
    data: payload,
  });

  if (backupType === 'auto') {
    try {
      localStorage.setItem(LAST_AUTO_BACKUP_TS_KEY, String(Date.now()));
    } catch {
      // Ignore storage error
    }
  }

  // Update local backup list immediately
  const currentLocal = getLocalBackups().filter((b) => b.id !== record.id);
  notifyAllBackups([record, ...currentLocal]);

  // Write to Firestore
  await setDoc(doc(db, BACKUPS_COLLECTION, backupId), record);

  if (backupType === 'auto') {
    await rotateAutoBackups();
  } else {
    await createAuditLog(
      operator,
      '수동 영구 백업 생성',
      `자산 실사 확정 영구 스냅샷 생성 (기기 ${record.counts.devices ?? 0}대, 대여 ${record.counts.rentals}건, 화이트리스트 ${record.counts.whitelist}명)`,
      `스냅샷 ID: ${record.id}, 비고: ${record.note}`
    );
  }

  return record;
}

/**
 * Event-driven auto backup with 1-hour debounce.
 * Skips silently if the last 'auto' backup was created within 1 hour.
 */
export async function triggerAutoBackupIfNeeded(
  operator: { uid: string; email: string },
  reason?: string
): Promise<{ created: boolean; record?: BackupRecord; skippedReason?: string }> {
  if (isAutoBackupInFlight) {
    return { created: false, skippedReason: 'in-flight' };
  }

  isAutoBackupInFlight = true;
  try {
    const now = Date.now();

    // Fast check against local timestamp & local cache first
    try {
      const lastTsRaw = localStorage.getItem(LAST_AUTO_BACKUP_TS_KEY);
      if (lastTsRaw) {
        const lastTs = Number(lastTsRaw);
        if (!Number.isNaN(lastTs) && now - lastTs < AUTO_BACKUP_DEBOUNCE_MS) {
          return { created: false, skippedReason: 'debounced-local' };
        }
      }
    } catch {
      // Ignore storage read error
    }

    // Check Firestore for most recent 'auto' backup
    let latestAutoCreatedAt: string | null = null;
    try {
      try {
        const latestAutoQuery = query(
          collection(db, BACKUPS_COLLECTION),
          where('backupType', '==', 'auto'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(latestAutoQuery);
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Partial<BackupRecord>;
          if (data?.backupType === 'auto' && data.createdAt) {
            latestAutoCreatedAt = data.createdAt;
          }
        });
      } catch {
        // Fallback query without composite orderBy
        const fallbackQuery = query(
          collection(db, BACKUPS_COLLECTION),
          where('backupType', '==', 'auto')
        );
        const snap = await getDocs(fallbackQuery);
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Partial<BackupRecord>;
          if (
            data?.backupType === 'auto' &&
            data.createdAt &&
            (!latestAutoCreatedAt || data.createdAt > latestAutoCreatedAt)
          ) {
            latestAutoCreatedAt = data.createdAt;
          }
        });
      }
    } catch (err) {
      // Check local backups if Firestore check fails
      const localAutos = getLocalBackups().filter((b) => b.backupType === 'auto');
      if (localAutos[0]?.createdAt) {
        latestAutoCreatedAt = localAutos[0].createdAt;
      }
      console.warn('Auto backup debounce check notice:', err);
    }

    if (latestAutoCreatedAt) {
      const latestMs = new Date(latestAutoCreatedAt).getTime();
      if (!Number.isNaN(latestMs) && now - latestMs < AUTO_BACKUP_DEBOUNCE_MS) {
        try {
          localStorage.setItem(LAST_AUTO_BACKUP_TS_KEY, String(latestMs));
        } catch {
          // Ignore
        }
        return { created: false, skippedReason: 'debounced-server' };
      }
    }

    const record = await backupData(
      operator,
      'auto',
      reason || '데이터 변동 감지 자동 순환 백업'
    );
    return { created: true, record };
  } catch (err) {
    console.warn('Auto backup trigger notice:', err);
    return { created: false, skippedReason: 'error' };
  } finally {
    isAutoBackupInFlight = false;
  }
}

/**
 * Helper to commit Firestore operations in safe chunks (< 450 per batch)
 */
async function commitOperationsInBatches(
  ops: Array<{ type: 'set' | 'delete'; path: [string, string]; data?: unknown }>
) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((op) => {
      const ref = doc(db, op.path[0], op.path[1]);
      if (op.type === 'delete') {
        batch.delete(ref);
      } else if (op.data !== undefined) {
        batch.set(ref, op.data);
      }
    });
    await batch.commit();
  }
}

/**
 * Restore all core collections from a BackupRecord.
 * Writes directly to Firestore & localStorage (avoiding recursive auto-backup CRUD triggers),
 * and preserves built-in superadmin accounts permanently.
 */
export async function restoreFromBackup(
  operator: { uid: string; email: string },
  backup: BackupRecord
): Promise<BackupPayloadData> {
  if (!backup || !backup.data) {
    throw new Error('복원할 백업 데이터가 올바르지 않습니다.');
  }

  const hasDevicesField = Array.isArray(backup.data.devices);
  const restoredDevices = hasDevicesField
    ? stripUndefinedDeep(backup.data.devices || [])
    : [];
  const restoredRentals = stripUndefinedDeep(backup.data.rentals || []);
  const restoredWhitelist = ensureBuiltinAdminsList(
    stripUndefinedDeep(backup.data.whitelist || [])
  );
  const restoredTeachers = stripUndefinedDeep(backup.data.teachers || []);
  const restoredApprovers = stripUndefinedDeep(backup.data.approvers || []);

  // 1. Fetch existing documents in target collections to delete stale entries not in snapshot
  const ops: Array<{ type: 'set' | 'delete'; path: [string, string]; data?: unknown }> = [];

  try {
    const [curDevices, curRentals, curWhitelist, curTeachers, curApprovers] = await Promise.all([
      hasDevicesField ? getDocs(collection(db, 'devices')) : Promise.resolve(null),
      getDocs(collection(db, 'rentals')),
      getDocs(collection(db, 'whitelist')),
      getDocs(collection(db, 'teachers')),
      getDocs(collection(db, 'approvers')),
    ]);

    if (hasDevicesField && curDevices) {
      const deviceIds = new Set(restoredDevices.map((dev) => dev.id));
      curDevices.forEach((d) => {
        if (!deviceIds.has(d.id)) {
          ops.push({ type: 'delete', path: ['devices', d.id] });
        }
      });
    }

    const rentalIds = new Set(restoredRentals.map((r) => r.id));
    curRentals.forEach((d) => {
      if (!rentalIds.has(d.id)) {
        ops.push({ type: 'delete', path: ['rentals', d.id] });
      }
    });

    const whitelistDocIds = new Set(
      restoredWhitelist.map((u) => getDocIdForEmail(u.email))
    );
    curWhitelist.forEach((d) => {
      const u = d.data() as Partial<WhitelistUser>;
      if (u?.email && isBuiltinAdmin(u.email)) return; // Never delete built-in admins
      if (!whitelistDocIds.has(d.id)) {
        ops.push({ type: 'delete', path: ['whitelist', d.id] });
      }
    });

    const teacherIds = new Set(restoredTeachers.map((t) => t.id));
    curTeachers.forEach((d) => {
      if (!teacherIds.has(d.id)) {
        ops.push({ type: 'delete', path: ['teachers', d.id] });
      }
    });

    const approverIds = new Set(restoredApprovers.map((a) => a.id));
    curApprovers.forEach((d) => {
      if (!approverIds.has(d.id)) {
        ops.push({ type: 'delete', path: ['approvers', d.id] });
      }
    });
  } catch (err) {
    console.warn('Could not read existing docs before restore batch:', err);
  }

  // 2. Queue set operations for snapshot data
  if (hasDevicesField) {
    restoredDevices.forEach((dev) => {
      if (dev && dev.id) {
        ops.push({ type: 'set', path: ['devices', dev.id], data: dev });
      }
    });
  }
  restoredRentals.forEach((r) => {
    if (r && r.id) {
      ops.push({ type: 'set', path: ['rentals', r.id], data: r });
    }
  });
  restoredWhitelist.forEach((u) => {
    if (u && u.email) {
      ops.push({
        type: 'set',
        path: ['whitelist', getDocIdForEmail(u.email)],
        data: u,
      });
    }
  });
  restoredTeachers.forEach((t) => {
    if (t && t.id) {
      ops.push({ type: 'set', path: ['teachers', t.id], data: t });
    }
  });
  restoredApprovers.forEach((a) => {
    if (a && a.id) {
      ops.push({ type: 'set', path: ['approvers', a.id], data: a });
    }
  });

  // 3. Synchronize localStorage caches immediately so listeners reflect restored state cleanly
  if (hasDevicesField) {
    writeLocalJson(LOCAL_DEVICES_KEY, restoredDevices);
  }
  writeLocalJson(LOCAL_RENTALS_KEY, restoredRentals.slice(0, 200));
  writeLocalJson(LOCAL_WHITELIST_KEY, restoredWhitelist);
  writeLocalJson(LOCAL_TEACHERS_KEY, restoredTeachers);
  writeLocalJson(LOCAL_APPROVERS_KEY, restoredApprovers);

  // 4. Execute Firestore write batches
  await commitOperationsInBatches(ops);

  const restoredPayload: BackupPayloadData = {
    ...(hasDevicesField ? { devices: restoredDevices } : {}),
    rentals: restoredRentals,
    whitelist: restoredWhitelist,
    teachers: restoredTeachers,
    approvers: restoredApprovers,
  };

  // Notify app state immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tabzone-backup-restored', { detail: restoredPayload })
    );
  }

  // 5. Record restore audit log (do NOT trigger auto-backup)
  await createAuditLog(
    operator,
    '백업 복원',
    `[${backup.backupType === 'manual' ? '수동 영구 스냅샷' : '자동 순환 백업'}] (${new Date(
      backup.createdAt
    ).toLocaleString('ko-KR')}) 시점으로 데이터 복원 실행`,
    `복원 내역: ${hasDevicesField ? `기기 ${restoredDevices.length}대, ` : ''}대여·반납 ${restoredRentals.length}건, 화이트리스트 ${restoredWhitelist.length}명, 교사 ${restoredTeachers.length}명, 승인자 ${restoredApprovers.length}명`
  );

  return restoredPayload;
}

/**
 * Delete a specific backup snapshot (manual or auto)
 */
export async function deleteBackupSnapshot(
  operator: { uid: string; email: string },
  backup: BackupRecord
): Promise<void> {
  const updatedLocal = getLocalBackups().filter((b) => b.id !== backup.id);
  notifyAllBackups(updatedLocal);

  try {
    await deleteDoc(doc(db, BACKUPS_COLLECTION, backup.id));
  } catch (err) {
    console.warn('Firestore deleteBackupSnapshot notice:', err);
  }

  await createAuditLog(
    operator,
    '백업 스냅샷 삭제',
    `${backup.backupType === 'manual' ? '수동 영구 스냅샷' : '자동 백업'} 삭제 (${new Date(
      backup.createdAt
    ).toLocaleString('ko-KR')})`,
    `삭제 ID: ${backup.id}, 실행자: ${operator.email}`
  );
}

/**
 * Format helper for Excel filenames
 */
function formatFileTimestamp(isoOrDate?: string | Date): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  const y = valid.getFullYear();
  const m = String(valid.getMonth() + 1).padStart(2, '0');
  const day = String(valid.getDate()).padStart(2, '0');
  const hh = String(valid.getHours()).padStart(2, '0');
  const mm = String(valid.getMinutes()).padStart(2, '0');
  return `${y}${m}${day}_${hh}${mm}`;
}

/**
 * Export backup payload (live or snapshot) as multi-sheet .xlsx file
 */
export function exportBackupPayloadToExcel(
  payload: BackupPayloadData,
  meta?: { label?: string; createdAt?: string; version?: string; auditLogsExcludedCount?: number }
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = [
    {
      항목: '백업 유형/라벨',
      값: meta?.label || '현재 라이브 데이터 전체 백업',
    },
    {
      항목: '생성 일시',
      값: meta?.createdAt
        ? new Date(meta.createdAt).toLocaleString('ko-KR')
        : new Date().toLocaleString('ko-KR'),
    },
    { 항목: '앱 버전', 값: meta?.version || APP_VERSION },
    { 항목: '등록 태블릿 기기리스트 수', 값: `${payload.devices?.length || 0}대` },
    { 항목: '대여/반납 내역 수', 값: `${payload.rentals.length}건` },
    { 항목: '화이트리스트 교직원 수', 값: `${payload.whitelist.length}명` },
    { 항목: '등록 담당 교사 수', 값: `${payload.teachers.length}명` },
    { 항목: '대여/반납 승인자 수', 값: `${payload.approvers.length}명` },
    {
      항목: '보안 감사 로그 (auditLogs)',
      값:
        typeof meta?.auditLogsExcludedCount === 'number'
          ? `${meta.auditLogsExcludedCount}건 (용량 최적화 정책으로 백업 제외됨)`
          : '용량 최적화 정책으로 백업 제외됨',
    },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, '백업_요약');

  // Sheet 2: Tablet Devices List
  const deviceRows = (payload.devices || []).map((d, idx) => ({
    번호: idx + 1,
    보관함: d.cartName,
    슬롯번호: d.slotNumber,
    관리번호: d.assetNumber,
    모델명: d.modelName,
    시리얼번호: d.serialNumber || '',
    상태: d.status,
    비고: d.notes || '',
    최종수정일시: d.updatedAt ? new Date(d.updatedAt).toLocaleString('ko-KR') : '',
    수정자: d.updatedBy || '',
    ID: d.id,
  }));
  const wsDevices = XLSX.utils.json_to_sheet(
    deviceRows.length > 0 ? deviceRows : [{ 안내: '데이터 없음' }]
  );
  XLSX.utils.book_append_sheet(wb, wsDevices, '기기리스트');

  // Sheet 2: Rentals
  const rentalRows = payload.rentals.map((r, idx) => ({
    번호: idx + 1,
    상태: r.status,
    보관함: formatCartName(r.cartUsed),
    수량: r.quantity,
    학년반: r.gradeClass,
    교시: r.period,
    담당교사: r.teacherName,
    수령자_학생대표: r.studentRep,
    대여승인자: r.approver,
    대여일시: r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '',
    반납승인자: r.returnApprover || '',
    반납일시: r.returnedAt ? new Date(r.returnedAt).toLocaleString('ko-KR') : '',
    반납비고: r.returnNotes || '',
    ID: r.id,
  }));
  const wsRentals = XLSX.utils.json_to_sheet(
    rentalRows.length > 0 ? rentalRows : [{ 안내: '데이터 없음' }]
  );
  XLSX.utils.book_append_sheet(wb, wsRentals, '대여_반납_내역');

  // Sheet 3: Whitelist
  const whitelistRows = payload.whitelist.map((u, idx) => ({
    번호: idx + 1,
    이메일: u.email,
    성명: u.name,
    권한: u.role === 'superadmin' ? '슈퍼관리자' : '관리자',
    소속부서: u.department,
    등록일시: u.createdAt ? new Date(u.createdAt).toLocaleString('ko-KR') : '',
    등록자: u.addedBy,
  }));
  const wsWhitelist = XLSX.utils.json_to_sheet(
    whitelistRows.length > 0 ? whitelistRows : [{ 안내: '데이터 없음' }]
  );
  XLSX.utils.book_append_sheet(wb, wsWhitelist, '화이트리스트');

  // Sheet 4: Teachers & Approvers
  const staffRows = [
    ...payload.teachers.map((t) => ({
      구분: '담당 교사',
      성명: t.name,
      교과_직책: t.subject,
      등록일시: t.createdAt ? new Date(t.createdAt).toLocaleString('ko-KR') : '',
      등록자: t.addedBy,
    })),
    ...payload.approvers.map((a) => ({
      구분: '대여 승인자',
      성명: a.name,
      교과_직책: a.position,
      등록일시: a.createdAt ? new Date(a.createdAt).toLocaleString('ko-KR') : '',
      등록자: a.addedBy,
    })),
  ];
  const wsStaff = XLSX.utils.json_to_sheet(
    staffRows.length > 0 ? staffRows : [{ 안내: '데이터 없음' }]
  );
  XLSX.utils.book_append_sheet(wb, wsStaff, '교사_승인자');

  const stamp = formatFileTimestamp(meta?.createdAt);
  const filePrefix = meta?.label ? 'TabZone_스냅샷백업' : 'TabZone_전체백업';
  XLSX.writeFile(wb, `${filePrefix}_${stamp}.xlsx`);
}
