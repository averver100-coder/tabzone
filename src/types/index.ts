export type CartType = 'A보관함' | 'B보관함';
export type RentalStatus = '대여 중' | '반납 완료';
export type UserRole = 'superadmin' | 'admin' | 'guest';

export interface Rental {
  id: string;
  createdAt: string; // ISO String
  period: string; // 1교시 ~ 7교시, 방과후 등
  gradeClass: string; // 예: 2학년 3반
  teacherName: string; // 담당 교사 이름
  studentRep: string; // 학생 대표 이름 (필수 입력)
  cartUsed: CartType; // A보관함 / B보관함
  quantity: number; // 대여 수량 (1~30)
  approver: string; // 대여 승인자 (필수 선택)
  status: RentalStatus; // '대여 중' / '반납 완료'
  returnedAt: string | null; // 반납 일시
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
