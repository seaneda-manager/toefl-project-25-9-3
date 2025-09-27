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

  // 숫자키(1~9) 또는 넘패드(NumPad1~9) 지원
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const k = e.key;
      // 상단 숫자키
      let idx = ['1','2','3','4','5','6','7','8','9'].indexOf(k);
      // 넘패드 대응
      if (idx < 0) {
        const np = (e as unknown as KeyboardEvent).code; // DOM KeyboardEvent code 접근
        const map: Record<string, number> = {
          Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
          Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8,
        };
        if (np in map) idx = map[np];
      }
      if (idx >= 0 && idx < choices.length) {
        e.preventDefault();
        const { id } = normalizeChoice(choices[idx]);
        onAnswer(id);
      }
      // 스페이스/엔터 등은 확장 여지 남김
    },
    [choices, onAnswer]
  );

  return (
    <div
      className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-white"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby={`${groupId}-label`}
      role="group"
    >
      <div id={`${groupId}-label`} className="font-medium text-gray-900">
        {prompt}
      </div>

      {/* 라디오 그룹 */}
      <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="space-y-2">
        {choices.map((c, i) => {
          const { id, label } = normalizeChoice(c);
          const isSelected = (selected ?? null) === id;
          const letter = String.fromCharCode(65 + i); // A, B, C, D...

          return (
            <button
              key={id}
              type="button"
              onClick={() => onAnswer(id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${letter}. ${label}`}
              className={[
                'w-full text-left rounded-xl border px-3 py-2 transition',
                'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50' : 'border-gray-200',
              ].join(' ')}
            >
              <span className="inline-flex items-center gap-2">
                {/* 라디오 점 */}
                <span
                  className={[
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-brand-500' : 'border-gray-300',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <span
                    className={['h-2.5 w-2.5 rounded-full', isSelected ? 'bg-brand-500' : 'bg-transparent'].join(' ')}
                  />
                </span>

                {/* A/B/C/D 뱃지 */}
                <span className="font-medium text-gray-900">{letter}.</span>

                {/* 선택지 텍스트 */}
                <span className="text-gray-800">{label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 힌트 */}
      <div className="text-xs text-gray-400">
        Tip: 카드에 포커스(클릭/탭)한 상태에서 <span className="tabular-nums">1–{choices.length}</span> 키로 빠르게 선택할 수 있어요.
      </div>
    </div>
  );
}
