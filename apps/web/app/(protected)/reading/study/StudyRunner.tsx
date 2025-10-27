// apps/web/components/reading/StudyRunner.tsx (?덉떆 寃쎈줈, ?ㅼ젣 ?꾩튂 ?좎?)
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

  // ?몄뀡 ?쒖옉 (study 紐⑤뱶)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // ?쒕쾭 ?≪뀡 ?쒓렇?덉쿂??留욎떠 ?꾩슂 ??setId??媛숈씠 ?섍린?몄슂.
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

  // ?좏깮 & ?쒖텧
  const pick = useCallback(
    async (questionId: string, choiceId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
      // ?몄뀡???꾩쭅 ?놁쑝硫??쒖텧? ?ㅽ궢(濡쒖뺄 ?곹깭留?諛섏쁺)
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
      // ??finishReadingSession? 媛앹껜 ?몄옄瑜?諛쏅룄濡??섏젙
      await finishReadingSession({ sessionId });
    }
    // TODO: 醫낅즺 ???쇱슦??由щ럭 ?섏씠吏 ?대룞 ???꾩슂 ??異붽?
  }, [sessionId]);

  if (!q) {
    return <div className="p-4 text-sm text-gray-500">臾명빆???놁뒿?덈떎.</div>;
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
            {q.number ? `${q.number}. ` : ''}{q.stem ?? '臾명빆'}
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
            title={sessionId ? 'Finish session' : '?몄뀡 ?앹꽦 以묅?}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}


