import { useEffect, useRef, useState } from 'react';

interface UseIdleTimerOptions {
  timeoutMs?: number;
  disabled?: boolean;
}

export function useIdleTimer({ timeoutMs = 30000, disabled = false }: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (disabled) {
      setIsIdle(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutMs);
  };

  const wakeUp = () => {
    setIsIdle(false);
    resetTimer();
  };

  useEffect(() => {
    if (disabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsIdle(false);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'click'];

    const handleActivity = () => {
      if (!isIdle) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [disabled, timeoutMs, isIdle]);

  return { isIdle, setIsIdle, wakeUp, resetTimer };
}
