// apps/web/app/(protected)/listening/test/components/LAudioScreen.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { consumePlay } from '@/lib/consumePlay';
import type { Mode } from '@/types/consume-play';

export default function LAudioScreen({
  title,
  imageUrl,
  audioUrl,
  onEnded,
  onNext,
  sessionId,
  trackId,
  mode,
}: {
  title: string;
  imageUrl?: string;
  audioUrl: string;
  onEnded?: () => void;
  onNext?: () => void;
  /** 재생 카운트를 소비(consume)할 때 필요한 정보 */
  sessionId: string;
  trackId?: string;
  mode: Mode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoStartedRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);

  // consume 상태
  const [consumed, setConsumed] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 트랙 변경 시 초기화
  useEffect(() => {
    setConsumed(false);
    setRemaining(null);
    setErr(null);
    autoStartedRef.current = false;
  }, [sessionId, trackId, audioUrl]);

  // 오디오 이벤트 바인딩
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoadedMeta = () => {
      setDur(el.duration || 0);
      // 초기 로드 시 재생 속도 반영 (브라우저별 메타 로드 타이밍 차이 고려)
      el.playbackRate = rate;
    };
    const onTime = () => {
      setCur(el.currentTime);
      const d = el.duration || 0;
      setDur(d);
      setProgress(d ? (el.currentTime / d) * 100 : 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      onEnded?.();
    };

    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);

    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
  }, [onEnded, rate]);

  // 재생 속도 변경 시 오디오에 반영
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [rate]);

  // 소비 + 재생 (최초 재생 시 1회 consume)
  const tryPlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    setErr(null);

    if (!consumed) {
      try {
        const row = await consumePlay({ sessionId, trackId, mode });
        setRemaining(row.remaining ?? null);
        setConsumed(true);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
        return; // consume 실패 시 재생하지 않음
      }
    }

    el.play().catch(() => {
      // 자동재생 차단 등으로 실패할 수 있음(무시)
    });
  };

  // 진입 시 자동 소비/재생 (StrictMode 중복 방지)
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, trackId, audioUrl]);

  const fmt = (t: number) => {
    if (!isFinite(t) || t < 0) return '00:00';
    const m = Math.floor(t / 60),
      s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void tryPlay();
  };

  const changeRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(next);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const pct = Number(e.target.value);
    const d = el.duration || 0;
    el.currentTime = (pct / 100) * d;
    setProgress(pct); // 슬라이더 즉시 반영
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>

      {/* 중앙 이미지 (next/image 사용) */}
      <div className="mb-6 flex min-h-[360px] items-center justify-center rounded-2xl border bg-white p-4">
        {imageUrl ? (
          <div className="relative h-[320px] w-full max-w-[720px]">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 92vw, 720px"
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="text-sm text-neutral-400">No image</div>
        )}
      </div>

      {/* 커스텀 컨트롤러 */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="rounded-full border px-4 py-2 hover:bg-neutral-50"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={changeRate}
            className="rounded-full border px-3 py-2 text-sm hover:bg-neutral-50"
          >
            {rate.toFixed(2)}x
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
            <span>{fmt(cur)}</span>
            <span> / </span>
            <span>{fmt(dur)}</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={onSeek}
          className="w-full accent-yellow-400"
          aria-label="Seek"
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            {remaining !== null
              ? `Remaining plays: ${remaining}`
              : consumed
                ? 'Consumed'
                : 'Preparing…'}
          </span>
          {err && <span className="text-red-600">Consume error: {err}</span>}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>

      {/* 실제 오디오는 보조(접근성 고려 시 화면에서 숨김) */}
      <audio ref={audioRef} src={audioUrl} className="sr-only" preload="auto" />
    </div>
  );
}
