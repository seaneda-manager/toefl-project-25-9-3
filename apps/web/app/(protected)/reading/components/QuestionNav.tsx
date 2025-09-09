'use client';

import { useEffect } from 'react';

type Props = {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJump?: (index: number) => void;
  answered?: Record<number, boolean>;
  /** 선택: 키보드 단축키(← → Home End) 활성화 */
  enableHotkeys?: boolean;
  /** 선택: 버튼에 표시할 라벨(예: 실제 문항 번호). 미지정 시 1..total */
  labels?: Array<string | number>;
};

export default function QuestionNav({
  current,
  total,
  onPrev,
  onNext,
  onJump,
  answered = {},
  enableHotkeys = true,
  labels,
}: Props) {
  // 키보드 단축키: ← → Home End
  useEffect(() => {
    if (!enableHotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onJump?.(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onJump?.(total - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableHotkeys, onPrev, onNext, onJump, total]);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onPrev}
        disabled={current <= 0}
        className="px-3 py-2 rounded border bg-white disabled:opacity-50"
        aria-label="이전 문제"
      >
        이전
      </button>

      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          const isDone = answered[i] === true;
          const label = labels?.[i] ?? i + 1;

          return (
            <button
              key={i}
              onClick={() => onJump?.(i)}
              className={[
                'w-9 h-9 rounded border text-sm outline-none',
                isActive ? 'bg-black text-white border-black' : 'bg-white',
                isDone ? 'border-green-500' : 'border-gray-300',
                isActive ? 'ring-2 ring-black ring-offset-1' : 'focus-visible:ring-2 focus-visible:ring-gray-400',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${label}번 ${isDone ? '(응답됨)' : '(미응답)'}`}
              title={`${label}번 ${isDone ? '응답됨' : '미응답'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={current >= total - 1}
        className="px-3 py-2 rounded border bg-white disabled:opacity-50"
        aria-label="다음 문제"
      >
        다음
      </button>
    </div>
  );
}
