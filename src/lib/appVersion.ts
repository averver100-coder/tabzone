/**
 * 앱 버전 및 빌드 날짜 관리 모듈
 * vite.config.ts의 빌드 타임에 주입되는 환경 변수(VITE_APP_BUILD_DATE, VITE_APP_VERSION 등)를 활용합니다.
 */

export const VITE_APP_BUILD_DATE: string =
  (import.meta.env.VITE_APP_BUILD_DATE as string) ||
  new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\. /g, '.').replace(/\.$/, '');

export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string) ||
  `V${VITE_APP_BUILD_DATE}`;

export const BUILD_ID: string =
  (import.meta.env.VITE_BUILD_ID as string) ||
  `tabzone-${APP_VERSION}`;
