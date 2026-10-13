-- Cloudflare D1 Database Schema for TabZone (tab.srider.kr)
-- 7th School IT Applet D1 Database

-- 1. Rentals Table
CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  period TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  student_rep TEXT NOT NULL,
  cart_used TEXT NOT NULL CHECK(cart_used IN ('A보관함', 'B보관함')),
  quantity INTEGER NOT NULL CHECK(quantity >= 1 AND quantity <= 30),
  approver TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('대여 중', '반납 완료')),
  returned_at TEXT,
  created_by_email TEXT NOT NULL,
  updated_by_email TEXT
);

CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON rentals(created_at DESC);

-- 2. Whitelist Table
CREATE TABLE IF NOT EXISTS whitelist (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('superadmin', 'admin')),
  department TEXT NOT NULL,
  created_at TEXT NOT NULL,
  added_by TEXT NOT NULL
);

INSERT OR IGNORE INTO whitelist (email, name, role, department, created_at, added_by)
VALUES ('averver100@gmail.com', '슈퍼관리자 (교육정보부)', 'superadmin', '교육정보부 총괄', datetime('now'), '시스템 영구 보존');

-- 3. Teachers Table (수업 책임 담당 교사 목록)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TEXT NOT NULL,
  added_by TEXT NOT NULL
);

-- 4. Approvers Table (대여 승인 교직원 목록)
CREATE TABLE IF NOT EXISTS approvers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TEXT NOT NULL,
  added_by TEXT NOT NULL
);

-- 5. Audit Logs Table (감사 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
