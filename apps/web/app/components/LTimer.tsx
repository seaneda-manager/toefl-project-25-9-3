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
    setLeft(seconds); // src가 바뀔 때 초기화하고 싶다면 이 줄 유지
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
