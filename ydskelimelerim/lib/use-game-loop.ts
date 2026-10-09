import { useEffect, useRef } from "react";

/**
 * requestAnimationFrame döngüsü. `step(dt)` saniye cinsinden geçen süreyi alır.
 * `running` false olduğunda döngü durur.
 */
export function useGameLoop(step: (dt: number) => void, running: boolean) {
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min((t - last) / 1000, 0.033) : 0;
      last = t;
      if (dt > 0) stepRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

/** Bileşen kapanınca bekleyen setTimeout'ları temizleyen yardımcı. */
export function useTimeouts() {
  const ids = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ids.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.current = ids.current.filter((x) => x !== id);
      fn();
    }, ms);
    ids.current.push(id);
  };
}
