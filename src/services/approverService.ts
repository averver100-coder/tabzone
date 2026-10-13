import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Approver } from '../types';
import { createAuditLog } from './auditService';

const APPROVERS_COLLECTION = 'approvers';
const LOCAL_STORAGE_APPROVERS_KEY = 'tabzone_approvers_cache';

function getLocalApprovers(): Approver[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_APPROVERS_KEY);
    if (raw !== null) {
      const parsed: Approver[] = JSON.parse(raw);
      const seen = new Set<string>();
      return parsed.filter((a) => {
        const key = `${a.name?.trim()}__${a.position?.trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  } catch (e) {
    // Ignore error
  }
  return [];
}

function saveLocalApprovers(approvers: Approver[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_APPROVERS_KEY, JSON.stringify(approvers));
  } catch (e) {
    // Ignore error
  }
}

export function subscribeToApprovers(
  callback: (approvers: Approver[]) => void
): () => void {
  // Immediately emit current local cache (can be empty array if user deleted all)
  callback(getLocalApprovers());

  try {
    const q = query(collection(db, APPROVERS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const approversMap = new Map<string, Approver>();
        snapshot.forEach((docSnap) => {
          const a = docSnap.data() as Approver;
          if (a && a.id) {
            approversMap.set(a.id, a);
          }
        });

        // Deduplicate by name & position
        const uniqueApprovers: Approver[] = [];
        const seen = new Set<string>();
        for (const a of approversMap.values()) {
          const key = `${a.name?.trim()}__${a.position?.trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueApprovers.push(a);
          }
        }

        saveLocalApprovers(uniqueApprovers);
        callback(uniqueApprovers);
      },
      (error) => {
        console.warn('Firestore approvers subscription notice, using local cache:', error);
        callback(getLocalApprovers());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach approvers listener, using local cache:', err);
    return () => {};
  }
}

export async function addApprover(
  operator: { uid: string; email: string },
  newApprover: { name: string; position: string }
): Promise<Approver> {
  const approverId = 'appr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const data: Approver = {
    id: approverId,
    name: newApprover.name.trim(),
    position: newApprover.position.trim() || '교육정보부',
    createdAt: new Date().toISOString(),
    addedBy: operator.email,
  };

  const current = getLocalApprovers().filter(
    (a) => !(a.name.trim() === data.name.trim() && a.position.trim() === data.position.trim())
  );
  current.push(data);
  saveLocalApprovers(current);

  try {
    await setDoc(doc(db, APPROVERS_COLLECTION, approverId), data);
  } catch (error) {
    console.warn('Firestore addApprover notice:', error);
  }

  await createAuditLog(
    operator,
    '대여 승인자 등록',
    `대여 승인자 [${data.name} (${data.position})] 등록`,
    `등록자: ${operator.email}`
  );

  return data;
}

export async function removeApprover(
  operator: { uid: string; email: string },
  approverId: string,
  approverName: string
): Promise<void> {
  // 1. Remove from local storage immediately
  const current = getLocalApprovers().filter((a) => a.id !== approverId);
  saveLocalApprovers(current);

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, APPROVERS_COLLECTION, approverId));
  } catch (error) {
    console.warn('Firestore removeApprover notice:', error);
  }

  // 3. Record in Audit Log
  await createAuditLog(
    operator,
    '대여 승인자 삭제',
    `대여 승인자 [${approverName}] 삭제`,
    `삭제자: ${operator.email}`
  );
}
