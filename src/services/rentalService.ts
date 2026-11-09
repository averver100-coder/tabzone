import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartCapacity, CartType, Rental, RentalStatus } from '../types';
import { createAuditLog } from './auditService';

export const CART_CAPACITY = 30; // 30 tablets each for A and B cart (Total 60)
const RENTALS_COLLECTION = 'rentals';
const LOCAL_STORAGE_RENTALS_KEY = 'tabzone_rentals_cache';

function getLocalRentals(): Rental[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RENTALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore error
  }
  return [];
}

function saveLocalRentals(rentals: Rental[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_RENTALS_KEY, JSON.stringify(rentals.slice(0, 200)));
  } catch (e) {
    // Ignore error
  }
}

const rentalListeners = new Set<(rentals: Rental[]) => void>();

function notifyAllRentals(rentals: Rental[]) {
  saveLocalRentals(rentals);
  rentalListeners.forEach((listener) => {
    try {
      listener(rentals);
    } catch (e) {
      console.error('Error notifying rental listener:', e);
    }
  });
}

/**
 * Subscribe to all rentals in real-time with local storage fallback
 */
export function subscribeToRentals(
  callback: (rentals: Rental[]) => void
): () => void {
  rentalListeners.add(callback);

  // 1. Immediately emit local cached rentals
  callback(getLocalRentals());

  // 2. Real-time Firestore subscription
  let unsubscribeFirestore = () => {};
  try {
    const q = query(
      collection(db, RENTALS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreMap = new Map<string, Rental>();
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as Rental;
          if (item && item.id) {
            firestoreMap.set(item.id, item);
          }
        });

        // Merge with local cached rentals so that freshly created offline/optimistic items are preserved
        const localList = getLocalRentals();
        localList.forEach((r) => {
          if (!firestoreMap.has(r.id)) {
            firestoreMap.set(r.id, r);
          }
        });

        const merged = Array.from(firestoreMap.values()).sort((a, b) => {
          const tA = new Date(a.createdAt).getTime() || 0;
          const tB = new Date(b.createdAt).getTime() || 0;
          return tB - tA;
        });

        notifyAllRentals(merged);
      },
      (error) => {
        console.warn('Firestore rentals subscription notice, using local cache:', error);
        notifyAllRentals(getLocalRentals());
      }
    );
  } catch (err) {
    console.warn('Failed to attach rentals listener, using local cache:', err);
  }

  return () => {
    rentalListeners.delete(callback);
    unsubscribeFirestore();
  };
}

/**
 * Calculate available capacity for A and B storage units
 */
export function calculateCartCapacities(rentals: Rental[]): {
  cartA: CartCapacity;
  cartB: CartCapacity;
  totalAvailable: number;
} {
  const activeRentals = rentals.filter((r) => r.status === '대여 중');

  const rentedA = activeRentals
    .filter((r) => r.cartUsed === '보관함 1' || r.cartUsed === 'A보관함')
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  const rentedB = activeRentals
    .filter((r) => r.cartUsed === '보관함 2' || r.cartUsed === 'B보관함')
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  const availableA = Math.max(0, CART_CAPACITY - rentedA);
  const availableB = Math.max(0, CART_CAPACITY - rentedB);

  return {
    cartA: {
      total: CART_CAPACITY,
      rented: rentedA,
      available: availableA,
    },
    cartB: {
      total: CART_CAPACITY,
      rented: rentedB,
      available: availableB,
    },
    totalAvailable: availableA + availableB,
  };
}

/**
 * Determine recommended storage unit (Cart) based on last rental (Alternating usage)
 */
export function getRecommendedCart(rentals: Rental[]): CartType {
  if (!rentals || rentals.length === 0) {
    return '보관함 1';
  }

  // Look at the latest rental (sorted by createdAt desc)
  const lastRental = rentals[0];
  if (lastRental && (lastRental.cartUsed === '보관함 1' || lastRental.cartUsed === 'A보관함')) {
    return '보관함 2';
  }
  return '보관함 1';
}

/**
 * Check if current time is after 16:30 (4:30 PM)
 */
export function isPastClosingTime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours > 16 || (hours === 16 && minutes >= 30);
}

/**
 * Register a new tablet rental
 */
