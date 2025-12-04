'use client';

import type { ReactNode } from 'react';

type Props = {
  header: ReactNode;
  left: ReactNode;
  right?: ReactNode | null;
};

export default function ReadingTestLayout2026({ header, left, right }: Props) {
  const isSingleColumn = right == null;

  return (
    <div className="flex h-screen flex-col bg-[#f5f7f8]">
      {/* 상단 헤더 바 */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        {header}
      </div>

      {/* 본문 */}
      <div
        className={[
          'grid h-full gap-4 px-4 py-4 md:px-6 md:py-6',
          isSingleColumn
            ? 'grid-cols-1'
            : 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
        ].join(' ')}
      >
        {/* 왼쪽 (또는 전체 폭) */}
        <section className="min-h-0 overflow-y-auto rounded-lg border bg-white p-4 shadow-sm md:p-6">
          {left}
        </section>

        {/* 오른쪽 패널: 두 컬럼 모드에서만 렌더 */}
        {!isSingleColumn && (
          <section className="min-h-0 overflow-y-auto rounded-lg border bg-white p-4 shadow-sm md:p-6">
            {right}
          </section>
        )}
      </div>
    </div>
  );
}
