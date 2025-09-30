'use client';
import { useCallback, useId } from 'react';
import type { Choice } from '@/types/test';

type Props = {
  prompt: string;
  choices: Choice[];
  selected?: string | null;
  onAnswer: (choiceId: string) => void;
};

function normalizeChoice(c: Choice): { id: string; label: string } {
  const id = String((c as any)?.id ?? '');
  const label =
    typeof (c as any)?.label === 'string'
      ? (c as any).label
      : typeof (c as any)?.text === 'string'
      ? (c as any).text
      : '';
  return { id, label };
}

export default function QuestionCard({ prompt, choices, selected, onAnswer }: Props) {
  const groupId = useId();

  // 숫자키(1~9) 또는 넘패드(NumPad1~9)로 선택
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 숫자열(1~9)
      let idx = ['1','2','3','4','5','6','7','8','9'].indexOf(e.key);

      // 넘패드(NumPad1~9)
      if (idx < 0) {
        const map: Record<string, number> = {
          Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
          Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8,
        };
        if (e.code in map) idx = map[e.code];
      }

      if (idx >= 0 && idx < choices.length) {
        e.preventDefault();
        const { id } = normalizeChoice(choices[idx]);
        onAnswer(id);
      }
      // (옵션) 스페이스/엔터로 현재 선택 확정 같은 추가 핸들링을 원하면 여기서 처리 가능
    },
    [choices, onAnswer]
  );

  const shortcutMax = Math.min(9, choices.length);

  return (
    <div
      className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-white dark:bg-neutral-900 dark:border-neutral-800"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby={`${groupId}-label`}
      role="group"
    >
      <div id={`${groupId}-label`} className="font-medium text-gray-900 dark:text-gray-100">
        {prompt}
      </div>

      {/* 보기 목록 */}
      <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="space-y-2">
        {choices.map((c, i) => {
          const { id, label } = normalizeChoice(c);
          const isSelected = (selected ?? null) === id;
          const letter = String.fromCharCode(65 + i); // A, B, C, D...

          return (
            <button
              key={id || i}
              type="button"
              onClick={() => onAnswer(id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${letter}. ${label}`}
              className={[
                'w-full text-left rounded-xl border px-3 py-2 transition',
                'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                'dark:hover:bg-neutral-800',
                isSelected
                  ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50 dark:bg-brand-950/20'
                  : 'border-gray-200 dark:border-neutral-700',
              ].join(' ')}
            >
              <span className="inline-flex items-center gap-2">
                {/* 라디오 점 */}
                <span
                  className={[
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-brand-500' : 'border-gray-300 dark:border-neutral-600',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      isSelected ? 'bg-brand-500' : 'bg-transparent',
                    ].join(' ')}
                  />
                </span>

                {/* A/B/C/D 레터 */}
                <span className="font-medium text-gray-900 dark:text-gray-100">{letter}.</span>

                {/* 보기 텍스트 */}
                <span className="text-gray-800 dark:text-gray-200">{label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 힌트 */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Tip: 문제 영역에 포커스가 있을 때 키보드 <span className="tabular-nums">1~{shortcutMax}</span> 로 빠르게 선택할 수 있어요.
      </div>
    </div>
  );
}
