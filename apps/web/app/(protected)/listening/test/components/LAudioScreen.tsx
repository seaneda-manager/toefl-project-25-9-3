'use client';
import { useEffect, useRef, useState } from 'react';
import { consumePlay } from '@/lib/consumePlay';
import type { Mode } from '@/types/listening';

export default function LAudioScreen({
  title, imageUrl, audioUrl, onEnded, onNext,
  sessionId, trackId, mode,
}: {
  title: string;
  imageUrl?: string;
  audioUrl: string;
  onEnded?: () => void;
  onNext?: () => void;
  /** 소비 카운터 연동용 */
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
    const onTime = () => {
      setCur(el.currentTime);
      setDur(el.duration || 0);
      setProgress((el.currentTime / (el.duration || 1)) * 100);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); onEnded?.(); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
  }, [onEnded]);

  // 소비 + 재생 (화면당 최초 1회만 소비)
  const tryPlay = async () => {
    const el = audioRef.current; if (!el) return;
    setErr(null);
    if (!consumed) {
      try {
        const row = await consumePlay({ sessionId, trackId, mode });
        setRemaining(row.remaining);
        setConsumed(true);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
        return; // 소비 실패 시 재생하지 않음
      }
    }
    el.play().catch(() => {/* 브라우저 자동재생 정책 등으로 실패할 수 있음 */});
  };

  // 진입 시 자동 소비 → 자동 재생 (StrictMode 중복 방지)
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, trackId, audioUrl]);

  const fmt = (t: number) => {
    if (!isFinite(t)) return '00:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const el = audioRef.current; if (!el) return;
    if (playing) el.pause();
    else void tryPlay();
  };

  const changeRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current; if (!el) return;
    const pct = Number(e.target.value);
    el.currentTime = (pct / 100) * (el.duration || 0);
  };

  return (
    <div className="mx-auto max-w-4xl w-full p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {/* 중앙 이미지 */}
      <div className="rounded-2xl border bg-white p-4 mb-6 flex items-center justify-center min-h-[360px]">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="max-h-[320px] object-contain" />
        ) : (
          <div className="text-sm text-neutral-400">No image</div>
        )}
      </div>

      {/* 커스텀 컨트롤 */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={togglePlay} className="rounded-full border px-4 py-2 hover:bg-neutral-50">
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={changeRate} className="rounded-full border px-3 py-2 text-sm hover:bg-neutral-50">
            {rate.toFixed(2)}x
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
            <span>{fmt(cur)}</span><span> / </span><span>{fmt(dur)}</span>
          </div>
        </div>

        <input
          type="range"
          min={0} max={100} value={progress}
          onChange={onSeek}
          className="w-full accent-yellow-400"
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            {remaining !== null ? `Remaining plays: ${remaining}` : consumed ? 'Consumed' : 'Preparing…'}
          </span>
          {err && <span className="text-red-600">Consume error: {err}</span>}
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded-xl px-4 py-2 border hover:bg-neutral-50" onClick={onNext}>
            Next
          </button>
        </div>
      </div>

      {/* 네이티브 오디오는 숨김(접근성 고려해 offscreen로 남겨둠) */}
      <audio ref={audioRef} src={audioUrl} className="sr-only" preload="auto" />
    </div>
  );
}
