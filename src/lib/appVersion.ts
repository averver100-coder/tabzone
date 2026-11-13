/**
 * 앱 버전 및 빌드 날짜 관리 모듈
 * - 버전 형식: VYYYY.MM.DD.NN (예: V2026.11.13.01, V2026.11.13.02)
 * - vite.config.ts 빌드 시점에 KST 날짜와 증분 패치 번호가 자동으로 주입됩니다.
 */

export const VITE_APP_BUILD_DATE: string =
  (import.meta.env.VITE_APP_BUILD_DATE as string) ||
  new Date()
    .toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');

export const VITE_APP_BUILD_PATCH: string =
  (import.meta.env.VITE_APP_BUILD_PATCH as string) || '01';

export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string) ||
  `V${VITE_APP_BUILD_DATE}.${VITE_APP_BUILD_PATCH}`;

export const BUILD_ID: string =
  (import.meta.env.VITE_BUILD_ID as string) ||
  `tabzone-${APP_VERSION}`;

export interface ParsedVersion {
  year: number;
  month: number;
  day: number;
  patch: number;
}

/**
 * V2026.11.13.01 또는 V2026.11.13 형식의 버전 문자열을 숫자 튜플로 파싱
 */
export function parseAppVersion(version?: string | null): ParsedVersion | null {
  if (!version || typeof version !== 'string') return null;
  const match = version.trim().match(/^V?(\d{4})\.(\d{2})\.(\d{2})(?:\.(\d+))?$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
    patch: match[4] ? parseInt(match[4], 10) : 0,
  };
}

/**
 * 두 버전 문자열을 정밀 비교합니다.
 * @returns a > b 이면 1, a === b 이면 0, a < b 이면 -1
 */
export function compareAppVersions(a?: string | null, b?: string | null): number {
  const pa = parseAppVersion(a);
  const pb = parseAppVersion(b);

  if (!pa || !pb) {
    const cleanA = (a || '').trim();
    const cleanB = (b || '').trim();
    if (!cleanA || !cleanB || cleanA === cleanB) return 0;
    return cleanA.localeCompare(cleanB);
  }

  if (pa.year !== pb.year) return pa.year > pb.year ? 1 : -1;
  if (pa.month !== pb.month) return pa.month > pb.month ? 1 : -1;
  if (pa.day !== pb.day) return pa.day > pb.day ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  return 0;
}

/**
 * 서버(원격) 버전이 현재 실행 중인 클라이언트 버전보다 실제로 상향되었는지 판별
 */
export function isNewerVersion(
  remoteVersion?: string | null,
  currentVersion: string = APP_VERSION
): boolean {
  if (!remoteVersion || typeof remoteVersion !== 'string') return false;
  return compareAppVersions(remoteVersion, currentVersion) > 0;
}
