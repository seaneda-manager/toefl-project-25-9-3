'use client';

import { useEffect, useMemo, useState } from 'react';
import LTimer from '@/app/components/LTimer';
import {
  startListeningSession,
  submitListeningAnswer,
  finishListeningSession,
} from '@/actions/listening';
import type { ListeningTrack, LQuestion } from '@/types/types-listening';
import { isChoiceCorrect } from '@/types/types-listening';

import TopBar from '@/components/test/TopBar';
import AudioPanel from '@/components/test/AudioPanel';

export default function ListeningStudyRunner({
  track,
  onFinish,
}: {
  track: ListeningTrack | undefined;
  onFinish?: (sessionId: string) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [showCorrect, setShowCorrect] = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  const qs: LQuestion[] = useMemo(() => track?.questions ?? [], [track]);
  const total = qs.length;
  const q: LQuestion | undefined = total > 0 ? qs[current] : undefined;

  useEffect(() => {
    if (total === 0) { setCurrent(0); return; }
    if (current >= total) setCurrent(total - 1);
    if (current < 0) setCurrent(0);
  }, [total, current]);

  // ✅ actions 시그니처에 맞춤: setId + mode: 'p'
  useEffect(() => {
    if (!track?.id) return;
    (async () => {
      const { sessionId: sid } = await startListeningSession({
        setId: (track as any).setId ?? track.id,
        mode: 'p',
      });
      setSessionId(sid);
    })();
  }, [track?.id]);

  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1));

  async function pick(choiceId: string) {
    if (!q) return;
    setAnswers((s) => ({ ...s, [q.id]: choiceId }));
    if (!sessionId) return;

    await submitListeningAnswer({
      sessionId,
      questionId: String(q.id), // ✅ string 요구
      choiceId,
    });
  }

  function guardedGo(to: number) {
    if (total === 0) return;
    setCurrent(clamp(to));
  }

  async function finish() {
    if (!sessionId) return;
    await finishListeningSession({ sessionId });
    onFinish?.(sessionId);
  }

  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    qs.forEach((qq, i) => { map[i] = answers[qq.id] != null; });
    return map;
  }, [qs, answers]);

  const answeredCount = useMemo(
    () => Object.values(answeredByIndex).filter(Boolean).length,
    [answeredByIndex]
  );
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);

  if (!track) {
    return <div className="p-6 text-center text-gray-600">트랙을 불러오는 중이거나 선택되지 않았습니다.</div>;
  }
  if (total === 0) {
    return <div className="p-6 text-center text-gray-600">문항이 없습니다.</div>;
  }

  const choiceLabel = (i: number) => String.fromCharCode(65 + i);
  const limitSec = track.timeLimitSec ?? track.durationSec ?? 600;

  return (
    <div className="space-y-3">
      {/* 진행도 바 */}
      <div className="h-1 rounded bg-gray-200 overflow-hidden">
        <div className="h-1 bg-black" style={{ width: `${progressPct}%` }} />
      </div>

      {/* 상단 바 */}
      <TopBar
        mode="study"
        section="listening"
        qIndex={current}
        total={total}
        onBack={() => guardedGo(current - 1)}
        onNext={() => (current < total - 1 ? guardedGo(current + 1) : finish())}
        onPause={() => {}}
        onReview={() => {}}
        onToggleTime={() => setShowTimer((v) => !v)}
        showTime={showTimer}
      />

      {/* 메인 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* 좌측 패널 */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-auto">
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
              {showTimer && <LTimer seconds={limitSec} onExpire={finish} />}
            </div>
          </div>

          {/* 오디오 패널 */}
          <AudioPanel src={track.audioUrl} allowSeek allowSpeed />

          {/* 번호 네비 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{answeredCount}/{total} answered</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => guardedGo(i)}
                className={[
                  'w-10 h-10 rounded-md border text-sm',
                  i === current ? 'bg-black text-white border-black' : 'bg-white',
                  answeredByIndex[i] ? 'border-green-500' : 'border-gray-300',
                ].join(' ')}
                aria-label={`Go to question ${i + 1}`}
                title={`Question ${qs[i]?.number ?? i + 1}`}
              >
                {qs[i]?.number ?? i + 1}
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
                ← Prev
              </button>
              {current < total - 1 ? (
                <button
                  className="px-3 py-2 rounded border"
                  onClick={() => guardedGo(current + 1)}
                >
                  Next →
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
                {q.choices?.map((c, idx) => {
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
    </div>
  );
}
