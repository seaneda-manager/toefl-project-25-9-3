'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  src?: string;
  oneShot?: boolean;         // 끝난 뒤 재생 금지
  disableSeek?: boolean;     // 재생 중 탐색 방지
  defaultVolume?: number;    // 0~1
  onStart?: () => void;
  onEnd?: () => void;
  className?: string;
};

export default function AudioPlayer({
  src,
  oneShot = true,
  disableSeek = true,
  defaultVolume = 1,
  onStart,
  onEnd,
  className = '',
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedOnceRef = useRef(false);
  const endedRef = useRef(false);
  const lastTimeRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(
    Number.isFinite(defaultVolume) ? Math.min(1, Math.max(0, defaultVolume)) : 1
  );

  // src 변경 시 상태 리셋
  useEffect(() => {
    startedOnceRef.current = false;
    endedRef.current = false;
    setStarted(false);
    lastTimeRef.current = 0;
  }, [src]);

  // 오디오 이벤트 바인딩
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // 초기 볼륨
    el.volume = volume;

    const handlePlay = () => {
      if (!startedOnceRef.current) {
        startedOnceRef.current = true;
        setStarted(true);
        onStart?.();
      } else {
        setStarted(true);
      }
    };

    const handleEnded = () => {
      endedRef.current = true;
      setStarted(false);
      onEnd?.();
    };

    const handleTimeUpdate = () => {
      lastTimeRef.current = el.currentTime || 0;
    };

    const handleSeeking = () => {
      if (disableSeek) {
        // seeking 이벤트는 cancel 불가 → 시간을 되돌림
        el.currentTime = lastTimeRef.current;
      }
    };

    el.addEventListener('play', handlePlay);
    el.addEventListener('ended', handleEnded);
    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('seeking', handleSeeking);

    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('ended', handleEnded);
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('seeking', handleSeeking);
    };
  }, [disableSeek, onStart, onEnd, volume]);

  const tryPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;

    // oneShot이면 종료 이후 재생 금지
    if (oneShot && endedRef.current) return;

    // 브라우저 자동재생 정책 대응
    el.play().catch(() => {
      // 사용자가 버튼 다시 누르도록 조용히 실패 무시
    });
  }, [oneShot]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      tryPlay();
    } else {
      el.pause();
      setStarted(false);
    }
  };

  const onChangeVolume = (v: number) => {
    const el = audioRef.current;
    const clamped = Math.min(1, Math.max(0, v));
    setVolume(clamped);
    if (el) el.volume = clamped;
  };

  // src 없으면 안전 가드
  const disabled = !src || src.trim().length === 0;
  const canPlay = !disabled && !(oneShot && endedRef.current);

  return (
    <div className={`p-4 flex items-center gap-4 ${className}`}>
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
        onClick={toggle}
        disabled={!canPlay}
      >
        {started ? 'Pause' : 'Play'}
      </button>

      <input
        aria-label="Volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onChangeVolume(Number(e.currentTarget.value))}
        className="w-36"
      />

      {!src ? (
        <span className="text-xs text-neutral-500">No audio source</span>
      ) : oneShot && endedRef.current ? (
        <span className="text-xs text-neutral-500">Playback finished</span>
      ) : null}

      {/* 네이티브 컨트롤은 숨김. 접근성용으로만 유지 */}
      <audio ref={audioRef} src={src} controls={false} preload="auto" />
    </div>
  );
}
