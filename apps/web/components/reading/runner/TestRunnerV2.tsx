'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RPassage, RQuestion } from '@/types/types-reading';
import PassagePane from '@/components/reading/PassagePane';
import SkimGate from '@/components/reading/SkimGate';
import { submitReadingAnswer, finishReadingSession } from '@/actions/readingSession';

type Props = {
  passage: RPassage;
  sessionId: string;
  mode?: 'study' | 'exam' | 'review' | 'test';
  gateFirst?: boolean;
};

// ───────────────── Shell: 게이트만 담당 ─────────────────
export default function TestRunnerV2({ passage, sessionId, gateFirst = true }: Props) {
  const [gateDone, setGateDone] = useState(!gateFirst);
  if (!gateDone) {
    return <SkimGate content={passage.content} onUnlock={() => setGateDone(true)} />;
  }
  return <RunnerCore passage={passage} sessionId={sessionId} />;
}

// ───────────────── Core: 실제 런너 ─────────────────
function RunnerCore({ passage, sessionId }: { passage: RPassage; sessionId: string }) {
  const qs = (passage?.questions ?? []) as RQuestion[];
  const total = qs.length;

  // ✅ 훅은 항상 최상단 고정
  // View Text 페이지 전환 플래그(모달 제거)
  const [showText, setShowText] = useState(false);

  // 진행/선택 상태
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (total === 0) setIdx(0);
    else if (idx >= total) setIdx(total - 1);
  }, [total, idx]);

  const [picked, setPicked] = useState<Record<string, string | string[]>>({});
  const q = total > 0 ? qs[idx] : undefined;

  const isSummary = q?.type === 'summary';
  const selectionCount = Math.max(1, Number(q?.meta?.summary?.selectionCount ?? 2));

  const getSelArray = () => {
    if (!q) return [] as string[];
    const v = picked[q.id];
    return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : []);
  };

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
    if (!q) return false;
    return isSummary ? getSelArray().length === selectionCount : !!picked[q.id];
  }, [q, isSummary, selectionCount, picked]);

  const submitOne = useCallback(async () => {
    if (!q) return;
    if (isSummary) {
      const arr = getSelArray();
      if (!arr.length) return;
      await submitReadingAnswer({ sessionId, questionId: q.id, choiceId: arr[0] });
      return;
    }
    const cid = picked[q.id] as string | undefined;
    if (!cid) return;
    await submitReadingAnswer({ sessionId, questionId: q.id, choiceId: cid });
  }, [q, picked, isSummary, sessionId]);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(async () => {
    if (!q) return;
    if (!canNext) {
      alert(isSummary ? `정확히 ${selectionCount}개를 선택하세요.` : '답을 선택하세요.');
      return;
    }
    await submitOne();
    setShowText(false);
    if (idx < total - 1) setIdx((i) => i + 1);
    else {
      await finishReadingSession({ sessionId });
      alert('제출 완료');
    }
  }, [q, canNext, submitOne, idx, total, sessionId, isSummary, selectionCount]);

  // 키보드 UX (Text 뷰에서는 비활성)
  useEffect(() => {
    if (showText) return; // 전체 본문 보기 중엔 단축키 끔
    const handler = (e: KeyboardEvent) => {
      if (!q) return;
      if (e.key >= '1' && e.key <= '9') {
        const n = Number(e.key) - 1;
        const target = q.choices?.[n];
        if (target) toggle(q.id, target.id);
      } else if (e.key === 'Enter') {
        next();
      } else if (e.key === 'Backspace') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [q, toggle, next, goPrev, showText]);

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

  // ── View Text: 전체 본문 전용 페이지(겹침 없음) ─────────────────────
  if (isSummary && showText) {
    const looksLikeHTML = /<[a-z][\s\S]*>/i.test(passage.content);
    return (
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Summary question • Full Text View
          </div>
          <button
            type="button"
            className="rounded border px-3 py-1"
            onClick={() => setShowText(false)}
          >
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

  // ── 기본: 좌문우지 문제 진행 화면 ───────────────────────────────────
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.4fr)',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      {/* 좌: 문제/보기 */}
      <div style={{ order: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div>
            Question {q!.number} / {total} {badge}
          </div>
          {isSummary && (
            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => setShowText(true)}
            >
              View Text
            </button>
          )}
        </div>

        <h2 className="mt-2 text-lg font-semibold">{q!.stem}</h2>
        {isSummary && (
          <div className="mt-1 text-xs text-neutral-500">
            Select <b>{selectionCount}</b> choices. (남은 개수: {remaining})
          </div>
        )}

        <ul className="mt-3 space-y-2">
          {(q!.choices ?? []).map((c, i) => {
            const checked = isSummary ? selArr.includes(c.id) : picked[q!.id] === c.id;
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 hover:bg-white/5 ${
                    checked ? 'ring-2 ring-purple-400/50' : ''
                  }`}
                >
                  <input
                    type={isSummary ? 'checkbox' : 'radio'}
                    name={`q-${q!.id}`}
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggle(q!.id, c.id)}
                    aria-label={`Choice ${i + 1}`}
                  />
                  <span className="leading-7">{c.text}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex justify-between">
          <button className="rounded border px-4 py-2" disabled={idx === 0} onClick={goPrev}>
            Prev
          </button>
          <button
            className={`rounded border px-4 py-2 ${canNext ? '' : 'cursor-not-allowed opacity-50'}`}
            onClick={next}
            disabled={!canNext}
          >
            {idx < total - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>

      {/* 우: 지문 - sticky 고정 + 독립 스크롤 */}
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
          <PassagePane content={passage.content} q={q!} />
        </div>
      </div>
    </div>
  );
}
