import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WhitelistUser } from '../types';
import { createAuditLog } from './auditService';
import { SUPER_ADMIN_EMAIL } from './authService';

const WHITELIST_COLLECTION = 'whitelist';
const LOCAL_STORAGE_WHITELIST_KEY = 'tabzone_whitelist_cache';

export function getDocIdForEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

// Local cache helper
function getLocalWhitelist(): WhitelistUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WHITELIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore parse errors
  }
  return [];
}

function saveLocalWhitelist(users: WhitelistUser[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(users));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Subscribe to whitelist in real-time with local storage fallback
 */
export function subscribeToWhitelist(
  callback: (users: WhitelistUser[]) => void
): () => void {
  // 1. Immediately emit cached data so UI is never blank
  const cached = getLocalWhitelist();
  const ensureSuper = (list: WhitelistUser[]): WhitelistUser[] => {
    const result = [...list];
    const hasSuper = result.some(
      (u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    );
    if (!hasSuper) {
      result.unshift({
        email: SUPER_ADMIN_EMAIL,
        name: '슈퍼관리자 (교육정보부)',
        role: 'superadmin',
        department: '교육정보부 총괄',
        createdAt: new Date().toISOString(),
        addedBy: '시스템 영구 보존',
      });
    }
    return result;
  };

  callback(ensureSuper(cached));

  // 2. Real-time Firestore subscription
  try {
    const q = query(collection(db, WHITELIST_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users: WhitelistUser[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as WhitelistUser);
        });

        // Sort descending by createdAt
        users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        const finalList = ensureSuper(users);
        saveLocalWhitelist(finalList);
        callback(finalList);
      },
      (error) => {
        console.warn('Firestore whitelist subscription notice, using local cache:', error);
        callback(ensureSuper(getLocalWhitelist()));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach whitelist listener, using local cache:', err);
    return () => {};
  }
}

/**
 * Add a new teacher to whitelist
 */
export async function addWhitelistUser(
  operator: { uid: string; email: string },
  newUser: {
    email: string;
    name: string;
    department: string;
    role?: 'admin' | 'superadmin';
  }
): Promise<void> {
  const normalizedEmail = newUser.email.trim().toLowerCase();
  const docId = getDocIdForEmail(normalizedEmail);
  const docRef = doc(db, WHITELIST_COLLECTION, docId);

  const userData: WhitelistUser = {
    email: normalizedEmail,
    name: newUser.name.trim(),
    department: newUser.department.trim() || '교무실',
    role: newUser.role || 'admin',
    createdAt: new Date().toISOString(),
    addedBy: operator.email,
  };

  // Immediate local update so user sees it instantly
  const currentLocal = getLocalWhitelist().filter(
    (u) => u.email.toLowerCase() !== normalizedEmail
  );
  currentLocal.unshift(userData);
  saveLocalWhitelist(currentLocal);

  // Firestore sync
  try {
    await setDoc(docRef, userData);
  } catch (error) {
    console.warn('Firestore setDoc notice for whitelist, stored in local cache:', error);
  }

  // Record Audit Log
  await createAuditLog(
    operator,
    '화이트리스트 등록',
    `교직원 계정 등록 (${userData.name} / ${userData.email})`,
    `권한: ${userData.role}, 부서: ${userData.department}`
  );
}

/**
 * Delete teacher from whitelist (averver100@gmail.com is permanently preserved)
 */
export async function removeWhitelistUser(
  operator: { uid: string; email: string },
  emailToRemove: string
): Promise<void> {
  const normalizedEmail = emailToRemove.trim().toLowerCase();

  // Protect Superadmin permanently
  if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('슈퍼어드민 계정(averver100@gmail.com)은 시스템 보안을 위해 삭제할 수 없습니다.');
  }

  const docId = getDocIdForEmail(normalizedEmail);
  const docRef = doc(db, WHITELIST_COLLECTION, docId);

  // Immediate local update
  const updatedLocal = getLocalWhitelist().filter(
    (u) => u.email.toLowerCase() !== normalizedEmail
  );
  saveLocalWhitelist(updatedLocal);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore deleteDoc notice for whitelist, updated in local cache:', error);
  }

  // Record Audit Log
  await createAuditLog(
    operator,
    '화이트리스트 삭제',
    `교직원 계정 접근 권한 해제 (${normalizedEmail})`,
    `삭제 실행자: ${operator.email}`
  );
}
