// apps/web/app/(protected)/reading/components/ReviewRow.tsx
'use client';

import type { Question, Choice } from '@/types/types-reading';

export default function ReviewRow({ q, picked }: { q: Question; picked: string | null }) {
  const correct = q.choices.find((c: Choice) => c.is_correct)?.id ?? null;
  const ok = !!picked && !!correct && picked === correct;

  return (
    <div className="p-4 border rounded-2xl">
      {/* 헤더: 번호/정오 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Q{q.number}</div>
        <div className={`text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>
          {ok ? 'Correct' : 'Wrong'}
        </div>
      </div>

      {/* 문항 지문 */}
      <div className="mt-1 font-medium">{q.stem}</div>

      {/* 선택지 목록 */}
      <ul className="mt-2 space-y-1 text-sm">
        {q.choices.map((c: Choice, i: number) => {
          const label = i < 26 ? String.fromCharCode(65 + i) : String(i + 1); // A, B, C...
          const isPicked = picked === c.id;
          const isCorrect = !!c.is_correct;

          return (
            <li
              key={c.id}
              className={[
                isCorrect ? 'font-semibold' : '',
                isPicked && !isCorrect ? 'text-red-600' : '',
              ].join(' ')}
            >
              {label}. {c.text}
              {isPicked && <span className="ml-2 text-xs text-blue-600">← you</span>}
              {isCorrect && <span className="ml-2 text-xs text-green-600">✓ correct</span>}
            </li>
          );
        })}
      </ul>

      {/* 근거 문장 */}
      {q.explanation?.clue_quote && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500">근거 문장 (clue)</summary>
          <blockquote className="mt-2 p-3 bg-white/5 rounded-xl whitespace-pre-wrap">
            {q.explanation.clue_quote}
          </blockquote>
        </details>
      )}

      {/* 해설 */}
      {(q.explanation?.why_correct || q.explanation?.why_others) && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-500">해설</summary>
          <div className="mt-2 text-sm space-y-2">
            {q.explanation?.why_correct && (
              <div className="whitespace-pre-wrap">{q.explanation.why_correct}</div>
            )}
            {q.explanation?.why_others && (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(q.explanation.why_others).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
