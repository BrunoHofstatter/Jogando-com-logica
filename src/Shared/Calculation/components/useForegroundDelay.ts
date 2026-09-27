import { useEffect, useRef } from 'react';

/** Pause rather than consume help time while the lesson is hidden. */
export function useForegroundDelay(delay: number, resetKey: string | number, enabled: boolean, callback: () => void) {
  const latest = useRef(callback);
  useEffect(() => { latest.current = callback; }, [callback]);
  useEffect(() => {
    if (!enabled) return;
    let remaining = delay;
    let started = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const pause = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(0, remaining - (Date.now() - started));
    };
    const update = () => {
      pause();
      if (document.visibilityState !== 'visible' || done) return;
      started = Date.now();
      timer = setTimeout(() => { timer = undefined; done = true; latest.current(); }, remaining);
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { pause(); document.removeEventListener('visibilitychange', update); };
  }, [delay, resetKey, enabled]);
}
