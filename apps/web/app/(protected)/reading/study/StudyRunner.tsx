// apps/web/components/reading/StudyRunner.tsx (예시 경로, 실제 위치 유지)
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { startReadingSession, submitReadingAnswer, finishReadingSession } from '@/actions/reading';

type RChoice = { id: string; label?: string; text?: string; is_correct?: boolean };
type RQuestion = { id: string; number?: number; stem?: string; choices?: RChoice[] };
type Passage = { id: string; title?: string; content?: string; questions?: RQuestion[] };

export default function StudyRunner({ passage }: { passage: Passage }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = useMemo<RQuestion[]>(
    () => Array.isArray(passage.questions) ? [...passage.questions] : [],
    [passage.questions]
  );

  const total = questions.length;
  const q = questions[current];

  // 세션 시작 (study 모드)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // 서버 액션 시그니처에 맞춰 필요 시 setId도 같이 넘기세요.
        const res = await startReadingSession({ passageId: String(passage.id), mode: 'study' as const });
        if (active) {
          const sid = (res && 'sessionId' in res) ? String(res.sessionId) : null;
          setSessionId(sid ?? `local-${Date.now()}`);
        }
      } catch {
        if (active) setSessionId(`local-${Date.now()}`);
      }
    })();
    return () => { active = false; };
  }, [passage.id]);

  // 선택 & 제출
  const pick = useCallback(
    async (questionId: string, choiceId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
      // 세션이 아직 없으면 제출은 스킵(로컬 상태만 반영)
      if (!sessionId) return;
      await submitReadingAnswer({
        sessionId,
        questionId: String(questionId),
        choiceId: String(choiceId),
      });
    },
    [sessionId]
  );

  const onFinish = useCallback(async () => {
    if (sessionId) {
      // ✅ finishReadingSession은 객체 인자를 받도록 수정
      await finishReadingSession({ sessionId });
    }
    // TODO: 종료 후 라우팅/리뷰 페이지 이동 등 필요 시 추가
  }, [sessionId]);

  if (!q) {
    return <div className="p-4 text-sm text-gray-500">문항이 없습니다.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{passage.title ?? 'Passage'}</h2>
        <div className="prose whitespace-pre-wrap">{passage.content ?? ''}</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {Math.min(current + 1, total)} / {total}
          </div>
          <div className="space-x-2">
            <button
              className="rounded-xl border px-3 py-2"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current <= 0}
            >
              &larr; Prev
            </button>
            <button
              className="rounded-xl border px-3 py-2"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current >= total - 1}
            >
              Next &rarr;
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 font-medium">
            {q.number ? `${q.number}. ` : ''}{q.stem ?? '문항'}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {(q.choices ?? []).map((c) => {
              const selected = answers[q.id] === c.id;
              return (
                <button
                  key={c.id}
                  className={`rounded-md border px-3 py-2 text-left ${selected ? 'bg-black text-white' : 'bg-white'}`}
                  onClick={() => pick(String(q.id), String(c.id))}
                >
                  {c.label ? `${c.label}. ` : ''}{c.text ?? ''}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="rounded-xl border px-4 py-2"
            onClick={onFinish}
            disabled={!sessionId}
            title={sessionId ? 'Finish session' : '세션 생성 중…'}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
