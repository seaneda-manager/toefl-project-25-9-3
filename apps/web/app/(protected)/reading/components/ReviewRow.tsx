// apps/web/app/(protected)/reading/components/ReviewRow.tsx
'use client';

import type { Question, Choice } from '../../../types/types-reading';

export default function ReviewRow({ q, picked }: { q: Question; picked: string | null }) {
  const correct = q.choices.find((c: Choice) => c.is_correct)?.id ?? null;
  const ok = !!picked && !!correct && picked === correct;

  return (
    <div className="p-4 border rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Q{q.number}</div>
        <div className={`text-sm ${ok ? 'text-green-500' : 'text-red-400'}`}>
          {ok ? 'Correct' : 'Wrong'}
        </div>
      </div>

      <div className="mt-1 font-medium">{q.stem}</div>

      <ul className="mt-2 space-y-1 text-sm">
        {q.choices.map((c: Choice) => (
          <li key={c.id} className={c.is_correct ? 'font-semibold' : ''}>
            {c.label}. {c.text}
            {picked === c.id && '  ← you'}
            {c.is_correct && '  ← correct'}
          </li>
        ))}
      </ul>

      {q.clue_quote && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500">근거문장</summary>
          <blockquote className="mt-2 p-3 bg-white/5 rounded-xl whitespace-pre-wrap">
            {q.clue_quote}
          </blockquote>
        </details>
      )}

      {q.explanation && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-500">해설</summary>
          <div className="mt-2 text-sm whitespace-pre-wrap">{q.explanation}</div>
        </details>
      )}
    </div>
  );
}
