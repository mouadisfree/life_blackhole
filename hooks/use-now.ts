"use client";

import { useEffect, useState } from "react";

/**
 * The current time, re-rendering on each wall-clock second boundary so all
 * counters tick together. Null until mounted (no Date during prerender).
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = new Date();
      setNow(current);
      timer = setTimeout(tick, 1000 - (current.getTime() % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return now;
}
