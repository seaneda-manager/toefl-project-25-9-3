// apps/web/app/(protected)/reading/test/ReadingTestRunner.tsx
'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import type { RPassage, RQuestion } from '@/models/reading';
import { submitReadingAnswer, finishReadingSession } from '@/actions/reading';

/** === Safe helpers === */
function getPrompt(q: unknown): string {
  if (q && typeof q === 'object') {
    const o = q as Record<string, any>;
    return o.stem ?? o.prompt ?? o.text ?? o.title ?? '';
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

function getPassageText(p: unknown): string {
  if (p && typeof p === 'object') {
    const o = p as Record<string, any>;
    return o.content ?? o.text ?? o.body ?? o.passage ?? o.html ?? '';
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
  passage: RPassage;
};

export default function ReadingTestRunner({ sessionId, passage }: Props) {
  // 濡쒖뺄 ?곹깭: question.id -> choice.id
  const [answers, setAnswers] = useState<Record<number | string, string>>({});
  // 媛?臾명빆 理쒖큹 ?ъ빱???쒖젏(ms)
  const startedAtRef = useRef<Record<number | string, number>>({});

  const questions = useMemo<RQuestion[]>(
    () => [...(passage?.questions ?? [])],
    [passage]
  );
  const total = questions.length;

  // Object.entries濡?怨꾩궛?섏뿬 ?몃뜳?????寃쎄퀬 ?뚰뵾
  const answered = useMemo(
    () => Object.entries(answers).filter(([, v]) => v !== '').length,
    [answers]
  );

  const passageTitle = useMemo(() => getPassageTitle(passage), [passage]);
  const passageText = useMemo(() => getPassageText(passage), [passage]);

  // ?ъ빱???쒓컙 湲곕줉
  const onFocusQuestion = useCallback((qid: number | string) => {
    if (!startedAtRef.current[qid]) {
      startedAtRef.current[qid] = Date.now();
    }
  }, []);

  // ?좏깮 泥섎━ + ?쒕쾭 ?꾩넚
  const onSelect = useCallback(
    async (qid: number | string, cid: string) => {
      setAnswers((prev) => ({ ...prev, [qid]: cid }));

      const started = startedAtRef.current[qid];
      const elapsedMs = started ? Date.now() - started : undefined;

      try {
        await submitReadingAnswer({
          sessionId,                 // 臾몄옄??洹몃?濡??꾨떖
          questionId: String(qid),   // ?쒕쾭??string 湲곕?
          choiceId: String(cid),     // ?쒕쾭??string 湲곕?
          elapsedMs,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('submitReadingAnswer failed', e);
      } finally {
        // ?ㅼ쓬 ?좏깮???꾪빐 ??대㉧ 由ъ뀑
        startedAtRef.current[qid] = Date.now();
      }
    },
    [sessionId]
  );

  // ?몄뀡 醫낅즺
  const handleFinish = useCallback(async () => {
    try {
      await finishReadingSession(sessionId); // 臾몄옄??吏곸젒 ?꾨떖
      alert(`Submitted ${answered}/${total} answers. Session finished.`);
      // ?꾩슂 ?? window.location.href = `/app/(protected)/reading/review/${sessionId}`;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('finishReadingSession failed', e);
      alert('Finish failed. Please try again.');
    }
  }, [answered, total, sessionId]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Reading Test</h1>
        <p className="text-sm opacity-70">
          Session: {sessionId} 쨌 Progress: {answered}/{total}
        </p>
        {passageTitle ? <h2 className="text-xl font-semibold">{passageTitle}</h2> : null}
      </header>

      {passageText ? (
        <article className="prose max-w-none rounded-lg border bg-white p-4">
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
              key={String(qid)}
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
      tabIndex={0}
    >
      <div className="mb-3">
        <div className="mb-1 text-sm font-semibold">Question {index}</div>
        <div className="whitespace-pre-wrap">
          {prompt ? (
            prompt
          ) : (
            <span className="opacity-60">No prompt provided.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {choices.length === 0 ? (
          <div className="text-sm opacity-60">No choices.</div>
        ) : (
          choices.map((c, i) => {
            const cid = normalizeKey(c.id);
            const label = c.text ?? c.label ?? cid;
            const inputId = `q-${qid}-c-${cid || i}`;
            return (
              <label
                key={cid || i}
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-2"
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


