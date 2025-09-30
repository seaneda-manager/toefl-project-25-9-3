'use client';
import { useEffect, useState } from 'react';

export default function LTimer({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire?: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds); // src媛 諛붾???珥덇린?뷀븯怨??띕떎硫???以??좎?
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onExpire?.();
      return;
    }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left, onExpire]);

  const mm = Math.floor(left / 60)
    .toString()
    .padStart(2, '0');
  const ss = (left % 60).toString().padStart(2, '0');

  return (
    <span aria-label="timer" className="font-mono text-sm">
      {mm}:{ss}
    </span>
  );
}

