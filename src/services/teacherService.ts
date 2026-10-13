import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Teacher } from '../types';
import { createAuditLog } from './auditService';

const TEACHERS_COLLECTION = 'teachers';
const LOCAL_STORAGE_TEACHERS_KEY = 'tabzone_teachers_cache';
const INITIALIZED_FLAG_KEY = 'tabzone_teachers_seeded_v1';

function getLocalTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEACHERS_KEY);
    if (raw !== null) {
      const parsed: Teacher[] = JSON.parse(raw);
      const seen = new Set<string>();
      return parsed.filter((t) => {
        const key = `${t.name?.trim()}__${t.subject?.trim()}`;
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

function saveLocalTeachers(teachers: Teacher[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEACHERS_KEY, JSON.stringify(teachers));
  } catch (e) {
    // Ignore error
  }
}

export function subscribeToTeachers(
  callback: (teachers: Teacher[]) => void
): () => void {
  // Immediately emit current local cache (can be empty array if user deleted all)
  callback(getLocalTeachers());

  try {
    const q = query(collection(db, TEACHERS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const teachersMap = new Map<string, Teacher>();
        snapshot.forEach((docSnap) => {
          const t = docSnap.data() as Teacher;
          if (t && t.id) {
            teachersMap.set(t.id, t);
          }
        });

        // Deduplicate also by name & subject to prevent any duplicate entries
        const uniqueTeachers: Teacher[] = [];
        const seen = new Set<string>();
        for (const t of teachersMap.values()) {
          const key = `${t.name?.trim()}__${t.subject?.trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTeachers.push(t);
          }
        }

        uniqueTeachers.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        saveLocalTeachers(uniqueTeachers);
        callback(uniqueTeachers);
      },
      (error) => {
        console.warn('Firestore teachers subscription notice, using local cache:', error);
        callback(getLocalTeachers());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach teachers listener, using local cache:', err);
    return () => {};
  }
}

export async function addTeacher(
  operator: { uid: string; email: string },
  newTeacher: { name: string; subject: string }
): Promise<Teacher> {
  const teacherId = 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const data: Teacher = {
    id: teacherId,
    name: newTeacher.name.trim(),
    subject: newTeacher.subject.trim() || '교과',
    createdAt: new Date().toISOString(),
    addedBy: operator.email,
  };

  const current = getLocalTeachers().filter(
    (t) => !(t.name.trim() === data.name.trim() && t.subject.trim() === data.subject.trim())
  );
  current.push(data);
  current.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  saveLocalTeachers(current);

  try {
    await setDoc(doc(db, TEACHERS_COLLECTION, teacherId), data);
  } catch (error) {
    console.warn('Firestore addTeacher notice:', error);
  }

  await createAuditLog(
    operator,
    '담당 교사 등록',
    `담당 교사 [${data.name} (${data.subject})] 등록`,
    `등록자: ${operator.email}`
  );

  return data;
}

export async function removeTeacher(
  operator: { uid: string; email: string },
  teacherId: string,
  teacherName: string
): Promise<void> {
  // 1. Remove from local storage immediately
  const current = getLocalTeachers().filter((t) => t.id !== teacherId);
  saveLocalTeachers(current);

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, TEACHERS_COLLECTION, teacherId));
  } catch (error) {
    console.warn('Firestore removeTeacher notice:', error);
  }

  // 3. Record in Audit Log
  await createAuditLog(
    operator,
    '담당 교사 삭제',
    `담당 교사 [${teacherName}] 삭제`,
    `삭제자: ${operator.email}`
  );
}
