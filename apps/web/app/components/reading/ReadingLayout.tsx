'use client';

import React from 'react';

type Props = {
  title: string;
  questionNo: string;
  stem: string;
  passage: React.ReactNode;            // ?곗륫(吏臾? JSX
  leftPanel: React.ReactNode | null;   // 醫뚯륫(?좏깮吏) JSX (oneColumn?대㈃ null ?덉슜)
  // ?ㅻ뜑 ?≪뀡
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onReview?: () => void;
  onPause?: () => void;
  onToggleTime?: () => void;
  onViewText?: () => void;
  // ?ㅻ뜑 ?곹깭
  viewTextLabel?: string;              // View Text / View Question
  canBack?: boolean;
  canNext?: boolean;
  isLast?: boolean;
  // ?덉씠?꾩썐 ?곹깭
  oneColumn?: boolean;                 // true ???곗륫留?1而щ읆(吏臾??꾩슜 蹂닿린)
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
  // 以묒븰 媛꾧꺽(G): ?쇱씤怨?吏臾??ъ씠 媛꾧꺽
  const gutter = '25px';

  return (
    <div className="h-screen w-full bg-white text-gray-900">
      <div className="flex h-full flex-col">
        {/* ?곷떒 ?ㅼ씠鍮?諛?(TOEFL ?쒖꽌) */}
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

          {/* ???몃???Next (??긽 諛앷쾶 蹂댁씠怨? 留덉?留됱씠硫?onFinish ?ㅽ뻾) */}
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
             * 3??洹몃━??
             * calc(50% - G/2) | G | calc(50% - G/2)
             * 以묒븰 ?섎낫?대뒗 ?쇱씤?숈? 而⑦뀒?대꼫 諛곌꼍 洹몃씪?붿뼵?몃줈 洹몃젮 ?꾨넂???좎?
             */
            <div
              className="grid h-[calc(100vh-4rem)] min-h-0 items-stretch"
              style={{
                gridTemplateColumns: `calc(50% - (${gutter}) / 2) ${gutter} calc(50% - (${gutter}) / 2)`,
                // ??以묒븰 ?쇱씤(1px)??諛곌꼍?쇰줈 洹몃┝ ???ㅽ겕濡??덉씠???곹뼢 ?놁씠 ??긽 ?쒖떆
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
              {/* 醫? 臾명빆/?좏깮吏 (?쇱씤? 諛곌꼍?쇰줈 洹몃━誘濡?border-r 遺덊븘?? */}
              <aside className="h-full min-h-0 overflow-y-auto pr-6">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-3 rounded-lg bg-[#0B1F3A]/5 px-3 py-2">
                    <div className="text-sm">Reading 쨌 study</div>
                    <div className="text-sm font-semibold">{questionNo}</div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-medium leading-relaxed">{stem}</p>
                    <div className="space-y-3">{leftPanel}</div>
                  </div>
                </div>
              </aside>

              {/* 媛?대뜲: ?ㅼ젣 鍮?移쇰읆(吏臾멸낵 ?쇱씤 ?ъ씠 媛꾧꺽) */}
              <div aria-hidden />

              {/* ?? ?쒕ぉ + 吏臾?*/}
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
            // 1而щ읆(吏臾몃쭔 蹂닿린)
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

