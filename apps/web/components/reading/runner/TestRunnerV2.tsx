// apps/web/components/reading/runner/TestRunnerV2.tsx
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { RPassage, RQuestion } from '@/models/reading';
import PassagePane from '@/components/reading/PassagePane';
import SkimGate from '@/components/reading/SkimGate';
import { submitReadingAnswer, finishReadingSession } from '@/actions/reading';

type Props = {
  passage: RPassage;
  sessionId: string;
  mode?: 'study' | 'exam' | 'review' | 'test';
  gateFirst?: boolean;
  onFinishAction?: (sessionId: string | number) => void;
};

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

  const contentStr = useMemo(
    () => (Array.isArray(passage.paragraphs) ? passage.paragraphs.join('\n\n') : ''),
    [passage.paragraphs],
  );

  if (!gateDone) {
    return <SkimGate content={contentStr} onUnlockAction={() => setGateDone(true)} />;
  }

  return (
    <RunnerCore
      passage={passage}
      sessionId={sessionId}
      onFinishAction={onFinishAction}
      contentStr={contentStr}
    />
  );
}

function RunnerCore({
  passage,
  sessionId,
  onFinishAction,
  contentStr,
}: {
  passage: RPassage;
  sessionId: string;
  onFinishAction?: (sessionId: string | number) => void;
  contentStr: string;
}) {
  const qs = (passage?.questions ?? []) as RQuestion[];
  const total = qs.length;

  // 인덱스는 네비게이션 시에만 클램프
  const [idx, setIdx] = useState(0);
  const clamp = useCallback(
    (i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1)),
    [total],
  );

  const [showText, setShowText] = useState(false);
  const [picked, setPicked] = useState<Record<string, string | string[]>>({});

  const q = total > 0 ? qs[clamp(idx)] : undefined;
  const qKey = q ? String(q.id) : '';
  const isSummary = q?.type === 'summary';
  const selectionCount = Math.max(1, Number(viewMeta(q).summary.selectionCount ?? 2) || 2);

  const getSelArray = useCallback((): string[] => {
    if (!qKey) return [];
    const v = picked[qKey];
    return Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
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
    [isSummary, selectionCount],
  );

  const canNext = useMemo(() => {
    if (!qKey) return false;
    return isSummary ? getSelArray().length === selectionCount : !!picked[qKey];
  }, [qKey, isSummary, selectionCount, picked, getSelArray]);

  // 렌더 중 impure 호출 금지 → 최초 0으로 세팅 후 tick()에서만 Date.now() 사용
  const lastTickRef = useRef<number>(0);
  const tick = useCallback(() => {
    const now = Date.now();
    if (lastTickRef.current === 0) {
      lastTickRef.current = now;
      return 0;
    }
    const elapsed = now - lastTickRef.current;
    lastTickRef.current = now;
    return Math.max(0, elapsed);
  }, []);

  const submitOne = useCallback(async () => {
    if (!qKey) return;

    if (isSummary) {
      const arr = getSelArray();
      if (arr.length === 0) return;
      await submitReadingAnswer({
        sessionId,
        questionId: qKey,
        choiceId: arr.join('|'),
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
  }, [qKey, picked, sessionId, isSummary, getSelArray, tick]);

  // ✅ React Compiler 경고 회피: 수동 메모이제이션 제거
  const goPrev = () => setIdx((i) => clamp(i - 1));

  // ✅ React Compiler 경고 회피: 수동 메모이제이션 제거
  const next = async () => {
    if (!qKey) return;
    if (!canNext) {
      alert(
        isSummary
          ? `Please select exactly ${selectionCount} choices.`
          : 'Please select an answer before continuing.',
      );
      return;
    }
    await submitOne();
    setShowText(false);
    setIdx((i) => {
      if (i < total - 1) return clamp(i + 1);
      return i;
    });
    // 마지막 문제면 세션 종료
    if (clamp(idx + 1) === idx) {
      await finishReadingSession({ sessionId });
      onFinishAction?.(sessionId);
    }
  };

  const selArr = getSelArray();
  const remaining = isSummary ? selectionCount - selArr.length : 0;

  if (total === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm">
        No questions available. (passage: <b>{passage?.title ?? 'untitled'}</b>)
      </div>
    );
  }

  if (isSummary && showText) {
    const looksLikeHTML = /<[a-z][\s\S]*>/i.test(contentStr);
    return (
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-neutral-500">Summary question — Full Text View</div>
          <button type="button" className="rounded border px-3 py-1" onClick={() => setShowText(false)}>
            View Questions
          </button>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border p-5">
          <h1 className="mb-3 text-2xl font-bold">{passage.title}</h1>
          {looksLikeHTML ? (
            <div dangerouslySetInnerHTML={{ __html: contentStr }} />
          ) : (
            <pre className="whitespace-pre-wrap text-[16px] leading-8">{contentStr}</pre>
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
            Question {q?.number ?? clamp(idx) + 1} / {total}{' '}
            <span className="ml-2 rounded bg-purple-600/20 px-2 py-0.5 text-[11px] text-purple-300">
              Runner V2
            </span>
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
            Select <b>{selectionCount}</b> choices. (Remaining: {remaining})
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
          <button
            type="button"
            className="rounded border px-4 py-2"
            disabled={clamp(idx) === 0}
            onClick={() => setIdx((i) => clamp(i - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className={`rounded border px-4 py-2 ${canNext ? '' : 'cursor-not-allowed opacity-50'}`}
            onClick={next}
            disabled={!canNext}
          >
            {clamp(idx) < total - 1 ? 'Next' : 'Finish'}
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
          {q ? <PassagePane content={contentStr} q={q} /> : null}
        </div>
      </div>
    </div>
  );
}
