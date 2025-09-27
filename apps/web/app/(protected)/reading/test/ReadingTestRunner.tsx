// apps/web/app/(protected)/reading/test/ReadingTestRunner.tsx
'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import type { Passage, Question } from '@/app/types/types-reading';
import { submitReadingAnswer, finishReadingSession } from '@/actions/reading';

/** ─────────────────────────────────────────────────────────────
 *  Safe extractors (런타임 헬퍼)
 *  - 타입 정의에 없는 필드를 직접 접근하지 않고 여기서만 느슨하게 처리
 *  ───────────────────────────────────────────────────────────── */
function getPrompt(q: unknown): string {
  if (q && typeof q === 'object') {
    const o = q as Record<string, any>;
    return o.prompt ?? o.stem ?? o.text ?? o.title ?? '';
  }
  return '';
}

type Choice = { id: string | number; text?: string; label?: string };

function getChoices(q: unknown): Choice[] {
  if (!q || typeof q !== 'object') return [];
  const o = q as Record<string, any>;
  const arr: any[] = Array.isArray(o.choices) ? o.choices : [];
  return arr.map((c) => ({
    id: (c?.id ?? c?.value ?? c?.key ?? c?.label ?? c?.text ?? '').toString(),
    text: c?.text ?? c?.label ?? (typeof c === 'string' ? c : ''),
    label: c?.label,
  }));
}

function normalizeKey(v: unknown): string {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : String(v);
}

// Passage에 text, title이 없을 수도 있으니 안전 추출
function getPassageText(p: unknown): string {
  if (p && typeof p === 'object') {
    const o = p as Record<string, any>;
    // 프로젝트별 실제 키명에 맞춰 우선순위를 정해둠
    return o.text ?? o.content ?? o.body ?? o.passage ?? o.html ?? '';
  }
  return '';
}

function getPassageTitle(p: unknown): string {
  if (p && typeof p === 'object') {
    const o = p as Record<string, any>;
    return o.title ?? o.name ?? o.passage_title ?? '';
  }
  return '';
}

/** Props */
type Props = {
  sessionId: string;
  passage: Passage;
};

export default function ReadingTestRunner({ sessionId, passage }: Props) {
  // 답안 상태: question.id → choice.id
  const [answers, setAnswers] = useState<Record<number | string, string>>({});
  // 각 문항 시작 시각 (elapsedMs 계산용)
  const startedAtRef = useRef<Record<number | string, number>>({});

  const questions = useMemo(() => (passage?.questions ?? []) as Question[], [passage]);
  const total = questions.length;
  const answered = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] !== '').length,
    [answers]
  );

  const passageTitle = useMemo(() => getPassageTitle(passage), [passage]);
  const passageText = useMemo(() => getPassageText(passage), [passage]);

  /** 문항에 처음 포커스될 때 시작 시각 기록 */
  const onFocusQuestion = useCallback((qid: number | string) => {
    if (!startedAtRef.current[qid]) {
      startedAtRef.current[qid] = Date.now();
    }
  }, []);

  /** 보기 선택 → 로컬 상태 반영 + 서버 업서트 */
  const onSelect = useCallback(
    async (qid: number | string, cid: string) => {
      // 로컬 업데이트
      setAnswers((prev) => ({ ...prev, [qid]: cid }));

      // 경과시간 계산
      const started = startedAtRef.current[qid];
      const elapsedMs = started ? Date.now() - started : undefined;

      // questionId 숫자 변환(가능하면)
      const qnum = typeof qid === 'number' ? qid : Number(qid);

      try {
        await submitReadingAnswer({
          sessionId: Number(sessionId),
          questionId: Number.isFinite(qnum) ? qnum : String(qid),
          choiceId: cid,
          elapsedMs,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('submitReadingAnswer failed', e);
      } finally {
        // 다음 측정을 위해 시작 시각 리셋
        startedAtRef.current[qid] = Date.now();
      }
    },
    [sessionId]
  );

  /** 세션 종료 */
  const handleFinish = useCallback(async () => {
    try {
      await finishReadingSession({ sessionId: Number(sessionId) });
      alert(`Submitted ${answered}/${total} answers. Session finished.`);
      // 필요시 리뷰 페이지로 이동:
      // window.location.href = `/app/(protected)/reading/review/${sessionId}`;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('finishReadingSession failed', e);
      alert('Finish failed. Please try again.');
    }
  }, [answered, total, sessionId]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Reading Test</h1>
        <p className="text-sm opacity-70">
          Session: {sessionId} · Progress: {answered}/{total}
        </p>
        {passageTitle ? <h2 className="text-xl font-semibold">{passageTitle}</h2> : null}
      </header>

      {passageText ? (
        <article className="prose max-w-none bg-white rounded-lg border p-4">
          <pre className="whitespace-pre-wrap font-sans">{passageText}</pre>
        </article>
      ) : null}

      <section className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const prompt = getPrompt(q);
          const qid = q?.id ?? idx + 1;
          const choiceList = getChoices(q);
          const selected = answers[qid] ?? '';
          return (
            <QuestionCard
              key={qid}
              index={idx + 1}
              qid={qid}
              prompt={prompt}
              choices={choiceList}
              selected={selected}
              onFocusQuestion={onFocusQuestion}
              onSelect={onSelect}
            />
          );
        })}
      </section>

      <footer className="pt-4">
        <button
          type="button"
          onClick={handleFinish}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Finish
        </button>
      </footer>
    </div>
  );
}

function QuestionCard(props: {
  index: number;
  qid: number | string;
  prompt: string;
  choices: Choice[];
  selected: string;
  onFocusQuestion: (qid: number | string) => void;
  onSelect: (qid: number | string, cid: string) => void;
}) {
  const { index, qid, prompt, choices, selected, onFocusQuestion, onSelect } = props;

  return (
    <div
      className="rounded-lg border p-4"
      onMouseEnter={() => onFocusQuestion(qid)}
      onFocus={() => onFocusQuestion(qid)}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold mb-1">Question {index}</div>
        <div className="whitespace-pre-wrap">{prompt || <span className="opacity-60">—</span>}</div>
      </div>

      <div className="space-y-2">
        {choices.length === 0 ? (
          <div className="text-sm opacity-60">No choices.</div>
        ) : (
          choices.map((c, i) => {
            const cid = normalizeKey(c.id);
            const label = c.text ?? c.label ?? cid;
            const inputId = `q-${qid}-c-${cid}`;
            return (
              <label
                key={cid || i}
                htmlFor={inputId}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  id={inputId}
                  type="radio"
                  name={`q-${qid}`}
                  className="mt-1"
                  checked={selected === cid}
                  onChange={() => onSelect(qid, cid)}
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
