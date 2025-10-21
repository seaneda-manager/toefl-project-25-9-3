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
  const firedRef = useRef(false); // onExpire �ߺ� ����
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null); // setInterval id

  // seconds ���� �� ����
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
      const remainSec = Math.max(0, Math.ceil(remainMs / 1000)); // UX: �ð������� �ڿ������� �ø�
      setLeft(remainSec);

      if (remainMs <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpire?.();
        }
        return; // ��
      }
    };

    // ù ��� ���
    loop();

    // 1�� ���� �⺻ ƽ + �� ����Ʋ ��� rAF ����
    tickRef.current = window.setInterval(loop, 1000);
    const rafStep = () => {
      rafRef.current = requestAnimationFrame(rafStep);
    };
    rafRef.current = requestAnimationFrame(rafStep);

    // ���ü� ��ȭ �� ��� �� �� ����
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
