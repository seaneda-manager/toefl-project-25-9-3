// apps/web/components/reading/runner/TestRunnerV2.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RPassage, RQuestion } from '@/lib/readingSchemas';
import PassagePane from '@/components/reading/PassagePane';
import SkimGate from '@/components/reading/SkimGate';
import { submitReadingAnswer, finishReadingSession } from '@/actions/readingSession';

type Props = {
  passage: RPassage;
  sessionId: string;
  mode?: 'study' | 'exam' | 'review' | 'test';
  gateFirst?: boolean;
  /** 완료 시 상위로 세션ID 전달 (라우팅 등은 상위에서 처리) */
  onFinishAction?: (sessionId: string | number) => void;
};

// 메타 요약 뷰어
function viewMeta(q?: RQuestion) {
  const summary = (q?.meta?.summary ?? {}) as {
    candidates?: string[];
    correct?: number[];
    selectionCount?: number;
  };
  const insertion = (q?.meta?.insertion ?? {}) as {
    anchors?: Array<string | number>;
    correctIndex?: number;
  };
  const pronoun = (q?.meta?.pronoun_ref ?? {}) as {
    pronoun?: string;
    referents?: string[];
    correctIndex?: number;
  };
  return { summary, insertion, pronoun };
}

export default function TestRunnerV2({
  passage,
  sessionId,
  gateFirst = true,
  onFinishAction,
}: Props) {
  const [gateDone, setGateDone] = useState(!gateFirst);
  if (!gateDone) {
    return (
      <SkimGate
        content={passage.content}
        onUnlockAction={() => setGateDone(true)}  // ✅ 이름 변경
      />
    );
  }
  return (
    <RunnerCore
      passage={passage}
      sessionId={sessionId}
      onFinishAction={onFinishAction}
    />
  );
}

