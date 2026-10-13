export type CartType = '보관함 1' | '보관함 2' | 'A보관함' | 'B보관함';

/**
 * Standardize cart name to '보관함 1' or '보관함 2'
 */
export const formatCartName = (cart?: string | null): '보관함 1' | '보관함 2' => {
  if (!cart) return '보관함 1';
  if (cart === 'B보관함' || cart === '보관함 2') return '보관함 2';
  return '보관함 1';
};

export type RentalStatus = '대여 중' | '반납 완료';
export type UserRole = 'superadmin' | 'admin' | 'guest';

export interface Rental {
  id: string;
  createdAt: string; // ISO String
  period: string; // 1교시 ~ 7교시, 방과후 등
  gradeClass: string; // 예: 2학년 3반
  teacherName: string; // 담당 교사 이름
  studentRep: string; // 학생 대표 이름 (필수 입력)
  cartUsed: CartType; // 보관함 1 / 보관함 2
  quantity: number; // 대여 수량 (1~30)
  approver: string; // 대여 승인자 (필수 선택)
  status: RentalStatus; // '대여 중' / '반납 완료'
  returnedAt: string | null; // 반납 일시
  returnApprover?: string | null; // 반납 승인자 (필수 선택/입력)
  returnNotes?: string | null; // 반납 확인 비고 (예: 1대 미반납, 파손 등 특수 상황 메모)
  createdByEmail: string;
  updatedByEmail?: string;
}

export interface WhitelistUser {
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  department: string;
  createdAt: string;
  addedBy: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
  addedBy: string;
}

export interface Approver {
  id: string;
  name: string;
  position: string;
  createdAt: string;
  addedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  action: string;
  summary: string;
  details?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isWhitelisted: boolean;
  department?: string;
}

export interface CartCapacity {
  total: number;
  rented: number;
  available: number;
}
