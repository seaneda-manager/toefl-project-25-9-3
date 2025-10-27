'use client';

import { useEffect, useRef, useState } from 'react';
import { startSession, consumeOnce, getStatus } from '@/lib/listening';

type Props = { trackId: string; mode?: 'study' | 'test' };

export default function ListeningPlayer({ trackId, mode = 'study' }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consumedRef = useRef(false); // 중복 소비 방지

  // 세션 생성 (trackId 또는 mode가 바뀔 때마다 갱신)
  useEffect(() => {
    let alive = true;
    setError(null);
    setSessionId(null);
    setLoading(true);

    startSession(trackId, mode)
      .then((res: any) => {
        if (!alive) return;
        if ('id' in res && res.ok) setSessionId(res.id as string);
        else setError((res.detail ?? res.error ?? 'Failed to start session') as string);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [trackId, mode]);

  // 재생(소비) 트리거 ? 실제 오디오 재생은 별도 컴포넌트에서 처리할 수 있음
  const onPlay = async () => {
    if (!sessionId) return;
    if (!consumedRef.current) {
      consumedRef.current = true; // 중복 호출 방지
      const res: any = await consumeOnce(sessionId);
      if (!('ok' in res) || !res.ok) {
        setError((res.detail ?? res.error ?? 'Failed to consume') as string);
      }
    }
    // 필요 시 이곳에서 audio.play()를 호출하거나 상위로 콜백을 올려주세요.
  };

  const onShowStatus = async () => {
    if (!sessionId) return;
    const res: any = await getStatus(sessionId);
    if (!('ok' in res) || !res.ok) {
      setError((res.detail ?? res.error ?? 'Failed to get status') as string);
    } else {
      alert(JSON.stringify(res.session, null, 2));
    }
  };

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white flex flex-col gap-3">
      <div className="text-sm text-gray-600">
        Track: <b>{trackId}</b> · Mode: <b>{mode}</b>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          onClick={onPlay}
          disabled={loading || !sessionId}
        >
          {loading ? 'Preparing…' : 'Play'}
        </button>

        <button
          className="px-3 py-2 rounded-xl border"
          onClick={onShowStatus}
          disabled={!sessionId}
        >
          Status
        </button>
      </div>

      <div className="text-xs text-gray-500">
        sessionId: {sessionId ?? '?'}
      </div>
    </div>
  );
}




