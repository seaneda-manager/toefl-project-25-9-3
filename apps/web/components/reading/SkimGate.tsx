// apps/web/components/reading/SkimGate.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function SkimGate({
  content,
  onUnlock,
  height = 520,
}: {
  content: string;
  onUnlock: () => void;
  height?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      setAtBottom(nearBottom);
    };
    onScroll();
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-3">Skim the passage</h2>
      <p className="text-sm text-neutral-500 mb-3">
        아래 사이드 영역을 끝까지 스크롤하면 시작 버튼이 활성화됩니다.
      </p>
      <div className="grid grid-cols-[420px_1fr] gap-6">
        <div
          ref={boxRef}
          className="border rounded-2xl p-4 overflow-y-auto"
          style={{ height }}
        >
          <div className="prose max-w-none">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-4">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-start">
          <button
            type="button"
            onClick={onUnlock}
            disabled={!atBottom}
            className={[
              'px-4 py-2 rounded-xl border',
              atBottom ? 'bg-black text-white' : 'opacity-50 cursor-not-allowed',
            ].join(' ')}
            aria-disabled={!atBottom}
          >
            Start Questions
          </button>
        </div>
      </div>
    </div>
  );
}
