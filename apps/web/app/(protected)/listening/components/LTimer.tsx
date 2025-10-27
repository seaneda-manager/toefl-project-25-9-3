// apps/web/app/(protected)/listening/components/LTimer.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  /** 총 타이머 길이(초). 예: 90 = 1분 30초 */
  totalSeconds: number;

  /** 자동 시작 여부 (기본 true) */
  autoStart?: boolean;

  /** 시작할 때 이미 경과된 초(리줌/복구용). 기본 0 */
  initialElapsed?: number;

  /** 1초마다 현재 남은 시간(초)을 통지 */
  onTickAction?: (remainingSeconds: number) => void;

  /** 0초 도달 시 호출 */
  onExpireAction?: () => void;

  /** 시간이 0이 되면 음수로 내려가지 않게 clamp (기본 true) */
  clampToZero?: boolean;

  /** 일시정지/재개 버튼 노출 여부 (기본 true) */
  showControls?: boolean;

  /** 화면 리더 공지용 라이브 영역 모드 (off, polite, assertive). 기본 'polite' */
  ariaLive?: 'off' | 'polite' | 'assertive';

  /** 외부에서 스타일 합치기용 클래스 */
  className?: string;

  /** mm:ss 말고 mm:ss.t (10th) 로 보여줄지 */
  showTenths?: boolean;

  /** 경과 방향: down(카운트다운) | up(카운트업). 기본 down */
  direction?: 'down' | 'up';
};

export default function LTimer({
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
  // 내부 시간은 "경과 시간(ms)"을 기준으로 관리 -> 정밀/일관
  const startMsRef = useRef<number | null>(null);
  const pausedAccMsRef = useRef<number>(0); // 누적 일시정지 ms
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(autoStart);
  const [renderNow, setRenderNow] = useState<number>(Date.now());

  const totalMs = useMemo(() => Math.max(0, Math.floor(totalSeconds * 1000)), [totalSeconds]);
  const initialElapsedMs = useMemo(
    () => Math.max(0, Math.floor(initialElapsed * 1000)),
    [initialElapsed]
  );

  // 초기화
  useEffect(() => {
    // 시작 시각 설정 (initialElapsed 반영)
    const now = performance.now();
    startMsRef.current = now - initialElapsedMs;
    pausedAccMsRef.current = 0;
    pausedAtRef.current = null;
    setRenderNow(Date.now());
    setRunning(autoStart);
  }, [autoStart, initialElapsedMs, totalMs]);

  // 렌더 타이커(raf) — 100ms 간격으로도 충분하지만 스무스하게 유지
  const tick = useCallback(() => {
    setRenderNow(Date.now());

    // 다음 프레임 예약
    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  // 실행/정지 제어
  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // 일시정지 시작 스탬프
      if (pausedAtRef.current == null) pausedAtRef.current = performance.now();
      return;
    }

    // 재개: 누적 일시정지 시간 반영
    if (pausedAtRef.current != null) {
      pausedAccMsRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    // raf 시작
    if (rafRef.current == null) rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, tick]);

  // 현재 경과/남은 시간 계산 (ms 단위)
  const { elapsedMs, remainingMs, clampedRemainingMs } = useMemo(() => {
    const now = performance.now();
    const started = startMsRef.current ?? now;
    const pausedAcc = pausedAccMsRef.current;
    let elapsed = now - started - pausedAcc;
    if (elapsed < 0) elapsed = 0;

    const remaining = totalMs - elapsed;
    const clamped = clampToZero ? Math.max(0, remaining) : remaining;

    return {
      elapsedMs: elapsed,
      remainingMs: remaining,
      clampedRemainingMs: clamped,
    };
  }, [renderNow, totalMs, clampToZero]);

  // 1초 단위 onTickAction 호출 (스팸 방지)
  const lastTickedSecRef = useRef<number | null>(null);
  useEffect(() => {
    const remainSec = Math.floor(clampedRemainingMs / 1000);
    if (remainSec !== lastTickedSecRef.current) {
      lastTickedSecRef.current = remainSec;
      onTickAction?.(remainSec);
    }
  }, [clampedRemainingMs, onTickAction]);

  // 만료 처리
  const expiredRef = useRef<boolean>(false);
  useEffect(() => {
    if (clampToZero && clampedRemainingMs === 0 && !expiredRef.current) {
      expiredRef.current = true;
      setRunning(false);
      onExpireAction?.();
    }
    if (clampedRemainingMs > 0) {
      expiredRef.current = false;
    }
  }, [clampedRemainingMs, clampToZero, onExpireAction]);

  // 포맷터
  const fmt = (ms: number) => {
    const positive = Math.abs(ms);
    const totalSecondsF = positive / 1000;
    const sec = Math.floor(totalSecondsF);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    if (showTenths) {
      const tenth = Math.floor((totalSecondsF - sec) * 10);
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${tenth}`;
    }
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  // 표시할 값
  const display = useMemo(() => {
    if (direction === 'up') return fmt(elapsedMs);
    return fmt(clampedRemainingMs);
  }, [direction, elapsedMs, clampedRemainingMs]);

  // 조작 핸들러
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

