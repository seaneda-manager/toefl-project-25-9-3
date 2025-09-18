'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Timer from '../components/Timer';
import PassagePane from '../components/PassagePane';
import QuestionCard from '../components/QuestionCard';
import QuestionNav from '../components/QuestionNav';

import {
  startReadingSession,
  submitReadingAnswer,
  finishReadingSession,
} from '@/actions/reading';
import type { Passage, Question } from '@/types/types-reading';

const TEST_SECONDS = 18 * 60; // 기본 18분

export default function TestRunner({ passage }: { passage: Passage }) {
  const router = useRouter();

  // 문항 정렬 후 상위 10개만 사용
  const questions = useMemo(
    () =>
      [...(passage.questions ?? [])]
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .slice(0, 10),
    [passage.questions]
  );
  const total = questions.length;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});

  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1));

  // 세션 시작
  useEffect(() => {
    (async () => {
      const { sessionId } = await startReadingSession({
        passageId: passage.id,
        mode: 'test',
      });
      setSessionId(sessionId);
    })();
  }, [passage.id]);

  // 총 문항 수 변경 시 현재 인덱스 보정
  useEffect(() => {
    setCurrent((c) => clamp(c));
  }, [total]);

  // 현재 문항 (없을 수도 있음)
  const q: Question | undefined = total > 0 ? questions[current] : undefined;

  // 선지 선택
  async function pick(choiceId: string) {
    if (!q) return;
    setAnswers((s) => ({ ...s, [q.id]: choiceId })); // UI 먼저 반영
    if (!sessionId) return;
    // ✅ positional 인자로 호출 (sessionId, questionId, choiceId)
    await submitReadingAnswer(sessionId, q.id, choiceId);
  }

  // 종료
  async function finish() {
    if (!sessionId) return;
    // ✅ positional 인자로 호출 (sessionId)
    await finishReadingSession(sessionId);
    router.push(`/reading/review/${sessionId}`);
  }

  // 인덱스별 응답 여부
  const answeredByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    questions.forEach((qq, idx) => {
      map[idx] = answers[qq.id] != null;
    });
    return map;
  }, [questions, answers]);

  if (total === 0) {
    return <div className="p-6 text-center text-gray-600">문항이 없습니다.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 좌측: 타이머 + 지문 + 내비게이션 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Test Mode ({total})</div>
          <Timer seconds={TEST_SECONDS} onExpire={finish} />
        </div>

        {/* ✅ string 보장 */}
        <PassagePane title={passage.title ?? ''} content={passage.content ?? ''} />

        <QuestionNav
          total={total}
          current={current}
          onPrev={() => setCurrent((c) => clamp(c - 1))}
          onNext={() => setCurrent((c) => clamp(c + 1))}
          onJump={(i: number) => setCurrent(clamp(i))} 
          answered={answeredByIndex}
          // labels={questions.map((qq, i) => qq.number ?? i + 1)}
        />
      </div>

      {/* 우측: 현재 문항 카드 + 이동/종료 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {current + 1} / {total}
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-2 rounded-xl border"
              onClick={() => setCurrent((c) => clamp(c - 1))}
              disabled={current <= 0}
            >
              &larr; Prev
            </button>

            {current < total - 1 ? (
              <button
                className="px-3 py-2 rounded-xl border"
                onClick={() => setCurrent((c) => clamp(c + 1))}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                className="px-3 py-2 rounded-xl border bg-white/10"
                onClick={finish}
              >
                Finish
              </button>
            )}
          </div>
        </div>

        {q ? (
          <QuestionCard
            key={q.id}
            q={q}
            disabled={false}
            selected={answers[q.id] ?? null}
            onChange={pick}
            showFeedback={false}
          />
        ) : (
          <div className="p-4 rounded bg-amber-50 text-amber-800">
            현재 인덱스에 해당하는 문항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
