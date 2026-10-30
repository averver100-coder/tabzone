/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { onAuthStateChanged, User } from 'firebase/auth';
import {
  AlertTriangle,
  BarChart3,
  Building,
  CheckCircle,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Tablet,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { APP_VERSION } from './constants/version';
import { playRentalSuccessSound, playReturnSuccessSound } from './utils/sound';
import { AdminAnalyticsModal } from './components/AdminAnalyticsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { DashboardStatus } from './components/DashboardStatus';
import { Header } from './components/Header';
import { IdleSplashScreen } from './components/IdleSplashScreen';
import { LoginModal } from './components/LoginModal';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { RentalFormModal } from './components/RentalFormModal';
import { RentalList } from './components/RentalList';
import { WhitelistModal } from './components/WhitelistModal';
import { useIdleTimer } from './hooks/useIdleTimer';
import { auth, testFirestoreConnection } from './lib/firebase';
import {
  addApprover,
  removeApprover,
  subscribeToApprovers,
} from './services/approverService';
import { subscribeToAuditLogs } from './services/auditService';
import {
  AuthErrorInfo,
  checkRedirectAuth,
  checkSSORestoration,
  clearAuthSession,
  ensureBuiltinAdminsInDb,
  ensureSuperAdminInDb,
  isBuiltinAdmin,
  parseAuthError,
  saveAuthSession,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  signOutUser,
  SUPER_ADMIN_EMAIL,
  verifyUserWhitelist,
} from './services/authService';
import {
  calculateCartCapacities,
  createRental,
  getRecommendedCart,
  returnRental,
  subscribeToRentals,
} from './services/rentalService';
import {
  DEFAULT_OPERATING_HOURS,
} from './services/settingsService';
import {
  addTeacher,
  removeTeacher,
  subscribeToTeachers,
} from './services/teacherService';
import {
  addWhitelistUser,
  removeWhitelistUser,
  subscribeToWhitelist,
} from './services/whitelistService';
import {
  Approver,
  AuditLog,
  AuthUser,
  CartType,
  Rental,
  Teacher,
  WhitelistUser,
} from './types';

export default function App() {
  // Auth & User State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStatusText, setLoginStatusText] = useState<string>('');
  const [authError, setAuthError] = useState<AuthErrorInfo | string | null>(null);
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);

  // App Business State
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistUser[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  // Operating Hours State
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSubmittingRental, setIsSubmittingRental] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Inactivity Kiosk ScreenSaver (30s)
  const isAnyModalOpen =
    isRentalModalOpen ||
    isLoginModalOpen ||
    isWhitelistModalOpen ||
    isAuditLogsModalOpen ||
    isAnalyticsModalOpen;

  const { isIdle, setIsIdle, wakeUp } = useIdleTimer({
    timeoutMs: 30000,
    disabled: isAnyModalOpen,
  });

  // 1. App Startup: Connection test & SSO Restoration check
  useEffect(() => {
    testFirestoreConnection();
    ensureBuiltinAdminsInDb().catch(() => {});

    // Fast-path: Check cross-domain SSO, persistent storage cache, or URL ticket
    const ssoUser = checkSSORestoration();
    if (ssoUser) {
      setCurrentUser(ssoUser);
      setIsAuthLoading(false);
    }

    // Deduplication guard to avoid concurrent race between checkRedirectAuth & onAuthStateChanged
    let authHandledUid: string | null = null;
    const handleAuthOnce = async (u: User) => {
      if (!u || authHandledUid === u.uid) return;
      authHandledUid = u.uid;
      await handlePostAuthUser(u);
    };

    // Check redirect auth result (for mobile/tablet browsers or redirect login)
    checkRedirectAuth()
      .then(async (redirectUser) => {
        if (redirectUser) {
          setIsLoggingIn(true);
          setLoginStatusText('Google 리다이렉트 인증 완료, 권한 확인 중...');
          await handleAuthOnce(redirectUser);
        }
      })
      .catch((error) => {
        console.error('getRedirectResult error:', error);
        const msg = error?.message || '';
        const code = error?.code || '';
        if (code.includes('access-denied') || msg.includes('403') || code.includes('disallowed_useragent')) {
          setAuthError('Google 보안 정책(403 오류): 카카오톡이나 인앱 브라우저에서는 소셜 로그인이 제한됩니다. 기본 브라우저(Safari/Chrome)로 열어주세요.');
          setIsLoginModalOpen(true);
        } else if (code !== 'auth/popup-closed-by-user') {
          setAuthError('Google 리다이렉트 로그인 처리 중 오류가 발생했습니다: ' + (msg || code));
          setIsLoginModalOpen(true);
        }
      })
      .finally(() => {
        setIsLoggingIn(false);
        setLoginStatusText('');
      });

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await handleAuthOnce(firebaseUser);
      } else {
        authHandledUid = null;
        if (!ssoUser) {
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Smart Plug Power-Linked Screen Wake Lock
  // - Plugged In / Charging (Smart Plug ON): Keep screen awake continuously for kiosk use
  // - Unplugged / Discharging (Smart Plug OFF): Release Wake Lock immediately so Android screen timeout turns off screen natively
  useEffect(() => {
    let wakeLock: any = null;
    let isMounted = true;
    let isCharging = true; // Default until Battery API responds

    const releaseWakeLock = async () => {
      if (wakeLock && typeof wakeLock.release === 'function' && !wakeLock.released) {
        try {
          await wakeLock.release();
        } catch (_) {}
      }
      wakeLock = null;
    };

    const requestWakeLock = async () => {
      if (!isMounted) return;
      // If smart plug is OFF (not charging), do NOT hold wake lock
      if (!isCharging) {
        await releaseWakeLock();
        return;
      }

      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          if (!wakeLock || wakeLock.released) {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            if (wakeLock) {
              wakeLock.addEventListener('release', () => {
                wakeLock = null;
                if (isMounted && isCharging) {
                  setTimeout(requestWakeLock, 1000);
                }
              });
            }
          }
        } catch (err) {
          if (isMounted && isCharging) {
            setTimeout(requestWakeLock, 3000);
          }
        }
      }
    };

    // Monitor Battery Charging Status (Smart Plug ON/OFF detection)
    if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          if (!isMounted) return;
          isCharging = battery.charging;

          if (isCharging) {
            requestWakeLock();
          } else {
            releaseWakeLock();
          }

          const onChargingChange = () => {
            if (!isMounted) return;
            isCharging = battery.charging;
            if (isCharging) {
              requestWakeLock();
            } else {
              releaseWakeLock();
            }
          };

          battery.addEventListener('chargingchange', onChargingChange);
        })
        .catch(() => {
          // If Battery API is unavailable, maintain wake lock
          requestWakeLock();
        });
    } else {
      requestWakeLock();
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isCharging) {
        await requestWakeLock();
      }
    };

    const handleUserInteraction = () => {
      if (isCharging) {
        requestWakeLock();
      }
    };

    // Periodic heartbeat check: only maintain wake lock while smart plug is charging
    const periodicTimer = setInterval(() => {
      if (isCharging) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    }, 10000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      isMounted = false;
      releaseWakeLock();
      clearInterval(periodicTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // 2. Real-time Subscriptions (Rentals, Whitelist, Teachers, Approvers, Audit Logs, Operating Hours)
  useEffect(() => {
    const unsubRentals = subscribeToRentals((data) => {
      setRentals(data);
    });


    const unsubWhitelist = subscribeToWhitelist((users) => {
      setWhitelistUsers(users);
    });

    const unsubTeachers = subscribeToTeachers((teacherList) => {
      setTeachers(teacherList);
    });

    const unsubApprovers = subscribeToApprovers((approverList) => {
      setApprovers(approverList);
    });

    const unsubAudit = subscribeToAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    return () => {
      unsubRentals();
        unsubWhitelist();
      unsubTeachers();
      unsubApprovers();
      unsubAudit();
    };
  }, []);

  // Post-Authentication Handler with Whitelist Verification (Identical to devicecare)
  const handlePostAuthUser = async (user: User) => {
    const userEmail = (user.email || '').trim().toLowerCase();
    if (!userEmail) {
      await signOutUser();
      setAuthError('Google 계정에서 이메일 정보를 확인할 수 없습니다. 다시 시도해 주세요.');
      setIsLoginModalOpen(true);
      return;
    }

    // 1. Built-in Admin check (averver100@gmail.com, edutech@sangilmedia.hs.kr) -> Immediate Bypass!
    if (isBuiltinAdmin(userEmail)) {
      const isAverver = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();
      const adminUser: AuthUser = {
        uid: user.uid,
        email: userEmail,
        displayName:
          user.displayName ||
          (isAverver ? '최고 관리자 (averver100)' : '에듀테크 총괄관리자 (상일미디어고)'),
        photoURL: user.photoURL || undefined,
        role: 'superadmin',
        isWhitelisted: true,
        department: '교육정보부 총괄',
      };
      saveAuthSession(adminUser);
      setCurrentUser(adminUser);
      setAuthError(null);
      setRejectedEmail(null);
      setIsLoginModalOpen(false);
      ensureBuiltinAdminsInDb().catch(() => {});
      showToast(`${adminUser.displayName} 권한으로 로그인되었습니다.`);
      return;
    }

    // 2. Standard teacher whitelist check
    setLoginStatusText('Firestore 최신 서버 화이트리스트 인가 권한을 확인하는 중...');
    const verification = await verifyUserWhitelist(userEmail);
    if (verification.isWhitelisted) {
      const authUser: AuthUser = {
        uid: user.uid,
        email: userEmail,
        displayName: user.displayName || verification.userData?.name || userEmail.split('@')[0],
        photoURL: user.photoURL || undefined,
        role: verification.role,
        isWhitelisted: true,
        department: verification.userData?.department,
      };
      saveAuthSession(authUser);
      setCurrentUser(authUser);
      setAuthError(null);
      setRejectedEmail(null);
      setIsLoginModalOpen(false);
      showToast(`${authUser.displayName} 선생님 로그인 완료`);
    } else {
      // 3. Rejected: Not whitelisted -> Safe block & show exact devicecare notice
      await signOutUser();
      setCurrentUser(null);
      setRejectedEmail(userEmail);
      setIsLoginModalOpen(true);
      setAuthError(
        `승인되지 않은 Google 계정입니다 (${userEmail}). 화이트리스트에 등록된 인가 계정으로 로그인해 주세요.`
      );
    }
  };

  // Google Popup Login (devicecare logic)
  const handleGooglePopupLogin = async () => {
    setIsLoggingIn(true);
    setLoginStatusText('Google 계정 인증 창을 여는 중...');
    setAuthError(null);
    setRejectedEmail(null);
    try {
      const user = await signInWithGooglePopup();
      if (user) {
        setLoginStatusText('Firestore 최신 서버 화이트리스트 인가 권한을 확인하는 중...');
        await handlePostAuthUser(user);
      }
    } catch (err: any) {
      console.warn('Google Popup Login Notice:', err);
      setIsLoggingIn(false);
      setLoginStatusText('');
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user') {
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError(
          '브라우저에서 로그인 팝업 창이 차단되었습니다. 주소창의 팝업 차단을 해제하시거나 아래 [모바일/리다이렉트 로그인]을 이용해주세요.'
        );
        return;
      }
      if (msg.includes('403') || code.includes('disallowed_useragent')) {
        setAuthError(
          'Google 보안 정책(403): 인앱 브라우저에서는 로그인이 제한됩니다. 기본 브라우저(Safari/Chrome)로 열어주세요.'
        );
        return;
      }
      const parsed = parseAuthError(err);
      setAuthError(
        parsed.message ||
          'Google 로그인 창 연결 중 오류가 발생했습니다. 모바일 환경이거나 팝업이 차단된 경우 아래 [모바일/리다이렉트 로그인]을 이용하세요.'
      );
    } finally {
      setIsLoggingIn(false);
      setLoginStatusText('');
    }
  };

  // Google Redirect Login (devicecare logic)
  const handleGoogleRedirectLogin = async () => {
    setIsLoggingIn(true);
    setLoginStatusText('Google 로그인 페이지로 이동합니다...');
    setAuthError(null);
    setRejectedEmail(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect Login error:', err);
      setIsLoggingIn(false);
      setLoginStatusText('');
      const msg = err?.message || '';
      if (msg.includes('403')) {
        setAuthError(
          'Google 보안 정책(403): 인앱 브라우저에서는 로그인이 제한됩니다. 기본 브라우저(Safari/Chrome)로 열어주세요.'
        );
      } else {
        setAuthError(
          'Google 리다이렉트 페이지 연결 중 오류가 발생했습니다: ' + (msg || '다시 시도해 주세요.')
        );
      }
    }
  };

  // Cross-Domain srider.kr SSO Session Restoration
  const handleCheckSSO = (): boolean => {
    const ssoUser = checkSSORestoration();
    if (ssoUser) {
      setCurrentUser(ssoUser);
      setIsLoginModalOpen(false);
      showToast(`${ssoUser.displayName} 계정으로 통합 세션이 연결되었습니다.`);
      return true;
    } else {
      setAuthError('다른 srider.kr 앱의 로그인 세션을 발견하지 못했습니다. Google 계정으로 로그인해 주세요.');
      return false;
    }
  };

  // Logout (destroy session and purge cross-domain cookies)
  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    showToast('로그아웃되었습니다. (세션 및 도메인 쿠키 완전 삭제)');
  };

  // Toast notice helper
  const showToast = (text: string) => {
    setActionNotice(text);
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  // Submit Rental Form
  const handleCreateRental = async (data: {
    period: string;
    gradeClass: string;
    teacherName: string;
    studentRep: string;
    cartUsed: CartType;
    quantity: number;
    approver: string;
  }) => {
    setIsSubmittingRental(true);
    try {
      const operator = currentUser
        ? { uid: currentUser.uid, email: currentUser.email }
        : { uid: 'kiosk-student-rep', email: 'kiosk@tab.srider.kr' };

      const newRental = await createRental(operator, data);
      playRentalSuccessSound();
      setRentals((prev) => [newRental, ...prev.filter((r) => r.id !== newRental.id)]);
      showToast(
        `✅ ${data.teacherName} (${data.gradeClass}) ${data.cartUsed} ${data.quantity}대 대여가 완료되었습니다!`
      );
    } catch (err: any) {
      console.error('Failed to create rental', err);
      throw err;
    } finally {
      setIsSubmittingRental(false);
    }
  };

  // Process Return with returnApprover and returnNotes
  const handleReturnRental = async (
    rental: Rental,
    returnData: { returnApprover: string; returnNotes: string }
  ) => {
    setReturningId(rental.id);
    try {
      const operator = currentUser
        ? { uid: currentUser.uid, email: currentUser.email }
        : { uid: 'kiosk-return', email: 'return@tab.srider.kr' };

      await returnRental(operator, rental, returnData);
      setRentals((prev) =>
        prev.map((r) =>
          r.id === rental.id
            ? {
                ...r,
                status: '반납 완료',
                returnedAt: new Date().toISOString(),
                returnApprover: returnData.returnApprover,
                returnNotes: returnData.returnNotes,
              }
            : r
        )
      );
      playReturnSuccessSound();
      const notePreview = returnData.returnNotes ? ` [비고: ${returnData.returnNotes}]` : '';
      showToast(
        `📦 ${rental.teacherName} (${rental.gradeClass}) ${rental.cartUsed} ${rental.quantity}대 반납이 완료되었습니다. (반납승인: ${returnData.returnApprover})${notePreview}`
      );
    } catch (err: any) {
      console.error('Return error:', err);
      showToast('❌ 반납 처리 중 오류가 발생했습니다.');
    } finally {
      setReturningId(null);
    }
  };

  // Whitelist management handlers (Superadmin only)
  const handleAddWhitelist = async (newUser: {
    email: string;
    name: string;
    department: string;
  }) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    await addWhitelistUser(operator, newUser);
    setWhitelistUsers((prev) => {
      const filtered = prev.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
      return [
        {
          email: newUser.email.trim().toLowerCase(),
          name: newUser.name.trim(),
          department: newUser.department.trim() || '교무실',
          role: 'admin',
          createdAt: new Date().toISOString(),
          addedBy: operator.email,
        },
        ...filtered,
      ];
    });
    showToast(`교직원 [${newUser.name}] 계정이 화이트리스트에 등록되었습니다.`);
  };

  const handleRemoveWhitelist = async (email: string) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    await removeWhitelistUser(operator, email);
    setWhitelistUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()));
    showToast(`교직원 [${email}] 계정 접근 권한이 해제되었습니다.`);
  };

  // Teacher management handlers
  const handleAddTeacher = async (newTeacher: { name: string; subject: string }) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    const createdTeacher = await addTeacher(operator, newTeacher);
    setTeachers((prev) => {
      if (
        prev.some(
          (t) =>
            t.id === createdTeacher.id ||
            (t.name.trim() === createdTeacher.name.trim() &&
              t.subject.trim() === createdTeacher.subject.trim())
        )
      ) {
        return prev;
      }
      const updated = [...prev, createdTeacher];
      return updated.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    });
    showToast(`담당 교사 [${newTeacher.name}] 선생님이 등록되었습니다.`);
  };

  const handleRemoveTeacher = async (teacherId: string, name: string) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    await removeTeacher(operator, teacherId, name);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    showToast(`담당 교사 [${name}] 선생님이 목록에서 삭제되었습니다.`);
  };

  // Approver management handlers
  const handleAddApprover = async (newApprover: { name: string; position: string }) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    const createdApprover = await addApprover(operator, newApprover);
    setApprovers((prev) => {
      if (
        prev.some(
          (a) =>
            a.id === createdApprover.id ||
            (a.name.trim() === createdApprover.name.trim() &&
              a.position.trim() === createdApprover.position.trim())
        )
      ) {
        return prev;
      }
      return [...prev, createdApprover];
    });
    showToast(`대여 승인자 [${newApprover.name}]님이 등록되었습니다.`);
  };

  const handleRemoveApprover = async (approverId: string, name: string) => {
    const operator = currentUser || { uid: 'superadmin-sso', email: SUPER_ADMIN_EMAIL };
    await removeApprover(operator, approverId, name);
    setApprovers((prev) => prev.filter((a) => a.id !== approverId));
    showToast(`대여 승인자 [${name}]님이 목록에서 삭제되었습니다.`);
  };

  // Compute storage capacities and recommended alternating cart
  const { cartA, cartB, totalAvailable } = calculateCartCapacities(rentals);
  const recommendedCart = getRecommendedCart(rentals);
  const activeRentals = rentals.filter((r) => r.status === '대여 중');


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 5-layer loop protected PWA Update Prompt */}
      <PWAUpdatePrompt />

      {/* Header */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenWhitelist={() => setIsWhitelistModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onLogout={handleLogout}
        
        
        onOpenRentalModal={() => setIsRentalModalOpen(true)}
        onTriggerScreensaver={() => setIsIdle(true)}
      />

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-bold shadow-xl border border-slate-700 flex items-center gap-2 backdrop-blur-md">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {/* Main Content Area (Galaxy Tab S6 Lite 5:3 Landscape Optimized: max-w-[1440px]) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 space-y-3 sm:space-y-3.5">

        {/* Superadmin Analytics Quick Access Banner */}
        {currentUser?.role === 'superadmin' && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-800/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    슈퍼관리자 대여 통계 분석 대시보드
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-bold border border-purple-400/30">
                    누적 {rentals.length}건 집계
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  요일별·시간대(교시)별 빈도, 누적·주간·월간 추이, 선생님 및 학급별 대여 순위 차트와 기간별 검색 및 엑셀(.xlsx) 추출
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>정밀 분석 대시보드 열기</span>
            </button>
          </div>
        )}

        {/* Dashboard Status Cards (A/B Storage & Capacity) */}
        <DashboardStatus
          cartA={cartA}
          cartB={cartB}
          totalAvailable={totalAvailable}
          recommendedCart={recommendedCart}
          activeRentalsCount={activeRentals.length}
          
                    onOpenRentalModal={() => setIsRentalModalOpen(true)}
        />

        {/* Rentals List (Real-time active rentals & returns) */}
        <RentalList
          rentals={rentals}
          approvers={approvers}
          
          onReturn={handleReturnRental}
          returningId={returningId}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 font-normal select-none">
        <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-center gap-2 sm:gap-2.5">
          <span>Copyright 2026. 버버&amp;싱글라이더</span>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={async () => {
              showToast(`🔄 최신 릴리즈(${APP_VERSION}) 업데이트를 확인하는 중입니다...`);
              try {
                let hasRealUpdate = false;
                let remoteVersion: string | null = null;
                try {
                  const res = await fetch(`/version.json?_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store' },
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data?.version && typeof data.version === 'string' && data.version.trim() !== APP_VERSION) {
                      hasRealUpdate = true;
                      remoteVersion = data.version.trim();
                    }
                  }
                } catch {}

                if ('serviceWorker' in navigator) {
                  const reg = await navigator.serviceWorker.getRegistration();
                  if (reg) {
                    await reg.update();
                    if (hasRealUpdate && reg.waiting) {
                      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                      window.dispatchEvent(new CustomEvent('pwa-show-update-prompt', { detail: { force: true } }));
                      return;
                    }
                  }
                }

                if (hasRealUpdate && remoteVersion) {
                  window.dispatchEvent(new CustomEvent('pwa-show-update-prompt', { detail: { force: true } }));
                  return;
                }

                setTimeout(() => {
                  showToast(`✨ 최신 버전(${APP_VERSION}) 상태입니다. (이미 최신 버전이 적용되어 있습니다)`);
                }, 500);
              } catch (e) {
                showToast(`✨ 현재 최신 버전(${APP_VERSION})을 사용 중입니다.`);
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-blue-700 transition cursor-pointer shadow-2xs font-bold text-xs"
            title={`최신 버전 확인 (현재 릴리즈: ${APP_VERSION})`}
            aria-label="업데이트 확인"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 animate-spin-hover" />
            <span>업데이트 확인</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600 font-mono font-bold border border-slate-200/80">
              {APP_VERSION}
            </span>
          </button>
          <button
            type="button"
            onClick={() => (currentUser ? setIsWhitelistModalOpen(true) : setIsLoginModalOpen(true))}
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-md border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 active:scale-95 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title="관리자 설정 (교직원 로그인)"
            aria-label="관리자 설정"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Modals */}
      {isRentalModalOpen && (
        <RentalFormModal
          isOpen={isRentalModalOpen}
          onClose={() => setIsRentalModalOpen(false)}
          recommendedCart={recommendedCart}
          cartA={cartA}
          cartB={cartB}
          teachers={teachers}
          approvers={approvers}
          onSubmit={handleCreateRental}
          isSubmitting={isSubmittingRental}
          rentals={rentals}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onGooglePopupLogin={handleGooglePopupLogin}
        onGoogleRedirectLogin={handleGoogleRedirectLogin}
        onCheckSSO={handleCheckSSO}
        authError={authError}
        isLoggingIn={isLoggingIn}
        loginStatusText={loginStatusText}
        onClearErrors={() => {
          setAuthError(null);
          setRejectedEmail(null);
          setLoginStatusText('');
        }}
      />

      <WhitelistModal
        isOpen={isWhitelistModalOpen}
        onClose={() => setIsWhitelistModalOpen(false)}
        whitelistUsers={whitelistUsers}
        onAddUser={handleAddWhitelist}
        onRemoveUser={handleRemoveWhitelist}
        teachers={teachers}
        onAddTeacher={handleAddTeacher}
        onRemoveTeacher={handleRemoveTeacher}
        approvers={approvers}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
      />

      <AuditLogModal
        isOpen={isAuditLogsModalOpen}
        onClose={() => setIsAuditLogsModalOpen(false)}
        auditLogs={auditLogs}
      />

      {isAnalyticsModalOpen && (
        <AdminAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          rentals={rentals}
          teachers={teachers}
          approvers={approvers}
          currentUser={currentUser}
        />
      )}

      {/* 30-Second Inactivity Kiosk Splash Screen */}
      <IdleSplashScreen
        isOpen={isIdle}
        onWakeUp={wakeUp}
        onOpenRental={() => {
          wakeUp();
          setIsRentalModalOpen(true);
        }}
        rentals={rentals}
      />
    </div>
  );
}
