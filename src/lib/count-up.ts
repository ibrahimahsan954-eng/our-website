import { useEffect, useState } from "react";

/* Shared helpers for the growth-stat cards (GrowthStatsCard, GrowthCalloutCard).
   Kept out of the component files so they never trip fast-refresh's
   "only export components" rule. */

/** 1_420_000 → "1.4M", 92_400 → "92.4K", 480 → "480". */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}K`;
  }
  return `${Math.round(n)}`;
}

/** rAF count-up from 0 → target, starting once `active` flips true (after an
    optional `delay` so multiple counters can sequence instead of firing together). */
export function useCountUp(target: number, active: boolean, duration = 1500, delay = 0) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let timeout = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [active, target, duration, delay]);
  return display;
}
