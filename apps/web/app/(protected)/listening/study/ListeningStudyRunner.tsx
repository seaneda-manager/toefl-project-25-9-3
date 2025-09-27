'use client';

import { useEffect, useMemo, useState } from 'react';
import AudioPlayer from '@/app/components/AudioPlayer';
import LTimer from '@/app/components/LTimer';
import {
  startListeningSession,
  submitListeningAnswer,
  finishListeningSession,
} from '@/actions/listening';
import type { ListeningTrack, LQuestion } from '@/types/types-listening';
import { isChoiceCorrect } from '@/types/types-listening';

export default function ListeningStudyRunner({
  track,
  onFinish,
}: {
  track: ListeningTrack;
  onFinish?: (sessionId: string) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [showCorrect, setShowCorrect] = useState(true); // 스터디 모드: 기본 표시

  const total = track.questions.length;
  const q: LQuestion | undefined = total > 0 ? track.questions[current] : undefined;

  // 세션 시작: study 모드로 세션 생성
  useEffect(() => {
    (async () => {
      const { sessionId: sid } = await startListeningSession({
        trackId: track.id,
        mode: 'study',
      });
      setSessionId(sid);
    })();
  }, [track.id]);

  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1));

  async function pick(choiceId: string) {
    if (!q) return;
    setAnswers((s) => ({ ...s, [q.id]: choiceId }));
    if (!sessionId) return;

    await submitListeningAnswer({
      sessionId,
      questionId: Number(q.id),
      choiceId,
      // elapsedMs: 필요시 추가
    });
  }

  function guardedGo(to: number) {
    if (!q) return;
    setCurrent(clamp(to));
  }

  async function finish() {
    if (!sessionId) return;
    await finishListeningSession({ sessionId });
    onFinish?.(sessionId);
  }

  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    track.questions.forEach((qq, i) => {
      map[i] = answers[qq.id] != null;
    });
    return map;
  }, [track.questions, answers]);

  if (total === 0) {
    return <div className="p-6 text-center text-gray-600">문항이 없습니다.</div>;
  }

  // 라벨이 타입에 없으므로 인덱스로 A/B/C/D 생성
  const choiceLabel = (i: number) => String.fromCharCode(65 + i);
  // 타임리밋 우선순위: timeLimitSec > durationSec > 기본 600
  const limitSec = track.timeLimitSec ?? track.durationSec ?? 600;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 좌측: 타이머/플레이어/번호 네비 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Listening (Study){' '}
            <span className="text-gray-500 text-sm">#{track.id}</span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              className="px-3 py-1.5 rounded border text-sm"
              onClick={() => setShowCorrect((v) => !v)}
              aria-pressed={showCorrect}
              title="정답 표시 토글"
            >
              {showCorrect ? '정답 숨기기' : '정답 표시'}
            </button>
            <LTimer seconds={limitSec} onExpire={finish} />
          </div>
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
              aria-label={`Go to question ${i + 1}`}
              title={`Question ${track.questions[i]?.number ?? i + 1}`}
            >
              {track.questions[i]?.number ?? i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 우측: 문항/선택지 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {(q?.number ?? current + 1)} / {total}{' '}
            {answers[q?.id ?? ''] ? '' : '미응답'}
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-2 rounded border"
              onClick={() => guardedGo(current - 1)}
              disabled={current <= 0}
            >
              &larr; Prev
            </button>
            {current < total - 1 ? (
              <button
                className="px-3 py-2 rounded border"
                onClick={() => guardedGo(current + 1)}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                className="px-3 py-2 rounded border bg-white/10"
                onClick={finish}
              >
                Finish
              </button>
            )}
          </div>
        </div>

        {q ? (
          <div className="rounded border p-4 space-y-3">
            <div className="font-medium">{q.prompt}</div>
            <div className="space-y-2">
              {q.choices.map((c, idx) => {
                const selected = answers[q.id] === c.id;
                const correct = isChoiceCorrect(q, c.id);

                return (
                  <label key={c.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={selected}
                      onChange={() => pick(c.id)}
                    />
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{choiceLabel(idx)}.</span>
                      <span>{c.text}</span>
                      {showCorrect && correct ? (
                        <span
                          className="inline-flex items-center rounded px-2 py-0.5 text-xs border"
                          aria-label="정답"
                          title="정답"
                        >
                          ✅
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded bg-amber-50 text-amber-800">
            현재 표시할 문항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
