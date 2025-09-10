// apps/web/app/(protected)/reading/components/QuestionCard.tsx
'use client';

import type { Question, Choice } from '../../../types/types-reading';

export default function QuestionCard({
  q,
  disabled,
  selected,
  onChange,
  showFeedback,
}: {
  q: Question;
  disabled?: boolean;
  selected?: string | null;
  onChange?: (choiceId: string) => void;
  showFeedback?: boolean;
}) {
  function pick(c: Choice) {
    if (disabled) return;
    onChange?.(c.id);
  }

  return (
    <ul className="space-y-2">
      {q.choices.map((c: Choice) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => pick(c)}
            className={`w-full text-left p-3 rounded-xl border bg-white/10 hover:bg-white/20 ${
              selected === c.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <span className="mr-2 font-semibold">{c.label}.</span> {c.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
