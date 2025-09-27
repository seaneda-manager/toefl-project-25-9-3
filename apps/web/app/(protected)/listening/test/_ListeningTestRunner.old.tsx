// apps/web/app/(protected)/listening/test/ListeningTestRunner.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AudioPlayer from '../components/AudioPlayer';
import LTimer from '../components/LTimer';
import {
  startListeningSession,
  submitListeningAnswer,
  finishListeningSession,
} from '@/actions/listening';
import type { LQuestion, ListeningTrack } from '@/types/types-listening';

type Choice = { id: string | number; text?: string; label?: string };
const normalizeKey = (v: unknown) => (v == null ? '' : String(v));
const getChoices = (q: any): Choice[] =>
  (Array.isArray(q?.choices) ? q.choices : []).map((c: any) => ({
    id: (c?.id ?? c?.value ?? c?.key ?? c?.label ?? c?.text ?? '').toString(),
    text: c?.text ?? c?.label ?? (typeof c === 'string' ? c : ''),
    label: c?.label,
  }));
const getPrompt = (q: any) => q?.prompt ?? q?.stem ?? q?.text ?? q?.title ?? '';

type Props = {
  track: ListeningTrack;     // { id, title, audioUrl, ... } (id: string 권장)
  questions: LQuestion[];    // [{ id:number, prompt, choices:[] }, ...] (id: number 권장)
  mode?: 'study' | 'test' | 'p' | 't' | 'r';
};

export default function ListeningTestRunner({ track, questions, mode = 'study' }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null); // UUID
  const [answers, setAnswers] = useState<Record<number | string, string>>({});
  const startedAtRef = useRef<Record<number | string, number>>({});
  const total = questions.length;
  const answered = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  // 세션 시작(UUID 반환)
  useEffect(() => {
    (async () => {
      try {
        const res = await startListeningSession({ trackId: String(track.id), mode });
        setSessionId(res.sessionId);
      } catch (e) {
        console.error('startListeningSession failed', e);
      }
    })();
  }, [track.id, mode]);

  const onFocusQuestion = useCallback((qid: number | string) => {
    if (!startedAtRef.current[qid]) startedAtRef.current[qid] = Date.now();
  }, []);

  const onSelect = useCallback(
    async (qid: number | string, cid: string) => {
      setAnswers((prev) => ({ ...prev, [qid]: cid }));

      const started = startedAtRef.current[qid];
      const elapsedMs = started ? Date.now() - started : undefined;

      try {
        if (sessionId) {
          const qnum = typeof qid === 'number' ? qid : Number(qid);
          if (!Number.isFinite(qnum)) {
            console.warn('questionId must be numeric (BIGINT). Got:', qid);
            return;
          }
          await submitListeningAnswer({
            sessionId,
            questionId: qnum,
            choiceId: cid,
            elapsedMs,
          });
        }
      } catch (e) {
        console.error('submitListeningAnswer failed', e);
      } finally {
        startedAtRef.current[qid] = Date.now();
      }
    },
    [sessionId]
  );

  const handleFinish = useCallback(async () => {
    try {
      if (sessionId) await finishListeningSession({ sessionId });
      alert(`Submitted ${answered}/${total} answers. Session finished.`);
      // window.location.href = `/app/(protected)/listening/review/${sessionId}`;
    } catch (e) {
      console.error('finishListeningSession failed', e);
      alert('Finish failed. Please try again.');
    }
  }, [sessionId, answered, total]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Listening Test</h1>
        <p className="text-sm opacity-70">
          Track: {track?.title ?? '-'} · Progress: {answered}/{total}
        </p>
      </header>

      <div className="rounded-lg border p-4">
        <AudioPlayer src={(track as any).audioUrl ?? (track as any).audio_url} />
        <div className="mt-2">
          <LTimer />
        </div>
      </div>

      <section className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const prompt = getPrompt(q);
          const qid = q?.id ?? idx + 1;
          const choiceList = getChoices(q);
          const selected = answers[qid] ?? '';
          return (
            <div
              key={qid}
              className="rounded-lg border p-4"
              onMouseEnter={() => onFocusQuestion(qid)}
              onFocus={() => onFocusQuestion(qid)}
            >
              <div className="mb-3">
                <div className="text-sm font-semibold mb-1">Question {idx + 1}</div>
                <div className="whitespace-pre-wrap">{prompt || <span className="opacity-60">—</span>}</div>
              </div>

              <div className="space-y-2">
                {choiceList.length === 0 ? (
                  <div className="text-sm opacity-60">No choices.</div>
                ) : (
                  choiceList.map((c, i) => {
                    const cid = normalizeKey(c.id);
                    const label = c.text ?? c.label ?? cid;
                    const inputId = `q-${qid}-c-${cid}`;
                    return (
                      <label key={cid || i} htmlFor={inputId} className="flex items-start gap-2 cursor-pointer">
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
