// normalized utf8
'use client';

import React from 'react';
import type { RQuestion, RChoice } from '@/types/types-reading';

type Props = {
  q: RQuestion;
  selected?: string | null;
  index?: number;
};

// explanation ?�전 ?�??
type Explanation = {
  clue_quote?: string;
  why_correct?: string;
  why_others?: Record<string, unknown>;
};

function asExplanation(e: unknown): Explanation {
  const obj = (e && typeof e === 'object') ? (e as Record<string, unknown>) : {};
  const clue_quote = typeof obj['clue_quote'] === 'string' ? (obj['clue_quote'] as string) : undefined;
  const why_correct = typeof obj['why_correct'] === 'string' ? (obj['why_correct'] as string) : undefined;
  const why_others =
    obj['why_others'] && typeof obj['why_others'] === 'object'
      ? (obj['why_others'] as Record<string, unknown>)
      : undefined;
  return { clue_quote, why_correct, why_others };
}

export default function ReviewRow({ q, selected }: Props) {
  const choices = (q.choices ?? []) as RChoice[];
  const correct = choices.find((c) => c.is_correct)?.id ?? null;

  const exp = asExplanation(q.explanation);

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        Q{q.number ?? ''}. {/* 문제 본문???�로 ?�으�??�기??출력 */}
      </div>

      <ul className="space-y-2">
        {choices.map((c, i) => {
          const isSelected = (selected ?? null) === c.id;
          const isCorrect = correct === c.id;
          const letter = String.fromCharCode(65 + i); // A, B, C, ...

          return (
            <li
              key={c.id || i}
              className={[
                'rounded-lg border px-3 py-2',
                isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : isSelected
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-gray-200 dark:border-neutral-700',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                <span className="font-semibold">{letter}.</span>
                <span className="flex-1">{c.text}</span>
                {isCorrect && <span className="text-xs text-green-700 dark:text-green-300">?�답</span>}
                {isSelected && !isCorrect && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">???�택</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ?�트/?�명 */}
      {exp.clue_quote && (
        <div className="text-sm">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">근거 문장</div>
          <blockquote className="rounded-md border-l-4 border-gray-300 bg-gray-50 p-2 dark:bg-neutral-800 dark:border-neutral-700">
            {exp.clue_quote}
          </blockquote>
        </div>
      )}

      {(exp.why_correct || exp.why_others) && (
        <div className="space-y-2 text-sm">
          {exp.why_correct && (
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">???�답?��??</div>
              <div className="whitespace-pre-wrap">{exp.why_correct}</div>
            </div>
          )}

          {exp.why_others && (
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">?�른 ?�택지가 ?��??�유</div>
              <div className="space-y-1">
                {Object.entries(exp.why_others).map(([k, v]) => (
                  <div key={k} className="text-gray-800 dark:text-gray-200">
                    <strong>{k}</strong>: {String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
