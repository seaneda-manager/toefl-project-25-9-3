// normalized utf8
'use client';

import React from 'react';

type Props = {
  title: string;
  questionNo: string;
  stem: string;
  passage: React.ReactNode;            // ?곗�?(吏?? JSX
  leftPanel: React.ReactNode | null;   // ?�뚯�??좏깮吏) JSX (oneColumn??�??null ??�슜)
  // ??�뜑 ??��?
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onReview?: () => void;
  onPause?: () => void;
  onToggleTime?: () => void;
  onViewText?: () => void;
  // ??�뜑 ?곹깭
  viewTextLabel?: string;              // View Text / View Question
  canBack?: boolean;
  canNext?: boolean;
  isLast?: boolean;
  // ??�씠?꾩썐 ?곹깭
  oneColumn?: boolean;                 // true ???곗�?�?1?�щ읆(吏???꾩슜 蹂닿�?
};

export default function ReadingLayout({
  title,
  questionNo,
  stem,
  passage,
  leftPanel,
  onBack,
  onNext,
  onFinish,
  onReview,
  onPause,
  onToggleTime,
  onViewText,
  viewTextLabel = 'View Text',
  canBack = true,
  canNext = true,
  isLast = false,
  oneColumn = false,
}: Props) {
  // 以묒�?媛꾧�?G): ??�씤??吏??????媛꾧�?
  const gutter = '25px';

  return (
    <div className="h-screen w-full bg-white text-gray-900">
      <div className="flex h-full flex-col">
        {/* ?곷떒 ??�씠??�?(TOEFL ??�꽌) */}
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-b border-[#0B1F3A] bg-[#0B1F3A] px-4 py-3 text-white">
          <button type="button" className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={onReview}>
            Review
          </button>
          <button type="button" className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={onPause}>
            Pause
          </button>
          <button type="button" className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={onViewText}>
            {viewTextLabel}
          </button>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20 disabled:opacity-50"
            onClick={onBack}
            disabled={!canBack}
          >
            Back
          </button>

          {/* ???�???Next (??�?諛앷�?蹂댁?��? 留덉?留됱?�硫?onFinish ??�뻾) */}
          <button
            type="button"
            aria-disabled={!canNext}
            tabIndex={!canNext ? -1 : 0}
            onClick={!canNext ? undefined : (isLast ? onFinish : onNext)}
            className="rounded-md px-3 py-1.5 font-semibold
                       bg-amber-400 text-[#0B1F3A]
                       shadow-sm ring-1 ring-amber-300
                       hover:bg-amber-500 hover:shadow
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                       transition
                       [&[aria-disabled='true']]:pointer-events-none"
          >
            Next
          </button>

          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
            onClick={onToggleTime}
          >
            Hide Time
          </button>
        </div>

        {/* 蹂몃Ц ?곸뿭 */}
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4">
          {!oneColumn ? (
            /**
             * 3??洹몃???
             * calc(50% - G/2) | G | calc(50% - G/2)
             * 以묒�???�낫??�????�씤??? ?�⑦???��?諛곌�?洹몃??붿뼵?몃줈 洹몃???꾨넂???�?
             */
            <div
              className="grid h-[calc(100vh-4rem)] min-h-0 items-stretch"
              style={{
                gridTemplateColumns: `calc(50% - (${gutter}) / 2) ${gutter} calc(50% - (${gutter}) / 2)`,
                // ??以묒�???�씤(1px)??諛곌�??�줈 洹몃??????�겕�???�씠???곹뼢 ??�씠 ??�???�떆
                backgroundImage: `
                  linear-gradient(
                    to right,
                    transparent calc(50% - (${gutter}) / 2),
                    #D1D5DB calc(50% - (${gutter}) / 2),
                    #D1D5DB calc(50% - (${gutter}) / 2 + 1px),
                    transparent calc(50% - (${gutter}) / 2 + 1px)
                  )
                `,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%',
              }}
            >
              {/* ?? ?�명�??좏깮吏 (??�씤?? 諛곌�??�줈 洹몃?�誘?�?border-r ?�덊�?? */}
              <aside className="h-full min-h-0 overflow-y-auto pr-6">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-3 rounded-lg bg-[#0B1F3A]/5 px-3 py-2">
                    <div className="text-sm">Reading �?study</div>
                    <div className="text-sm font-semibold">{questionNo}</div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-medium leading-relaxed">{stem}</p>
                    <div className="space-y-3">{leftPanel}</div>
                  </div>
                </div>
              </aside>

              {/* 媛??�?? ??�젣 ??移쇰??吏?�멸????�씤 ????媛꾧�? */}
              <div aria-hidden />

              {/* ?? ??�ぉ + 吏??*/}
              <section className="h-full min-h-0 overflow-y-auto pb-6">
                <div className="mx-auto max-w-[740px]">
                  <div className="py-4">
                    <h1 className="text-2xl font-bold leading-tight">{title}</h1>
                  </div>
                  <div className="space-y-4">{passage}</div>
                </div>
              </section>
            </div>
          ) : (
            // 1?�щ읆(吏?�몃�?蹂닿�?
            <section className="h-[calc(100vh-4rem)] min-h-0 overflow-y-auto pb-6">
              <div className="py-4">
                <h1 className="text-2xl font-bold leading-tight">{title}</h1>
              </div>
              <div className="space-y-4">{passage}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

