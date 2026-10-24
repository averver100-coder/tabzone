import { useEffect, useState } from 'react';

export interface BatteryStatus {
  charging: boolean;
  level: number;
  supported: boolean;
}

/**
 * Hook to monitor device battery charging/discharging status and level
 * Used to detect smart plug power connection status for kiosk operations
 */
export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    charging: true, // Optimistic default for plugged kiosk
    level: 100,
    supported: false,
  });

  useEffect(() => {
    let isMounted = true;
    let batteryObj: any = null;

    if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
      (navigator as any)
        .getBattery()
        .then((b: any) => {
          if (!isMounted) return;
          batteryObj = b;

          const update = () => {
            if (!isMounted) return;
            setStatus({
              charging: Boolean(b.charging),
              level: Math.round((b.level ?? 1) * 100),
              supported: true,
            });
          };

          update();

          b.addEventListener('chargingchange', update);
          b.addEventListener('levelchange', update);
        })
        .catch(() => {
          if (!isMounted) return;
          setStatus((prev) => ({ ...prev, supported: false }));
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
}