export async function createRental(
  operator: { uid: string; email: string },
  data: {
    period: string;
    gradeClass: string;
    teacherName: string;
    studentRep: string;
    cartUsed: CartType;
    quantity: number;
    approver: string;
  }
): Promise<Rental> {
  const rentalId = 'rent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const docRef = doc(db, RENTALS_COLLECTION, rentalId);

  const newRental: Rental = {
    id: rentalId,
    createdAt: new Date().toISOString(),
    period: data.period.trim(),
    gradeClass: data.gradeClass.trim(),
    teacherName: data.teacherName.trim(),
    studentRep: data.studentRep.trim(),
    cartUsed: data.cartUsed,
    quantity: Math.min(30, Math.max(1, Number(data.quantity) || 20)),
    approver: data.approver.trim(),
    status: '대여 중',
    returnedAt: null,
    createdByEmail: operator.email,
  };

  // Immediate local cache update and broadcast
  const localList = getLocalRentals();
  const updatedList = [newRental, ...localList.filter((r) => r.id !== newRental.id)];
  notifyAllRentals(updatedList);

  try {
    await setDoc(docRef, newRental);
  } catch (error) {
    console.error('Firestore setDoc notice for rental, preserved locally:', error);
  }

  await createAuditLog(
    operator,
    '대여 등록',
    `${data.teacherName} 선생님 (${data.gradeClass}) ${data.cartUsed} ${newRental.quantity}대 대여`,
    `교시: ${data.period}, 승인: ${data.approver}, 수령학생: ${newRental.studentRep}`
  );

  return newRental;
}

/**
 * Process return for a rental with returnApprover and optional returnNotes
 */
export async function returnRental(
  operator: { uid: string; email: string },
  rental: Rental,
  returnData?: {
    returnApprover?: string;
    returnNotes?: string;
  }
): Promise<void> {
  const docRef = doc(db, RENTALS_COLLECTION, rental.id);
  const returnedAt = new Date().toISOString();
  const returnApprover = (returnData?.returnApprover || rental.approver || '').trim();
  const returnNotes = (returnData?.returnNotes || '').trim() || null;

  // Local update and broadcast
  const localList = getLocalRentals().map((r) =>
    r.id === rental.id
      ? {
          ...r,
          status: '반납 완료' as const,
          returnedAt,
          returnApprover,
          returnNotes,
          updatedByEmail: operator.email,
        }
      : r
  );
  notifyAllRentals(localList);

  try {
    await updateDoc(docRef, {
      status: '반납 완료',
      returnedAt: returnedAt,
      returnApprover: returnApprover,
      returnNotes: returnNotes,
      updatedByEmail: operator.email,
    });
  } catch (error) {
    console.warn('Firestore return updateDoc notice, updated locally:', error);
  }

  const memoText = returnNotes ? ` [비고: ${returnNotes}]` : '';
  await createAuditLog(
    operator,
    '반납 완료',
    `${rental.teacherName} 선생님 (${rental.gradeClass}) ${rental.cartUsed} ${rental.quantity}대 반납 확인${memoText}`,
    `반납시각: ${new Date(returnedAt).toLocaleTimeString('ko-KR')}, 대여승인자: ${rental.approver}, 반납승인자: ${returnApprover}${
      returnNotes ? `, 특이사항: ${returnNotes}` : ''
    }, 처리자: ${operator.email}`
  );
}

export interface RentalUpdateInput {
  period: string;
  gradeClass: string;
  teacherName: string;
  studentRep: string;
  cartUsed: CartType;
  quantity: number;
  approver: string;
  status: RentalStatus;
  returnedAt?: string | null;
  returnApprover?: string | null;
  returnNotes?: string | null;
}

/**
 * Update rental and/or return details by Admin / Superadmin
 */
