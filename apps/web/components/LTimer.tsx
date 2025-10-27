// apps/web/app/components/LTimer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function LTimer({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire?: () => void;
}) {
  const [left, setLeft] = useState(() => Math.max(0, Math.trunc(seconds)));
  const startRef = useRef<number>(Date.now());
  const durationRef = useRef<number>(Math.max(0, Math.trunc(seconds)) * 1000);
  const firedRef = useRef(false); // onExpire 占쌩븝옙 占쏙옙占쏙옙
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null); // setInterval id

  // seconds 占쏙옙占쏙옙 占쏙옙 占쏙옙占쏙옙
  useEffect(() => {
    const durMs = Math.max(0, Math.trunc(seconds)) * 1000;
    durationRef.current = durMs;
    startRef.current = Date.now();
    firedRef.current = false;
    setLeft(Math.round(durMs / 1000));
  }, [seconds]);

  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const elapsed = now - startRef.current;
      const remainMs = Math.max(0, durationRef.current - elapsed);
      const remainSec = Math.max(0, Math.ceil(remainMs / 1000)); // UX: 占시곤옙占쏙옙占쏙옙占쏙옙 占쌘울옙占쏙옙占쏙옙占쏙옙 占시몌옙
      setLeft(remainSec);

      if (remainMs <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpire?.();
        }
        return; // 占쏙옙
      }
    };

    // 첫 占쏙옙占?占쏙옙占?
    loop();

    // 1占쏙옙 占쏙옙占쏙옙 占썩본 틱 + 占쏙옙 占쏙옙占쏙옙틀 占쏙옙占?rAF 占쏙옙占쏙옙
    tickRef.current = window.setInterval(loop, 1000);
    const rafStep = () => {
      rafRef.current = requestAnimationFrame(rafStep);
    };
    rafRef.current = requestAnimationFrame(rafStep);

    // 占쏙옙占시쇽옙 占쏙옙화 占쏙옙 占쏙옙占?占쏙옙 占쏙옙 占쏙옙占쏙옙
    const vis = () => loop();
    document.addEventListener('visibilitychange', vis);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', vis);
      tickRef.current = null;
      rafRef.current = null;
    };
  }, [onExpire]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <span aria-label="timer" className="font-mono text-sm" title={`${left}s`}>
      {mm}:{ss}
    </span>
  );
}


