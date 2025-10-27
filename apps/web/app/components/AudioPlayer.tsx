// normalized utf8
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  src?: string;
  oneShot?: boolean;         // 占쏙옙占쏙옙 占쏙옙 占쏙옙占?占쏙옙占쏙옙
  disableSeek?: boolean;     // 占쏙옙占?占쏙옙 탐占쏙옙 占쏙옙占쏙옙
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

  // src 占쏙옙占쏙옙 占쏙옙 占쏙옙占쏙옙 占쏙옙占쏙옙
  useEffect(() => {
    startedOnceRef.current = false;
    endedRef.current = false;
    setStarted(false);
    lastTimeRef.current = 0;
  }, [src]);

  // 占쏙옙占쏙옙占?占싱븝옙트 占쏙옙占싸듸옙
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // 占십깍옙 占쏙옙占쏙옙
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
        // seeking 占싱븝옙트占쏙옙 cancel 占쌀곤옙 占쏙옙 占시곤옙占쏙옙 占실듸옙占쏙옙
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

    // oneShot占싱몌옙 占쏙옙占쏙옙 占쏙옙占쏙옙 占쏙옙占?占쏙옙占쏙옙
    if (oneShot && endedRef.current) return;

    // 占쏙옙占쏙옙占쏙옙 占쌘듸옙占쏙옙占?占쏙옙책 占쏙옙占쏙옙
    el.play().catch(() => {
      // 占쏙옙占쏙옙微占?占쏙옙튼 占쌕쏙옙 占쏙옙占쏙옙占쏙옙占쏙옙 占쏙옙占쏙옙占쏙옙 占쏙옙占쏙옙 占쏙옙占쏙옙
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

  // src 占쏙옙占쏙옙占쏙옙 占쏙옙占쏙옙 占쏙옙占쏙옙
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

      {/* 占쏙옙占쏙옙티占쏙옙 占쏙옙트占쏙옙占쏙옙 占쏙옙占쏙옙. 占쏙옙占쌕쇽옙占쏙옙占쏙옙占싸몌옙 占쏙옙占쏙옙 */}
      <audio ref={audioRef} src={src} controls={false} preload="auto" />
    </div>
  );
}




