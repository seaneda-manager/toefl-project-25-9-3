// apps/web/components/reading/ReadingTestRunner.tsx
'use client';

import { useState } from 'react';
import type { RPassage, RQuestion } from '@/models/reading';
import PassagePane from './PassagePane';

type AnswerPayload = { sessionId: string; questionId: string; choiceId: string };

export default function ReadingTestRunner({
  passage,
  sessionId,
  onAnswer,
  onFinish,
}: {
  passage: RPassage;
  sessionId: string;
  onAnswer: (a: AnswerPayload) => Promise<{ ok: true }>;
  onFinish: (a: { sessionId: string }) => Promise<{ ok: true }>;
}) {
  const qs = (passage?.questions ?? []) as RQuestion[];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [viewTextSeen, setViewTextSeen] = useState<Record<string, boolean>>({});
  const [showFull, setShowFull] = useState(false);

  // 臾명빆 ?놁쑝硫?媛??
  if (qs.length === 0) {
    return (
      <div className="p-6 rounded-xl border text-sm">
        濡쒕뱶??臾명빆???놁뒿?덈떎. (passage: <b>{passage?.title ?? 'untitled'}</b>)
      </div>
    );
  }

  const q = qs[Math.min(idx, qs.length - 1)];
  const isSummary = q?.type === 'summary';
  const canInteract = !isSummary || !!viewTextSeen[q.id];

  const prev = () => setIdx((i) => Math.max(0, i - 1));

  const next = async () => {
    if (!q) return;
    const choiceId = picked[q.id];
    if (!choiceId) {
      alert('?듭쓣 ?좏깮?섏꽭??');
      return;
    }
    await onAnswer({ sessionId, questionId: q.id, choiceId });
    if (idx < qs.length - 1) setIdx(idx + 1);
    else {
      await onFinish({ sessionId });
      alert('?쒖텧 ?꾨즺');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-120px)] p-6">
      {/* 醫? 臾몄젣 */}
      <div className="flex flex-col min-w-0">
        <div className="text-sm text-neutral-500">
          Question {q.number} / {qs.length}
        </div>

        <div className="flex items-center justify-between mt-2 mb-3">
          <h2 className="text-lg font-semibold">{q.stem}</h2>
          {isSummary && (
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => {
                setShowFull(true);
                setViewTextSeen((s) => ({ ...s, [q.id]: true }));
              }}
            >
              View Text
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {(q.choices ?? []).map((c) => (
            <li key={c.id}>
              <label
                className={`flex gap-2 items-start border rounded-xl p-3 ${
                  canInteract ? 'cursor-pointer hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  disabled={!canInteract}
                  checked={picked[q.id] === c.id}
                  onChange={() => setPicked((s) => ({ ...s, [q.id]: c.id }))}
                  className="mt-1"
                />
                <span>{c.text}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex justify-between pt-4">
          <button className="px-4 py-2 rounded border" disabled={idx === 0} onClick={prev}>
            Prev
          </button>
          <button className="px-4 py-2 rounded border" onClick={next}>
            {idx < qs.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>

      {/* ?? 吏臾?*/}
      <div className="h-full border rounded-2xl p-4 overflow-auto">
        {/* PassagePane??q瑜??꾩슂濡??섎?濡?Non-null 蹂댁옣 ???꾨떖 */}
        <PassagePane content={passage.content} q={q} />
      </div>

      {/* ?꾩껜 蹂닿린 紐⑤떖 */}
      {showFull && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowFull(false)}
        >
          <div
            className="bg-white text-black max-w-3xl w-[90vw] max-h-[80vh] rounded-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Full Text</h3>
              <button className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => setShowFull(false)}>
                Close
              </button>
            </div>
            {/* passage.content媛 HTML 臾몄옄?댁씪 ?섎룄 ?덉쑝??媛꾨떒??泥섎━?섎젮硫??꾨옒 ??以꾨줈??異⑸텇 */}
            <div className="prose max-w-none whitespace-pre-wrap">{passage.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}




