// apps/web/components/reading/ReadingStudyRunner.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { RPassage, RQuestion } from '@/types/types-reading';

type SubmitArgs = { sessionId: string; questionId: string; choiceId: string };
type FinishArgs = { sessionId: string };

export type ReadingStudyRunnerProps = {
  passage: RPassage;
  mode?: 'study' | 'test';
  /** If provided, runner will use this sessionId directly and skip onStart */
  sessionId?: string;
  onStart?: () => Promise<string> | string;

  /** ✅ 권장: { ok: true } 반환 */
  onAnswer?: (args: SubmitArgs) => Promise<{ ok: true }> | { ok: true };
  onFinish?: (args: FinishArgs) => Promise<{ ok: true }> | { ok: true };

  /** ⬅️ 구버전 호환(반환값 없음): 있으면 onAnswer 없을 때만 사용 */
  onSubmitAnswer?: (args: SubmitArgs) => Promise<void> | void;
};

export default function ReadingStudyRunner({
  passage,
  mode = 'study',
  sessionId: sessionIdProp,
  onStart,
  onAnswer,
  onFinish,
  onSubmitAnswer, // back-compat
}: ReadingStudyRunnerProps) {
  const [sessionId, setSessionId] = useState<string | null>(sessionIdProp ?? null);
  const [current, setCurrent] = useState(0);
  const qs = (passage.questions ?? []) as RQuestion[];
  const q = qs[current];

  // 세션 준비
  useEffect(() => {
    let mounted = true;
    if (sessionIdProp != null) {
      setSessionId(sessionIdProp);
      return () => { mounted = false; };
    }
    (async () => {
      if (!onStart) return;
      const sid = await onStart();
      if (mounted) setSessionId(String(sid));
    })();
    return () => { mounted = false; };
  }, [onStart, sessionIdProp]);

  const handleSelect = useCallback(
    async (choiceId: string) => {
      if (!q || sessionId == null) return;
      if (onAnswer) {
        await onAnswer({ sessionId, questionId: q.id, choiceId });
      } else if (onSubmitAnswer) {
        await onSubmitAnswer({ sessionId, questionId: q.id, choiceId });
      }
    },
    [q, sessionId, onAnswer, onSubmitAnswer]
  );

  const next = useCallback(() => {
    if (current < qs.length - 1) setCurrent((c) => c + 1);
  }, [current, qs.length]);

  const finish = useCallback(async () => {
    if (sessionId == null) return;
    if (onFinish) await onFinish({ sessionId });
  }, [onFinish, sessionId]);

  const isLast = current === qs.length - 1;

  if (!q) {
    return (
      <div className="rounded-xl border p-4 text-sm">
        로드된 문항이 없습니다. (passage: <b>{passage?.title ?? 'untitled'}</b>)
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left: Question & choices */}
      <div className="space-y-3 border-r pr-4">
        <div className="text-sm opacity-70">Mode: {mode}</div>
        <h2 className="text-xl font-semibold">
          Q{q.number}. {q.stem}
        </h2>
        <ul className="space-y-2">
          {(q.choices ?? []).map((c) => (
            <li key={c.id}>
              <button
                className="w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50"
                onClick={() => handleSelect(c.id)}
              >
                {c.text}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 pt-2">
          {!isLast && (
            <button className="rounded-xl border px-3 py-2" onClick={next}>
              Next
            </button>
          )}
          {isLast && (
            <button className="rounded-xl border px-3 py-2" onClick={finish}>
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Right: Passage */}
      <div className="prose max-w-none">
        <h1 className="mb-2 text-2xl font-bold">{passage.title}</h1>
        {/<[a-z][\s\S]*>/i.test(passage.content) ? (
          <div dangerouslySetInnerHTML={{ __html: passage.content }} />
        ) : (
          <pre className="whitespace-pre-wrap">{passage.content}</pre>
        )}
      </div>
    </div>
  );
}
