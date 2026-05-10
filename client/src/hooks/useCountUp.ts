import { useState, useEffect, useRef } from "react";

/**
 * useCountUp — animates a number from 0 to `target` over `duration` ms
 * Uses requestAnimationFrame with an ease-out-expo curve.
 * Fires once on mount (or when `trigger` changes).
 */
export function useCountUp(target: number, duration = 800, trigger?: unknown): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }

    // Cancel any running animation
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setValue(0);

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutExpo(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, trigger]);

  return value;
}
