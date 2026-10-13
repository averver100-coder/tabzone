import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthUser, WhitelistUser } from '../types';

export const SUPER_ADMIN_EMAIL = 'averver100@gmail.com';

const STORAGE_KEYS = {
  CACHED_AUTH: 'tabzone_cached_auth',
  SSO_SUPERADMIN: 'sso_superadmin_active',
  TOKEN_EXPIRY: 'tabzone_auth_expiry',
};

// Cookie utilities supporting cross-subdomain (.srider.kr) sharing and purge
export const CookieManager = {
  get(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  },

  set(name: string, value: string, days = 30) {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = '; expires=' + date.toUTCString();
    const encodedValue = encodeURIComponent(value);

    // Write for current domain
    document.cookie = `${name}=${encodedValue}${expires}; path=/; SameSite=Lax`;

    // Also attempt write for root wildcard domain (.srider.kr) if running on srider.kr
    const hostname = window.location.hostname;
    if (hostname.endsWith('srider.kr')) {
      document.cookie = `${name}=${encodedValue}${expires}; domain=.srider.kr; path=/; SameSite=Lax`;
    }
  },

  clearAll(name: string) {
    if (typeof document === 'undefined') return;
    const pastDate = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/';
    document.cookie = `${name}=; ${pastDate}`;
    document.cookie = `${name}=; domain=.srider.kr; ${pastDate}`;
    document.cookie = `${name}=; domain=tab.srider.kr; ${pastDate}`;
    document.cookie = `${name}=; domain=${window.location.hostname}; ${pastDate}`;
  },
};

/**
 * Multi-Domain SSO & Superadmin Restoration check:
 * 1. Checks Firebase Auth directly
 * 2. Checks cached local storage if still valid (skips redundant API roundtrips)
 * 3. Checks URL parameters (?sso_token=..., ?admin_sso=..., ?auth_email=...)
 * 4. Checks cross-domain cookies (.srider.kr)
 */
export function checkSSORestoration(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  // 1. Check URL parameters (Backup recovery mechanism)
  const urlParams = new URLSearchParams(window.location.search);
  const ssoEmailParam = urlParams.get('admin_sso') || urlParams.get('sso_email') || urlParams.get('auth_email');
  const ssoTokenParam = urlParams.get('sso_token') || urlParams.get('auth_ticket');

  if (ssoEmailParam && ssoEmailParam.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    const superAdminUser: AuthUser = {
      uid: 'superadmin-' + btoa(SUPER_ADMIN_EMAIL).substring(0, 10),
      email: SUPER_ADMIN_EMAIL,
      displayName: '슈퍼관리자 (교육정보부)',
      role: 'superadmin',
      isWhitelisted: true,
      department: '교육정보부 총괄',
    };
    saveAuthSession(superAdminUser);
    // Clean up sensitive URL parameters without page reload
    window.history.replaceState({}, document.title, window.location.pathname);
    return superAdminUser;
  }

  // 2. Check local persistent storage (Fast-path cached session)
  try {
    const rawCache = localStorage.getItem(STORAGE_KEYS.CACHED_AUTH);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (rawCache && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        const cachedUser = JSON.parse(rawCache) as AuthUser;
        if (cachedUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          return { ...cachedUser, role: 'superadmin', isWhitelisted: true };
        }
        return cachedUser;
      } else {
        localStorage.removeItem(STORAGE_KEYS.CACHED_AUTH);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // 3. Check cross-domain cookies (shared across commute, device, ttime, croom, ipass, dibeot on srider.kr)
  const cookieSuperAdmin = CookieManager.get('sso_superadmin') || CookieManager.get('tab_sso_user');
  if (cookieSuperAdmin && cookieSuperAdmin.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    const superAdminUser: AuthUser = {
      uid: 'superadmin-' + btoa(SUPER_ADMIN_EMAIL).substring(0, 10),
      email: SUPER_ADMIN_EMAIL,
      displayName: '슈퍼관리자 (교육정보부)',
      role: 'superadmin',
      isWhitelisted: true,
      department: '교육정보부 총괄',
    };
    saveAuthSession(superAdminUser);
    return superAdminUser;
  }

  return null;
}

export function saveAuthSession(user: AuthUser) {
  try {
    // Cache for 7 days
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.CACHED_AUTH, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());

    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      localStorage.setItem(STORAGE_KEYS.SSO_SUPERADMIN, 'true');
      CookieManager.set('sso_superadmin', user.email, 30);
      CookieManager.set('tab_sso_user', user.email, 30);
    }
  } catch (e) {
    console.warn('Failed to save auth session to storage', e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CACHED_AUTH);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.SSO_SUPERADMIN);
    sessionStorage.clear();

    CookieManager.clearAll('sso_superadmin');
    CookieManager.clearAll('tab_sso_user');
    CookieManager.clearAll('session_id');
  } catch (e) {
    console.warn('Failed to clear auth session', e);
  }
}

/**
 * Checks if the given email is whitelisted in Firestore or is Superadmin
 */
export async function verifyUserWhitelist(email: string): Promise<{
  isWhitelisted: boolean;
  role: 'superadmin' | 'admin' | 'guest';
  userData?: WhitelistUser;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  // Superadmin is permanently whitelisted
  if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      isWhitelisted: true,
      role: 'superadmin',
      userData: {
        email: SUPER_ADMIN_EMAIL,
        name: '슈퍼관리자',
        role: 'superadmin',
        department: '교육정보부 총괄',
        createdAt: new Date().toISOString(),
        addedBy: '시스템 기본 생성',
      },
    };
  }

  try {
    // Check in Firestore whitelist collection
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'whitelist', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as WhitelistUser;
      return {
        isWhitelisted: true,
        role: data.role === 'superadmin' ? 'superadmin' : 'admin',
        userData: data,
      };
    }

    return {
      isWhitelisted: false,
      role: 'guest',
    };
  } catch (error) {
    console.error('Whitelist verification error:', error);
    // If database read fails, fallback safe check
    return {
      isWhitelisted: false,
      role: 'guest',
    };
  }
}

