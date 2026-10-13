import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// 출퇴근 히어로와 동일한 PWA 자동 갱신 및 서비스 워커 즉시 등록
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