export async function updateRentalRecord(
  operator: { uid: string; email: string },
  originalRental: Rental,
  updates: RentalUpdateInput
): Promise<Rental> {
  const docRef = doc(db, RENTALS_COLLECTION, originalRental.id);

  const isReturned = updates.status === '반납 완료';
  const resolvedReturnedAt = isReturned
    ? updates.returnedAt || originalRental.returnedAt || new Date().toISOString()
    : null;
  const resolvedReturnApprover = isReturned
    ? (updates.returnApprover || originalRental.returnApprover || updates.approver || '').trim()
    : null;
  const resolvedReturnNotes = isReturned
    ? (updates.returnNotes || '').trim() || null
    : null;

  const updatedRental: Rental = {
    ...originalRental,
    period: updates.period.trim(),
    gradeClass: updates.gradeClass.trim(),
    teacherName: updates.teacherName.trim(),
    studentRep: updates.studentRep.trim(),
    cartUsed: updates.cartUsed,
    quantity: Math.min(30, Math.max(1, Number(updates.quantity) || originalRental.quantity || 20)),
    approver: updates.approver.trim(),
    status: updates.status,
    returnedAt: resolvedReturnedAt,
    returnApprover: resolvedReturnApprover,
    returnNotes: resolvedReturnNotes,
    updatedByEmail: operator.email,
  };

  // Update local storage cache and notify subscribers immediately
  const localList = getLocalRentals().map((r) =>
    r.id === originalRental.id ? updatedRental : r
  );
  notifyAllRentals(localList);

  try {
    await setDoc(docRef, updatedRental, { merge: true });
  } catch (error) {
    console.warn('Firestore updateRentalRecord notice, updated locally:', error);
  }

  // Build human-readable diff for audit log
  const changes: string[] = [];
  if (originalRental.teacherName !== updatedRental.teacherName) {
    changes.push(`담당교사: ${originalRental.teacherName} → ${updatedRental.teacherName}`);
  }
  if (originalRental.gradeClass !== updatedRental.gradeClass) {
    changes.push(`학년반: ${originalRental.gradeClass} → ${updatedRental.gradeClass}`);
  }
  if (originalRental.period !== updatedRental.period) {
    changes.push(`교시: ${originalRental.period} → ${updatedRental.period}`);
  }
  if (originalRental.studentRep !== updatedRental.studentRep) {
    changes.push(`수령자: ${originalRental.studentRep} → ${updatedRental.studentRep}`);
  }
  if (originalRental.approver !== updatedRental.approver) {
    changes.push(`대여승인자: ${originalRental.approver} → ${updatedRental.approver}`);
  }
  if (originalRental.cartUsed !== updatedRental.cartUsed) {
    changes.push(`보관함: ${originalRental.cartUsed} → ${updatedRental.cartUsed}`);
  }
  if (originalRental.quantity !== updatedRental.quantity) {
    changes.push(`수량: ${originalRental.quantity}대 → ${updatedRental.quantity}대`);
  }
  if (originalRental.status !== updatedRental.status) {
    changes.push(`상태: ${originalRental.status} → ${updatedRental.status}`);
  }
  if ((originalRental.returnApprover || '') !== (updatedRental.returnApprover || '')) {
    changes.push(`반납승인자: ${originalRental.returnApprover || '-'} → ${updatedRental.returnApprover || '-'}`);
  }
  if ((originalRental.returnNotes || '') !== (updatedRental.returnNotes || '')) {
    changes.push(`반납비고: ${originalRental.returnNotes || '-'} → ${updatedRental.returnNotes || '-'}`);
  }
  if (
    isReturned &&
    originalRental.returnedAt !== updatedRental.returnedAt &&
    updatedRental.returnedAt
  ) {
    changes.push(
      `반납시각: ${new Date(updatedRental.returnedAt).toLocaleString('ko-KR')}`
    );
  }

  const changeDetails = changes.length > 0 ? changes.join(', ') : '기존 정보 재저장';

  await createAuditLog(
    operator,
    '대여/반납 수정',
    `${updatedRental.teacherName} 선생님 (${updatedRental.gradeClass}) 대여·반납 내역 수정`,
    `변경내역: [${changeDetails}], 수정자: ${operator.email}`
  );

  return updatedRental;
}

/**
 * Delete a rental record by Admin / Superadmin
 */
export async function deleteRentalRecord(
  operator: { uid: string; email: string },
  rental: Rental
): Promise<void> {
  const docRef = doc(db, RENTALS_COLLECTION, rental.id);

  const localList = getLocalRentals().filter((r) => r.id !== rental.id);
  notifyAllRentals(localList);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore deleteRentalRecord notice, removed locally:', error);
  }

  await createAuditLog(
    operator,
    '대여 기록 삭제',
    `${rental.teacherName} 선생님 (${rental.gradeClass}) ${rental.cartUsed} ${rental.quantity}대 기록 삭제`,
    `교시: ${rental.period}, 수령자: ${rental.studentRep}, 상태: ${rental.status}, 삭제자: ${operator.email}`
  );
}

