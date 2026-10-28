declare const __APP_VERSION__: string;

/**
 * 릴리즈 버전: 빌드/배포 시점의 한국 표준시(KST, UTC+9) 날짜를 기준으로 정적으로 주입됩니다.
 * 사용자가 버튼을 클릭한 현재 날짜가 아니라, 실제로 코드가 수정 및 빌드되어 배포된 날짜(릴리즈 날짜)를 나타냅니다.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'V2026.10.28';