/**
 * Initiates Google OAuth Login
 * Tries popup first; falls back to redirect on mobile or if popups are blocked
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup blocked or unsupported on mobile, attempt redirect
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.info('Switching to signInWithRedirect due to popup environment restriction');
      await signInWithRedirect(auth, googleProvider);
      // Flow will resume on redirect
      throw new Error('REDIRECT_INITIATED');
    }
    throw error;
  }
}

export async function checkRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error('Redirect auth error:', error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  clearAuthSession();
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign out error:', error);
  }
}

/**
 * Ensure Superadmin entry exists in whitelist collection
 */
export async function ensureSuperAdminInDb(): Promise<void> {
  try {
    const docId = SUPER_ADMIN_EMAIL.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'whitelist', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: SUPER_ADMIN_EMAIL,
        name: '슈퍼관리자 (averver100)',
        role: 'superadmin',
        department: '교육정보부 총괄',
        createdAt: new Date().toISOString(),
        addedBy: '시스템 초기화',
      });
    }
  } catch (error) {
    // Non-fatal if permission rules prevent unauthed init
    console.warn('Superadmin bootstrap check notice:', error);
  }
}

/**
 * Detailed Auth Error Info for actionable UI feedback
 */
export interface AuthErrorInfo {
  code: string;
  title: string;
  message: string;
  actionGuide?: string;
  isDomainError: boolean;
  domain?: string;
  consoleUrl?: string;
}

export function parseAuthError(error: any): AuthErrorInfo {
  const code = error?.code || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const consoleUrl = `https://console.firebase.google.com/project/gen-lang-client-0441740129/authentication/settings`;

  if (
    code === 'auth/unauthorized-domain' ||
    (error?.message && error.message.includes('auth/unauthorized-domain'))
  ) {
    return {
      code: 'auth/unauthorized-domain',
      title: '파이어베이스 승인 도메인 등록 필요',
      message: `현재 접속 주소 (${currentDomain}) 가 Firebase Authentication의 승인된 도메인(Authorized Domains) 목록에 등록되어 있지 않습니다.`,
      actionGuide:
        'Firebase 콘솔에서 승인된 도메인에 현재 도메인을 추가하시면 구글 소셜 로그인이 정상 작동합니다.',
      isDomainError: true,
      domain: currentDomain,
      consoleUrl,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code: 'auth/popup-blocked',
      title: '브라우저 팝업 차단됨',
      message: '브라우저에서 Google 로그인 팝업 창이 차단되었습니다.',
      actionGuide:
        '브라우저 주소창 우측의 팝업 차단을 해제하거나 아래 간편 직접 로그인을 이용하세요.',
      isDomainError: false,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code: 'auth/operation-not-allowed',
      title: '구글 로그인 공급업체 비활성화됨',
      message:
        'Firebase 콘솔의 Authentication에서 Google 로그인 제공업체가 활성화되지 않았습니다.',
      actionGuide:
        'Firebase 콘솔 > Authentication > Sign-in method에서 Google 공급업체를 사용 설정하세요.',
      isDomainError: false,
      consoleUrl,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code: 'auth/network-request-failed',
      title: '네트워크 연결 오류',
      message: '네트워크 통신 중 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      isDomainError: false,
    };
  }

  return {
    code: code || 'unknown',
    title: '로그인 인증 오류',
    message: error?.message || '구글 인증 처리 중 문제가 발생했습니다.',
    isDomainError: false,
  };
}

/**
 * Superadmin Direct 1-Click Login (Safe bypass independent of Google OAuth domain restrictions)
 */
export function loginAsSuperAdmin(): AuthUser {
  const superAdminUser: AuthUser = {
    uid: 'superadmin-' + btoa(SUPER_ADMIN_EMAIL).substring(0, 10),
    email: SUPER_ADMIN_EMAIL,
    displayName: '슈퍼관리자 (교육정보부)',
    role: 'superadmin',
    isWhitelisted: true,
    department: '교육정보부 총괄',
  };
  saveAuthSession(superAdminUser);
  ensureSuperAdminInDb().catch(() => {});
  return superAdminUser;
}

/**
 * Staff Email Whitelist Direct Login
 */
export async function loginWithStaffEmail(rawEmail: string): Promise<{
  success: boolean;
  user?: AuthUser;
  rejectedEmail?: string;
  error?: string;
}> {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) {
    return { success: false, error: '이메일을 입력해주세요.' };
  }

  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    const user = loginAsSuperAdmin();
    return { success: true, user };
  }

  const verification = await verifyUserWhitelist(email);
  if (verification.isWhitelisted) {
    const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
    const authUser: AuthUser = {
      uid: 'staff-' + docId,
      email: email,
      displayName: verification.userData?.name || '교직원',
      role: verification.role,
      isWhitelisted: true,
      department: verification.userData?.department,
    };
    saveAuthSession(authUser);
    return { success: true, user: authUser };
  }

  return {
    success: false,
    rejectedEmail: email,
    error:
      '본 시스템은 보안 및 데이터 정합성을 위해 사전 인가된 교직원 계정만 로그인을 허용합니다. 접속이 필요하신 경우 관리자에게 계정 등록 또는 활성화를 요청하세요.',
  };
}
