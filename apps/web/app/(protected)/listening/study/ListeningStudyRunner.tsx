// apps/web/app/(protected)/listening/study/ListeningStudyRunner.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LTimer from '@/components/LTimer';
import {
  startListeningSession,
  submitListeningAnswer,
  finishListeningSession,
} from '@/actions/listening';
import type { ListeningTrack, LQuestion } from '@/types/types-listening';
import { isChoiceCorrect } from '@/types/types-listening';

import TopBar from '@/components/test/TopBar';
import AudioPanel from '@/components/test/AudioPanel';

type Props = {
  track: ListeningTrack | undefined;
  onFinish?: (sessionId: string) => void;
};

// ✅ LChoice 별칭: LQuestion의 choices 원소 타입을 안전하게 추출
type LChoice = NonNullable<LQuestion['choices']>[number];

export default function ListeningStudyRunner({ track, onFinish }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [showCorrect, setShowCorrect] = useState<boolean>(true);
  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [startErr, setStartErr] = useState<string | null>(null);

  // 문제 배열
  const qs: LQuestion[] = useMemo(() => track?.questions ?? [], [track]);
  const total: number = qs.length;
  const q: LQuestion | undefined = total > 0 ? qs[current] : undefined;
  const qKey: string = q ? String(q.id) : '';

  // 인덱스 보정
  const clamp = useCallback(
    (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1)),
    [total]
  );

  // 총문항 변동 시 현재 인덱스 보정
  useEffect(() => {
    if (total === 0) {
      setCurrent(0);
      return;
    }
    if (current >= total) setCurrent(total - 1);
    if (current < 0) setCurrent(0);
  }, [total, current]);

  // 트랙 변경 시 상태 초기화
  useEffect(() => {
    setCurrent(0);
    setAnswers({});
    setShowTimer(true);
  }, [track]);

  // 중복 시작 방지
  const startedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!track?.id) return;
    if (startedForIdRef.current === track.id) return;
    (async () => {
      try {
        setStartErr(null);
        const { sessionId: sid } = await startListeningSession({
          setId: (track as any).setId ?? track.id,
          mode: 'p', // practice
        });
        setSessionId(sid);
        startedForIdRef.current = track.id;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to start session';
        setStartErr(msg);
      }
    })();
  }, [track?.id, track]);

  const pick = useCallback(
    async (choiceId: string) => {
      if (!q) return;
      const key = String(q.id);
      setAnswers((s) => ({ ...s, [key]: choiceId }));
      if (!sessionId) return;

      try {
        await submitListeningAnswer({
          sessionId,
          questionId: key,
          choiceId,
        });
      } catch {
        // 실패해도 UI는 낙관적으로 유지 (필요 시 상위에서 재동기화)
      }
    },
    [q, sessionId]
  );

  const guardedGo = useCallback(
    (to: number) => {
      if (total === 0) return;
      setCurrent(clamp(to));
    },
    [clamp, total]
  );

  const finish = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishListeningSession({ sessionId });
    } finally {
      onFinish?.(sessionId);
    }
  }, [onFinish, sessionId]);

  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    qs.forEach((qq, i) => {
      map[i] = answers[String(qq.id)] != null;
    });
    return map;
  }, [qs, answers]);

  const answeredCount = useMemo(
    () => Object.values(answeredByIndex).filter(Boolean).length,
    [answeredByIndex]
  );
  const progressPct = Math.round((answeredCount / Math.max(1, total)) * 100);

  if (!track) {
    return (
      <div className="p-6 text-center text-gray-600">
        트랙을 불러오지 못했거나 선택되지 않았습니다.
      </div>
    );
  }
  if (total === 0) {
    return <div className="p-6 text-center text-gray-600">문항이 없습니다.</div>;
  }

  const choiceLabel = (i: number) => String.fromCharCode(65 + i);
  const limitSec = track.timeLimitSec ?? track.durationSec ?? 600;

  return (
    <div className="space-y-3">
      {/* 진행도 바 */}
      <div className="h-1 overflow-hidden rounded bg-gray-200" aria-hidden>
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

      {/* 세션 시작 에러 */}
      {startErr && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          세션 시작 실패: {startErr}
        </div>
      )}

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        {/* 좌측 패널 */}
        <div className="lg:sticky lg:top-4 lg:max-h=[calc(100vh-5rem)] lg:overflow-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Listening (Study){' '}
              <span className="text-sm text-gray-500">#{track.id}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border px-3 py-1.5 text-sm"
                onClick={() => setShowCorrect((v) => !v)}
                aria-pressed={showCorrect}
                title="정답 표기 토글"
              >
                {showCorrect ? '정답 숨기기' : '정답 보이기'}
              </button>
              {showTimer && (
                <LTimer key={track.id} seconds={limitSec} onExpire={finish} />
              )}
            </div>
          </div>

          {/* 오디오 패널 */}
          <div className="mt-4">
            <AudioPanel key={track.id} src={track.audioUrl} allowSeek allowSpeed />
          </div>

          {/* 답안 개수 */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {answeredCount}/{total} answered
            </span>
          </div>

          {/* 넘버 패드 */}
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => guardedGo(i)}
                className={[
                  'h-10 w-10 rounded-md border text-sm',
                  i === current ? 'border-black bg-black text-white' : 'bg-white',
                  answeredByIndex[i] ? 'border-green-500' : 'border-gray-300',
                ].join(' ')}
                aria-current={i === current ? 'page' : undefined}
                aria-label={`Go to question ${i + 1}`}
                title={`Question ${qs[i]?.number ?? i + 1}`}
              >
                {qs[i]?.number ?? i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 우측: 문제/선지 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {(q?.number ?? current + 1)} / {total}{' '}
              {answers[qKey] ? '' : '미응답'}
            </div>
            <div className="space-x-2">
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={() => guardedGo(current - 1)}
                disabled={current <= 0}
              >
                ◀ Prev
              </button>
              {current < total - 1 ? (
                <button
                  type="button"
                  className="rounded border px-3 py-2"
                  onClick={() => guardedGo(current + 1)}
                >
                  Next ▶
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded border bg-white/10 px-3 py-2"
                  onClick={finish}
                  disabled={!sessionId}
                  title={sessionId ? undefined : '세션 시작 대기 중'}
                >
                  Finish
                </button>
              )}
            </div>
          </div>

          {q ? (
            <div className="space-y-3 rounded border p-4">
              <div className="font-medium">{q.prompt}</div>
              <div className="space-y-2">
                {q.choices?.map((c: LChoice, idx: number) => {
                  const selected = answers[qKey] === c.id;
                  const correct = isChoiceCorrect(q, c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${qKey}`}
                        checked={selected}
                        onChange={() => pick(c.id)}
                      />
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{choiceLabel(idx)}.</span>
                        <span>{c.text}</span>
                        {showCorrect && correct ? (
                          <span
                            className="inline-flex items-center rounded border px-2 py-0.5 text-xs"
                            aria-label="정답"
                            title="정답"
                          >
                            ✓
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded bg-amber-50 p-4 text-amber-800">
              현재 표시할 문제가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
