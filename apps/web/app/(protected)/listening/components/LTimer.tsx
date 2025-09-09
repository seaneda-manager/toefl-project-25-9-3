'use client';

import { useEffect, useState } from 'react';

export default function LTimer({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(id); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <div className="px-2 py-1 rounded border text-sm font-mono">⏱ {mm}:{ss}</div>;
}
