import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog } from '../types';

const AUDIT_COLLECTION = 'audit_logs';
const LOCAL_STORAGE_AUDIT_KEY = 'tabzone_audit_logs_cache';

function getLocalAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore error
  }
  return [];
}

function saveLocalAuditLogs(logs: AuditLog[]) {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_AUDIT_KEY,
      JSON.stringify(logs.slice(0, 150))
    );
  } catch (e) {
    // Ignore error
  }
}

/**
 * Record an audit log entry
 */
export async function createAuditLog(
  user: { uid: string; email: string },
  action: string,
  summary: string,
  details?: string
): Promise<void> {
  const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newLog: AuditLog = {
    id: logId,
    userId: user.uid,
    userEmail: user.email,
    timestamp: new Date().toISOString(),
    action,
    summary,
    details: details || '',
  };

  // Immediate local update
  const currentLocal = getLocalAuditLogs();
  currentLocal.unshift(newLog);
  saveLocalAuditLogs(currentLocal);

  // Firestore sync
  try {
    const logDoc = doc(db, AUDIT_COLLECTION, logId);
    await setDoc(logDoc, newLog);
  } catch (error) {
    console.warn('Firestore audit log setDoc notice, recorded locally:', error);
  }
}

/**
 * Subscribe to recent audit logs in real-time
 */
export function subscribeToAuditLogs(
  callback: (logs: AuditLog[]) => void,
  maxEntries = 100
): () => void {
  // 1. Immediately emit local cached logs
  callback(getLocalAuditLogs());

  // 2. Real-time Firestore query
  try {
    const q = query(collection(db, AUDIT_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data() as AuditLog);
        });

        // Sort descending by timestamp
        logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

        const merged = logs.slice(0, maxEntries);
        saveLocalAuditLogs(merged);
        callback(merged);
      },
      (error) => {
        console.warn('Firestore audit logs subscription notice, using local cache:', error);
        callback(getLocalAuditLogs());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach audit log listener, using local cache:', err);
    return () => {};
  }
}