// Core: 실제 러너
function RunnerCore({
  passage,
  sessionId,
  onFinishAction,
}: {
  passage: RPassage;
  sessionId: string;
  onFinishAction?: (sessionId: string | number) => void;
}) {
  const qs = (passage?.questions ?? []) as RQuestion[];
  const total = qs.length;

  const [showText, setShowText] = useState(false);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (total === 0) setIdx(0);
    else if (idx >= total) setIdx(total - 1);
    else if (idx < 0) setIdx(0);
  }, [total, idx]);

  const [picked, setPicked] = useState<Record<string, string | string[]>>({});
  const q = total > 0 ? qs[idx] : undefined;
  const qKey = q ? String(q.id) : '';

  const isSummary = q?.type === 'summary';
  const selectionCount = Math.max(1, Number(viewMeta(q).summary.selectionCount ?? 2) || 2);

  const getSelArray = useCallback((): string[] => {
    if (!qKey) return [];
    const v = picked[qKey];
    return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : []);
  }, [qKey, picked]);

  const toggle = useCallback(
    (qid: string, cid: string) => {
      setPicked((s) => {
        const cur = s[qid];
        if (isSummary) {
          const arr = Array.isArray(cur) ? [...cur] : [];
          const i = arr.indexOf(cid);
          if (i >= 0) {
            arr.splice(i, 1);
            return { ...s, [qid]: arr };
          }
          if (arr.length >= selectionCount) return s;
          return { ...s, [qid]: [...arr, cid] };
        }
        return s[qid] === cid ? s : { ...s, [qid]: cid };
      });
    },
    [isSummary, selectionCount]
  );

  const canNext = useMemo(() => {
    if (!qKey) return false;
    return isSummary ? getSelArray().length === selectionCount : !!picked[qKey];
  }, [qKey, isSummary, selectionCount, picked, getSelArray]);

  const lastTickRef = useRef<number>(Date.now());
  const tick = () => {
    const now = Date.now();
    const elapsed = now - lastTickRef.current;
    lastTickRef.current = now;
    return Math.max(0, elapsed);
  };

  const submitOne = useCallback(async () => {
    if (!qKey) return;

    if (isSummary) {
      const arr = getSelArray();
      if (arr.length === 0) return;
      const serialized = arr.join('|');
      await submitReadingAnswer({
        sessionId,
        questionId: qKey,
        choiceId: serialized,
        elapsedMs: tick(),
      });
      return;
    }

    const cid = picked[qKey] as string | undefined;
    if (!cid) return;

    await submitReadingAnswer({
      sessionId,
      questionId: qKey,
      choiceId: cid,
      elapsedMs: tick(),
    });
  }, [qKey, picked, sessionId, isSummary, getSelArray]);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(async () => {
    if (!qKey) return;
    if (!canNext) {
      alert(isSummary ? `정확히 ${selectionCount}개를 선택해 주세요.` : '답안을 선택해 주세요.');
      return;
    }
    await submitOne();
    setShowText(false);
    if (idx < total - 1) setIdx((i) => i + 1);
    else {
      await finishReadingSession({ sessionId });
      onFinishAction?.(sessionId);
    }
  }, [qKey, canNext, submitOne, idx, total, sessionId, isSummary, selectionCount, onFinishAction]);

  useEffect(() => {
    if (showText) return;
    const handler = (e: KeyboardEvent) => {
      if (!qKey || !q) return;
      if (e.key >= '1' && e.key <= '9') {
        const n = Number(e.key) - 1;
        const target = (q.choices ?? [])[n];
        if (target) toggle(qKey, target.id);
      } else if (e.key === 'Enter') {
        void next();
      } else if (e.key === 'Backspace') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [q, qKey, toggle, next, goPrev, showText]);

  const badge = useMemo(
    () => (
      <span className="ml-2 rounded bg-purple-600/20 px-2 py-0.5 text-[11px] text-purple-300">
        Runner V2
      </span>
    ),
    []
  );

  if (total === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm">
        로드된 문항이 없습니다. (passage: <b>{passage?.title ?? 'untitled'}</b>)
      </div>
    );
  }

  const selArr = getSelArray();
  const remaining = isSummary ? selectionCount - selArr.length : 0;

  if (isSummary && showText) {
    const looksLikeHTML = /<[a-z][\s\S]*>/i.test(passage.content);
    return (
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-neutral-500">Summary question · Full Text View</div>
          <button type="button" className="rounded border px-3 py-1" onClick={() => setShowText(false)}>
            View Questions
          </button>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border p-5">
          <h1 className="mb-3 text-2xl font-bold">{passage.title}</h1>
          {looksLikeHTML ? (
            <div dangerouslySetInnerHTML={{ __html: passage.content }} />
          ) : (
            <pre className="whitespace-pre-wrap text-[16px] leading-8">{passage.content}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.4fr)',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      <div style={{ order: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div>
            Question {q?.number ?? 0} / {total} {badge}
          </div>
          {isSummary && (
            <button type="button" className="rounded border px-3 py-1" onClick={() => setShowText(true)}>
              View Text
            </button>
          )}
        </div>

        <h2 className="mt-2 text-lg font-semibold">{q?.stem ?? ''}</h2>
        {isSummary && (
          <div className="mt-1 text-xs text-neutral-500">
            Select <b>{selectionCount}</b> choices. (남은 선택: {remaining})
          </div>
        )}

        <ul className="mt-3 space-y-2">
          {(q?.choices ?? []).map((c: any, i: number) => {
            const checked = isSummary ? selArr.includes(c.id) : picked[qKey] === c.id;
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 hover:bg-white/5 ${
                    checked ? 'ring-2 ring-purple-400/50' : ''
                  }`}
                >
                  <input
                    type={isSummary ? 'checkbox' : 'radio'}
                    name={`q-${qKey || 'none'}`}
                    className="mt-1"
                    checked={checked}
                    onChange={() => qKey && toggle(qKey, c.id)}
                    aria-label={`Choice ${i + 1}`}
                  />
                  <span className="leading-7">{c.text}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex justify-between">
          <button type="button" className="rounded border px-4 py-2" disabled={idx === 0} onClick={goPrev}>
            Prev
          </button>
          <button
            type="button"
            className={`rounded border px-4 py-2 ${canNext ? '' : 'cursor-not-allowed opacity-50'}`}
            onClick={next}
            disabled={!canNext}
          >
            {idx < total - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>

      <div
        style={{
          order: 2,
          position: 'sticky',
          top: '1rem',
          height: 'calc(100vh - 2rem)',
          overflow: 'auto',
        }}
      >
        <div className="rounded-2xl border p-4">
          {q ? <PassagePane content={passage.content} q={q} /> : null}
        </div>
      </div>
    </div>
  );
}
