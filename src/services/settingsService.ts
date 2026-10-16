import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createAuditLog } from './auditService';

export interface OperatingHoursSchedule {
  mon: string; // "16:30"
  tue: string; // "16:30"
  wed: string; // "16:00"
  thu: string; // "16:00"
  fri: string; // "16:00"
  sat: string; // "16:00"
  sun: string; // "16:00"
  autoReleaseWakeLockOnClosing: boolean; // default true
}

export const DEFAULT_OPERATING_HOURS: OperatingHoursSchedule = {
  mon: '16:30',
  tue: '16:30',
  wed: '16:00',
  thu: '16:00',
  fri: '16:00',
  sat: '16:00',
  sun: '16:00',
  autoReleaseWakeLockOnClosing: true,
};

const SETTINGS_DOC_REF = doc(db, 'settings', 'operatingHours');
const LOCAL_STORAGE_HOURS_KEY = 'tabzone_operating_hours';

/**
 * Get cached operating hours schedule from localStorage or defaults
 */
export function getLocalOperatingHours(): OperatingHoursSchedule {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HOURS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_OPERATING_HOURS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse local operating hours, using default:', e);
  }
  return DEFAULT_OPERATING_HOURS;
}

/**
 * Save operating hours schedule to localStorage
 */
export function saveLocalOperatingHours(schedule: OperatingHoursSchedule) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HOURS_KEY, JSON.stringify(schedule));
  } catch (e) {
    console.warn('Failed to save operating hours to localStorage:', e);
  }
}

/**
 * Subscribe to real-time operating hours schedule updates from Firestore
 */
export function subscribeToOperatingHours(
  callback: (schedule: OperatingHoursSchedule) => void
): () => void {
  const localInitial = getLocalOperatingHours();
  callback(localInitial);

  return onSnapshot(
    SETTINGS_DOC_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<OperatingHoursSchedule>;
        const merged: OperatingHoursSchedule = { ...DEFAULT_OPERATING_HOURS, ...data };
        saveLocalOperatingHours(merged);
        callback(merged);
      } else {
        // Initialize doc in Firestore if missing
        setDoc(SETTINGS_DOC_REF, DEFAULT_OPERATING_HOURS, { merge: true }).catch(() => {});
        callback(DEFAULT_OPERATING_HOURS);
      }
    },
    (error) => {
      console.warn('Firestore operating hours subscription notice, using local cache:', error);
      callback(getLocalOperatingHours());
    }
  );
}

/**
 * Update operating hours schedule in Firestore and local storage
 */
export async function updateOperatingHours(
  schedule: OperatingHoursSchedule,
  updatedByEmail: string
): Promise<void> {
  saveLocalOperatingHours(schedule);

  try {
    await setDoc(SETTINGS_DOC_REF, schedule, { merge: true });
    await createAuditLog(
      { uid: updatedByEmail, email: updatedByEmail },
      'UPDATE_OPERATING_HOURS',
      '요일별 마감 시간 변경',
      `월/화: ${schedule.mon}/${schedule.tue}, 수/목/금: ${schedule.wed}/${schedule.thu}/${schedule.fri}`
    );
  } catch (e) {
    console.error('Failed to save operating hours schedule to Firestore:', e);
  }
}

/**
 * Get closing time HH:mm string for today's day of week
 */
export function getTodayClosingTime(schedule: OperatingHoursSchedule = getLocalOperatingHours()): string {
  const day = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  switch (day) {
    case 1:
      return schedule.mon || '16:30';
    case 2:
      return schedule.tue || '16:30';
    case 3:
      return schedule.wed || '16:00';
    case 4:
      return schedule.thu || '16:00';
    case 5:
      return schedule.fri || '16:00';
    case 6:
      return schedule.sat || '16:00';
    case 0:
    default:
      return schedule.sun || '16:00';
  }
}

/**
 * Check if the current time has passed today's closing time
 */
export function isPastClosingTime(schedule: OperatingHoursSchedule = getLocalOperatingHours()): boolean {
  const now = new Date();
  const closingTimeStr = getTodayClosingTime(schedule);
  const [targetH, targetM] = closingTimeStr.split(':').map(Number);

  const curH = now.getHours();
  const curM = now.getMinutes();

  if (curH > targetH) return true;
  if (curH === targetH && curM >= targetM) return true;
  return false;
}
