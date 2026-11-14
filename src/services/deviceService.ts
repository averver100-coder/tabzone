import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeviceStatus, TabletDevice } from '../types';
import { createAuditLog } from './auditService';
import { triggerAutoBackupIfNeeded } from './backupService';

const DEVICES_COLLECTION = 'devices';
const LOCAL_STORAGE_DEVICES_KEY = 'tabzone_devices_cache';
const DEVICES_SEEDED_KEY = 'tabzone_devices_seeded_v1';

export function compareDevices(a: TabletDevice, b: TabletDevice): number {
  if (a.cartName !== b.cartName) {
    return a.cartName === '보관함 1' ? -1 : 1;
  }
  if ((a.slotNumber || 0) !== (b.slotNumber || 0)) {
    return (a.slotNumber || 0) - (b.slotNumber || 0);
  }
  return (a.assetNumber || '').localeCompare(b.assetNumber || '', 'ko');
}

function buildDefaultDevices(): TabletDevice[] {
  const now = new Date().toISOString();
  const list: TabletDevice[] = [];

  (['보관함 1', '보관함 2'] as const).forEach((cartName, cartIdx) => {
    const cartPrefix = cartIdx === 0 ? 'TAB1' : 'TAB2';
    const idPrefix = cartIdx === 0 ? 'dev_cart1' : 'dev_cart2';
    for (let slot = 1; slot <= 30; slot++) {
      const padded = String(slot).padStart(2, '0');
      list.push({
        id: `${idPrefix}_${padded}`,
        cartName,
        slotNumber: slot,
        assetNumber: `${cartPrefix}-${padded}`,
        modelName: 'Galaxy Tab S6 Lite',
        serialNumber: '',
        status: '정상',
        notes: '',
        createdAt: now,
        updatedAt: now,
        updatedBy: '시스템 기본 등록',
      });
    }
  });

  return list.sort(compareDevices);
}

function getLocalDevices(): TabletDevice[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DEVICES_KEY);
    if (raw !== null) {
      const parsed: TabletDevice[] = JSON.parse(raw);
      return Array.isArray(parsed) ? [...parsed].sort(compareDevices) : [];
    }
  } catch {
    // Ignore error
  }
  return [];
}

function saveLocalDevices(devices: TabletDevice[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEVICES_KEY, JSON.stringify(devices));
  } catch {
    // Ignore error
  }
}

const deviceListeners = new Set<(devices: TabletDevice[]) => void>();

function notifyAllDevices(devices: TabletDevice[]) {
  const sorted = [...devices].sort(compareDevices);
  saveLocalDevices(sorted);
  deviceListeners.forEach((listener) => {
    try {
      listener(sorted);
    } catch (e) {
      console.error('Error notifying device listener:', e);
    }
  });
}

let isSeedingInFlight = false;

async function seedDefaultDevicesToFirestore(): Promise<TabletDevice[]> {
  if (isSeedingInFlight) return getLocalDevices();
  isSeedingInFlight = true;
  try {
    const defaults = buildDefaultDevices();
    notifyAllDevices(defaults);
    try {
      localStorage.setItem(DEVICES_SEEDED_KEY, '1');
    } catch {
      // Ignore
    }

    const batch = writeBatch(db);
    defaults.forEach((dev) => {
      batch.set(doc(db, DEVICES_COLLECTION, dev.id), dev);
    });
    await batch.commit();
    return defaults;
  } catch (err) {
    console.warn('Default tablet devices Firestore seed notice:', err);
    return getLocalDevices();
  } finally {
    isSeedingInFlight = false;
  }
}

/**
 * Subscribe to tablet device list in real-time with local cache fallback
 */
export function subscribeToDevices(
  callback: (devices: TabletDevice[]) => void
): () => void {
  deviceListeners.add(callback);

  const initialLocal = getLocalDevices();
  callback(initialLocal);

  let unsubscribeFirestore = () => {};
  try {
    const q = query(collection(db, DEVICES_COLLECTION));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          let alreadySeeded = false;
          try {
            alreadySeeded = Boolean(localStorage.getItem(DEVICES_SEEDED_KEY));
          } catch {
            alreadySeeded = false;
          }

          if (!alreadySeeded && getLocalDevices().length === 0) {
            seedDefaultDevicesToFirestore().catch(() => {});
            return;
          }
        }

        const devicesMap = new Map<string, TabletDevice>();
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as TabletDevice;
          if (item && item.id) {
            devicesMap.set(item.id, item);
          }
        });

        try {
          if (devicesMap.size > 0) {
            localStorage.setItem(DEVICES_SEEDED_KEY, '1');
          }
        } catch {
          // Ignore
        }

        notifyAllDevices(Array.from(devicesMap.values()));
      },
      (error) => {
        console.warn('Firestore devices subscription notice, using local cache:', error);
        const cached = getLocalDevices();
        if (cached.length === 0) {
          const defaults = buildDefaultDevices();
          notifyAllDevices(defaults);
        } else {
          callback(cached);
        }
      }
    );
  } catch (err) {
    console.warn('Failed to attach devices listener, using local cache:', err);
  }

  return () => {
    deviceListeners.delete(callback);
    unsubscribeFirestore();
  };
}

