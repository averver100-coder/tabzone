import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartCapacity, CartType, Rental } from '../types';
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

/**
 * Subscribe to all rentals in real-time with local storage fallback
 */
export function subscribeToRentals(
  callback: (rentals: Rental[]) => void
): () => void {
  // 1. Immediately emit local cached rentals
  callback(getLocalRentals());

  // 2. Real-time Firestore subscription
  try {
    const q = query(
      collection(db, RENTALS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rentals: Rental[] = [];
        snapshot.forEach((docSnap) => {
          rentals.push(docSnap.data() as Rental);
        });
        saveLocalRentals(rentals);
        callback(rentals);
      },
      (error) => {
        console.warn('Firestore rentals subscription notice, using local cache:', error);
        callback(getLocalRentals());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach rentals listener, using local cache:', err);
    return () => {};
  }
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

  // Immediate local cache update
  const localList = getLocalRentals();
  localList.unshift(newRental);
  saveLocalRentals(localList);

  try {
    await setDoc(docRef, newRental);
  } catch (error) {
    console.warn('Firestore setDoc notice for rental, saved locally:', error);
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

  // Local update
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
  saveLocalRentals(localList);

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
