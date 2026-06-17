import { useEffect, useState } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function diff(target: Date): Countdown {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  };
}

/** Live countdown to a target date, ticking once per second. */
export function useCountdown(target: Date): Countdown {
  const [value, setValue] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setValue(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return value;
}
