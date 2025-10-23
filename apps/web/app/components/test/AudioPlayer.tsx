// normalized utf8
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  src?: string;
  oneShot?: boolean;          // ���� �� ��� ����
  disableSeek?: boolean;      // Ž��(�巡��) ����
  onStart?: () => void;
  onEnd?: () => void;
};

export default function AudioPlayer({
  src,
  oneShot = true,
  disableSeek = true,
  onStart,
  onEnd,
}: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const startedOnceRef = useRef(false);
  const endedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const [started, setStarted] = useState(false);

  // src ���� �� �ʱ�ȭ
  useEffect(() => {
    startedOnceRef.current = false;
    endedRef.current = false;
    lastTimeRef.current = 0;
    setStarted(false);
  }, [src]);

  // �̺�Ʈ ���ε� (ref.current ������ ���)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPlay = () => {
      if (!startedOnceRef.current) {
        startedOnceRef.current = true;
        onStart?.();
      }
      setStarted(true);
    };
    const onPause = () => setStarted(false);
    const onEnded = () => {
      endedRef.current = true;
      setStarted(false);
      onEnd?.();
    };
    const onTime = () => {
      lastTimeRef.current = el.currentTime || 0;
    };
    const onSeeking = () => {
      if (disableSeek) {
        // seeking�� ��� �Ұ� �� �ð��� ����ġ
        el.currentTime = lastTimeRef.current;
      }
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('seeking', onSeeking);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeking', onSeeking);
    };
  }, [disableSeek, onStart, onEnd]);

  const start = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (!src || (oneShot && endedRef.current)) return;
    el.play().catch(() => {
      /* �ڵ���� ��å ������ ���� ����: ���� */
    });
  }, [src, oneShot]);

  return (
    <div className="p-4 flex items-center gap-4">
      {!started && (
        <button className="btn-primary" onClick={start} disabled={!src || (oneShot && endedRef.current)}>
          Start Audio
        </button>
      )}
      <audio ref={ref} src={src} controls={false} preload="auto" />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        onChange={(e) => {
          const el = ref.current;
          if (el) el.volume = Number(e.currentTarget.value);
        }}
        aria-label="Volume"
      />
    </div>
  );
}
