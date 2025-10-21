'use client';

import React from 'react';

type Props = {
  title: string;
  questionNo: string;
  stem: string;
  passage: React.ReactNode;            // ?ê³—ë?(ï§Â€?? JSX
  leftPanel: React.ReactNode | null;   // ?«ëš¯ë¥??ì¢ê¹®ï§Â€) JSX (oneColumn??€??null ??‰ìŠœ)
  // ??»ëœ‘ ??ªë€?
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onReview?: () => void;
  onPause?: () => void;
  onToggleTime?: () => void;
  onViewText?: () => void;
  // ??»ëœ‘ ?ê³¹ê¹­
  viewTextLabel?: string;              // View Text / View Question
  canBack?: boolean;
  canNext?: boolean;
  isLast?: boolean;
  // ??‰ì” ?ê¾©ì ?ê³¹ê¹­
  oneColumn?: boolean;                 // true ???ê³—ë?ï§?1?ŒÑ‰ì†(ï§Â€???ê¾©ìŠœ è¹‚ë‹¿ë¦?
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
  // ä»¥ë¬’ë¸?åª›ê¾§êº?G): ??±ì”¤??ï§Â€??????åª›ê¾§êº?
  const gutter = '25px';

  return (
    <div className="h-screen w-full bg-white text-gray-900">
      <div className="flex h-full flex-col">
        {/* ?ê³·ë–’ ??¼ì” ??è«?(TOEFL ??–ê½Œ) */}
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

          {/* ???ëª???Next (??ê¸?è«›ì•·ì¾?è¹‚ëŒ? æ€? ï§ë‰?ï§ë±? ï§?onFinish ??½ë»¾) */}
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

        {/* è¹‚ëªƒĞ¦ ?ê³¸ë¿­ */}
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4">
          {!oneColumn ? (
            /**
             * 3??æ´¹ëªƒ???
             * calc(50% - G/2) | G | calc(50% - G/2)
             * ä»¥ë¬’ë¸???ë‚«??€????±ì”¤??? ?Œâ‘¦???€ê¼?è«›ê³Œê¼?æ´¹ëªƒ??ë¶¿ë¼µ?ëªƒì¤ˆ æ´¹ëªƒ???ê¾¨ë„‚???ì¢?
             */
            <div
              className="grid h-[calc(100vh-4rem)] min-h-0 items-stretch"
              style={{
                gridTemplateColumns: `calc(50% - (${gutter}) / 2) ${gutter} calc(50% - (${gutter}) / 2)`,
                // ??ä»¥ë¬’ë¸???±ì”¤(1px)??è«›ê³Œê¼??°ì¤ˆ æ´¹ëªƒ??????½ê²•æ¿???‰ì” ???ê³¹ë¼¢ ??ì”  ??ê¸???–ë–†
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
              {/* ?? ?¾ëª…ë¹??ì¢ê¹®ï§Â€ (??±ì”¤?? è«›ê³Œê¼??°ì¤ˆ æ´¹ëªƒ?èª˜?æ¿?border-r ?ºëŠë¸?? */}
              <aside className="h-full min-h-0 overflow-y-auto pr-6">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-3 rounded-lg bg-[#0B1F3A]/5 px-3 py-2">
                    <div className="text-sm">Reading ì¨?study</div>
                    <div className="text-sm font-semibold">{questionNo}</div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-medium leading-relaxed">{stem}</p>
                    <div className="space-y-3">{leftPanel}</div>
                  </div>
                </div>
              </aside>

              {/* åª›Â€??€?? ??¼ì £ ??ç§»ì‡°??ï§Â€?¾ë©¸????±ì”¤ ????åª›ê¾§êº? */}
              <div aria-hidden />

              {/* ?? ??•ã‰ + ï§Â€??*/}
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
            // 1?ŒÑ‰ì†(ï§Â€?¾ëªƒì­?è¹‚ë‹¿ë¦?
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

