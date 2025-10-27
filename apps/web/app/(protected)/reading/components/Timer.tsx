// apps/web/app/(protected)/reading/components/Timer.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  /** 총 타이머 길이(초). 예: 120 = 2분 */
  totalSeconds: number;
  /** 자동 시작 (기본 true) */
  autoStart?: boolean;
  /** 시작 시 이미 경과된 시간(초). 리줌/복구용 */
  initialElapsed?: number;

  /** 1초마다 남은 초를 통지 */
  onTickAction?: (remainingSeconds: number) => void;
  /** 0초 도달 시 호출 */
  onExpireAction?: () => void;

  /** 0에서 더 내려가지 않도록 clamp (기본 true) */
  clampToZero?: boolean;
  /** UI 컨트롤 표시 (기본 true) */
  showControls?: boolean;
  /** 접근성 라이브 영역 */
  ariaLive?: 'off' | 'polite' | 'assertive';
  /** 외부 클래스 */
  className?: string;
  /** mm:ss.t(1/10초) 표시 */
  showTenths?: boolean;
  /** 'down' 카운트다운, 'up' 카운트업 */
  direction?: 'down' | 'up';
};

export default function Timer({
  totalSeconds,
  autoStart = true,
  initialElapsed = 0,
  onTickAction,
  onExpireAction,
  clampToZero = true,
  showControls = true,
  ariaLive = 'polite',
  className = '',
  showTenths = false,
  direction = 'down',
}: Props) {
  const totalMs = useMemo(() => Math.max(0, Math.floor(totalSeconds * 1000)), [totalSeconds]);
  const initialElapsedMs = useMemo(
    () => Math.max(0, Math.floor(initialElapsed * 1000)),
    [initialElapsed]
  );

  // 내부 시간 관리
  const [running, setRunning] = useState<boolean>(autoStart);
  const [renderNow, setRenderNow] = useState<number>(Date.now());
  const startMsRef = useRef<number | null>(null);
  const pausedAccMsRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // 초기화
  useEffect(() => {
    const now = performance.now();
    startMsRef.current = now - initialElapsedMs;
    pausedAccMsRef.current = 0;
    pausedAtRef.current = null;
    setRenderNow(Date.now());
    setRunning(autoStart);
  }, [autoStart, initialElapsedMs, totalMs]);

  // 렌더 타이커
  const tick = useCallback(() => {
    setRenderNow(Date.now());
    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  // 실행/정지
  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pausedAtRef.current == null) pausedAtRef.current = performance.now();
      return;
    }

    if (pausedAtRef.current != null) {
      pausedAccMsRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, tick]);

  // 남은/경과 계산
  const { elapsedMs, remainingMs, clampedRemainingMs } = useMemo(() => {
    const now = performance.now();
    const started = startMsRef.current ?? now;
    const pausedAcc = pausedAccMsRef.current;
    let elapsed = now - started - pausedAcc;
    if (elapsed < 0) elapsed = 0;

    const remaining = totalMs - elapsed;
    const clamped = clampToZero ? Math.max(0, remaining) : remaining;

    return { elapsedMs: elapsed, remainingMs: remaining, clampedRemainingMs: clamped };
  }, [renderNow, totalMs, clampToZero]);

  // onTickAction: 1초에 한 번만
  const lastTickedSecRef = useRef<number | null>(null);
  useEffect(() => {
    const remainSec = Math.floor(clampedRemainingMs / 1000);
    if (remainSec !== lastTickedSecRef.current) {
      lastTickedSecRef.current = remainSec;
      onTickAction?.(remainSec);
    }
  }, [clampedRemainingMs, onTickAction]);

  // 만료 처리
  const expiredRef = useRef(false);
  useEffect(() => {
    if (clampToZero && clampedRemainingMs === 0 && !expiredRef.current) {
      expiredRef.current = true;
      setRunning(false);
      onExpireAction?.();
    }
    if (clampedRemainingMs > 0) expiredRef.current = false;
  }, [clampedRemainingMs, clampToZero, onExpireAction]);

  // 포맷터
  const fmt = (ms: number) => {
    const abs = Math.abs(ms);
    const totalF = abs / 1000;
    const sec = Math.floor(totalF);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    if (showTenths) {
      const tenth = Math.floor((totalF - sec) * 10);
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${tenth}`;
    }
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const display =
    direction === 'up' ? fmt(elapsedMs) : fmt(clampedRemainingMs);

  // 컨트롤
  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const reset = () => {
    const now = performance.now();
    startMsRef.current = now;
    pausedAccMsRef.current = 0;
    pausedAtRef.current = null;
    setRenderNow(Date.now());
    setRunning(autoStart);
    expiredRef.current = false;
    lastTickedSecRef.current = null;
  };

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${className}`}
      role="timer"
      aria-live={ariaLive}
      aria-atomic="true"
      aria-label={direction === 'down' ? 'Countdown timer' : 'Count-up timer'}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-semibold tabular-nums">{display}</div>
        <div className="text-xs text-neutral-500">
          {direction === 'down'
            ? `Total ${Math.floor(totalMs / 1000)}s`
            : `Target ${Math.floor(totalMs / 1000)}s`}
        </div>
      </div>

      {showControls && (
        <div className="mt-3 flex gap-2">
          {running ? (
            <button
              type="button"
              onClick={pause}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={resume}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
