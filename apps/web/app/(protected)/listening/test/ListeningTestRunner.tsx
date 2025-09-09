'use client';

import { useEffect, useMemo, useState } from 'react';
import AudioPlayer from '../components/AudioPlayer';
import LTimer from '../components/LTimer';
import { startListeningSession, submitListeningAnswer, finishListeningSession } from '@/actions/listening';
import type { ListeningTrack, LQuestion } from '@/types/types-listening';

export default function ListeningTestRunner({ track, onFinish }: { track: ListeningTrack; onFinish?: (sessionId: string)=>void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const total = track.questions.length;
  const q: LQuestion | undefined = total > 0 ? track.questions[current] : undefined;

  useEffect(() => {
    (async () => {
      const { sessionId } = await startListeningSession({ trackId: track.id, mode: 'test' });
      setSessionId(sessionId);
    })();
  }, [track.id]);

  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1));

  async function pick(choiceId: string) {
    if (!q) return;
    setAnswers((s) => ({ ...s, [q.id]: choiceId }));
    if (!sessionId) return;
    await submitListeningAnswer({ sessionId, questionId: q.id, choiceId });
  }

  function guardedGo(to: number) {
    if (!q) return;
    if (!answers[q.id] && to !== current) {
      const ok = window.confirm('현재 문항이 미응답입니다. 이동하시겠습니까?');
      if (!ok) return;
    }
    setCurrent(clamp(to));
  }

  async function finish() {
    const unanswered = track.questions.filter((qq) => !answers[qq.id]).length;
    if (unanswered > 0) {
      const ok = window.confirm(`${unanswered}문항이 미응답입니다. 제출하시겠습니까?`);
      if (!ok) return;
    }
    if (!sessionId) return;
    await finishListeningSession({ sessionId });
    onFinish?.(sessionId);
  }

  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    track.questions.forEach((qq, i) => { map[i] = answers[qq.id] != null; });
    return map;
  }, [track.questions, answers]);

  if (total === 0) return <div className="p-6 text-center text-gray-600">문항이 없습니다.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{track.title} (Test)</h2>
          <LTimer seconds={track.timeLimitSec ?? 600} onExpire={finish} />
        </div>
        <AudioPlayer src={track.audioUrl} />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => guardedGo(i)}
              className={[
                'w-9 h-9 rounded border text-sm',
                i === current ? 'bg-black text-white border-black' : 'bg-white',
                answeredByIndex[i] ? 'border-green-500' : 'border-gray-300',
              ].join(' ')}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{current + 1} / {total} {answers[q?.id ?? ''] ? '' : '· 미응답'}</div>
          <div className="space-x-2">
            <button className="px-3 py-2 rounded border" onClick={() => guardedGo(current - 1)} disabled={current<=0}>&larr; Prev</button>
            {current < total - 1 ? (
              <button className="px-3 py-2 rounded border" onClick={() => guardedGo(current + 1)}>Next &rarr;</button>
            ) : (
              <button className="px-3 py-2 rounded border bg-white/10" onClick={finish}>Finish</button>
            )}
          </div>
        </div>

        {q ? (
          <div className="rounded border p-4 space-y-3">
            <div className="font-medium">{q.prompt}</div>
            <div className="space-y-2">
              {q.choices.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === c.id}
                    onChange={() => pick(c.id)}
                  />
                  <span><span className="font-mono">{c.label}.</span> {c.text}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded bg-amber-50 text-amber-800">현재 인덱스 문항이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