/**
 * Add a new tablet device
 */
export async function addDevice(
  operator: { uid: string; email: string },
  input: {
    cartName: '보관함 1' | '보관함 2';
    slotNumber: number;
    assetNumber: string;
    modelName: string;
    serialNumber?: string;
    status: DeviceStatus;
    notes?: string;
  }
): Promise<TabletDevice> {
  const id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const device: TabletDevice = {
    id,
    cartName: input.cartName,
    slotNumber: Math.max(1, Math.min(999, Number(input.slotNumber) || 1)),
    assetNumber: input.assetNumber.trim().slice(0, 50),
    modelName: (input.modelName.trim() || 'Galaxy Tab S6 Lite').slice(0, 100),
    serialNumber: (input.serialNumber || '').trim().slice(0, 100),
    status: input.status || '정상',
    notes: (input.notes || '').trim().slice(0, 300),
    createdAt: now,
    updatedAt: now,
    updatedBy: operator.email,
  };

  const next = [...getLocalDevices().filter((d) => d.id !== id), device];
  notifyAllDevices(next);

  try {
    await setDoc(doc(db, DEVICES_COLLECTION, id), device);
  } catch (err) {
    console.warn('Firestore addDevice notice, stored locally:', err);
  }

  await createAuditLog(
    operator,
    '기기 등록',
    `[${device.cartName}] ${device.assetNumber} (${device.modelName}) 등록`,
    `슬롯 ${device.slotNumber}번, 상태: ${device.status}`
  );

  triggerAutoBackupIfNeeded(operator, `기기 등록 (${device.assetNumber})`).catch(() => {});

  return device;
}

/**
 * Update an existing tablet device
 */
export async function updateDevice(
  operator: { uid: string; email: string },
  originalDevice: TabletDevice,
  updates: {
    cartName: '보관함 1' | '보관함 2';
    slotNumber: number;
    assetNumber: string;
    modelName: string;
    serialNumber?: string;
    status: DeviceStatus;
    notes?: string;
  }
): Promise<TabletDevice> {
  const updated: TabletDevice = {
    ...originalDevice,
    cartName: updates.cartName,
    slotNumber: Math.max(1, Math.min(999, Number(updates.slotNumber) || 1)),
    assetNumber: updates.assetNumber.trim().slice(0, 50),
    modelName: (updates.modelName.trim() || 'Galaxy Tab S6 Lite').slice(0, 100),
    serialNumber: (updates.serialNumber || '').trim().slice(0, 100),
    status: updates.status,
    notes: (updates.notes || '').trim().slice(0, 300),
    updatedAt: new Date().toISOString(),
    updatedBy: operator.email,
  };

  const next = getLocalDevices().map((d) => (d.id === originalDevice.id ? updated : d));
  notifyAllDevices(next);

  try {
    await setDoc(doc(db, DEVICES_COLLECTION, updated.id), updated, { merge: true });
  } catch (err) {
    console.warn('Firestore updateDevice notice, stored locally:', err);
  }

  await createAuditLog(
    operator,
    '기기 정보 수정',
    `[${updated.cartName}] ${updated.assetNumber} 상태/정보 수정 (${updated.status})`,
    `모델: ${updated.modelName}, 슬롯: ${updated.slotNumber}번${updated.notes ? `, 비고: ${updated.notes}` : ''}`
  );

  triggerAutoBackupIfNeeded(operator, `기기 정보 수정 (${updated.assetNumber})`).catch(() => {});

  return updated;
}

/**
 * Delete a tablet device
 */
export async function removeDevice(
  operator: { uid: string; email: string },
  device: TabletDevice
): Promise<void> {
  const next = getLocalDevices().filter((d) => d.id !== device.id);
  notifyAllDevices(next);

  try {
    await deleteDoc(doc(db, DEVICES_COLLECTION, device.id));
  } catch (err) {
    console.warn('Firestore removeDevice notice, deleted locally:', err);
  }

  await createAuditLog(
    operator,
    '기기 삭제',
    `[${device.cartName}] ${device.assetNumber} 기기 삭제`,
    `삭제자: ${operator.email}`
  );

  triggerAutoBackupIfNeeded(operator, `기기 삭제 (${device.assetNumber})`).catch(() => {});
}

/**
 * Reset/seed standard 60 tablets manually if requested by admin
 */
export async function resetDefault60Devices(
  operator: { uid: string; email: string }
): Promise<TabletDevice[]> {
  const defaults = await seedDefaultDevicesToFirestore();
  await createAuditLog(
    operator,
    '기본 기기리스트 초기화',
    '보관함 1·2 기본 60대 기기리스트 생성/복구',
    `실행자: ${operator.email}`
  );
  triggerAutoBackupIfNeeded(operator, '기본 60대 기기리스트 초기화').catch(() => {});
  return defaults;
}
