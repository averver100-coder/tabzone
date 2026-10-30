declare const __APP_VERSION__: string;
declare const __BUILD_ID__: string;

/**
 * 릴리즈 버전: 빌드/배포 시점에 정적으로 주입되는 고정 식별자입니다.
 * 런타임에 동적으로 변경되지 않으며 실제 배포된 코드 버전을 엄격히 비교하는 기준으로 사용됩니다.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__
    ? __APP_VERSION__
    : import.meta.env.VITE_APP_VERSION || 'V2026.10.28';

export const BUILD_ID: string =
  typeof __BUILD_ID__ !== 'undefined' && __BUILD_ID__
    ? __BUILD_ID__
    : import.meta.env.VITE_BUILD_ID || `tabzone-${APP_VERSION}`;
