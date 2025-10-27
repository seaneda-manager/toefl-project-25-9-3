// normalized utf8
'use client';

import React from 'react';

type Props = {
  title: string;
  questionNo: string;
  stem: string;
  passage: React.ReactNode;            // ?怨쀯옙?(筌왖?? JSX
  leftPanel: React.ReactNode | null;   // ?占쎈슣占??醫뤾문筌왖) JSX (oneColumn??占??null ??占쎌뒠)
  // ??占쎈쐭 ??占쏙옙?
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onReview?: () => void;
  onPause?: () => void;
  onToggleTime?: () => void;
  onViewText?: () => void;
  // ??占쎈쐭 ?怨밴묶
  viewTextLabel?: string;              // View Text / View Question
  canBack?: boolean;
  canNext?: boolean;
  isLast?: boolean;
  // ??占쎌뵠?袁⑹뜍 ?怨밴묶
  oneColumn?: boolean;                 // true ???怨쀯옙?占?1?占싼됱쓥(筌왖???袁⑹뒠 癰귣떯占?
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
  // 餓λ쵐占?揶쏄쑨占?G): ??占쎌뵥??筌왖??????揶쏄쑨占?
  const gutter = '25px';

  return (
    <div className="h-screen w-full bg-white text-gray-900">
      <div className="flex h-full flex-col">
        {/* ?怨룸뼊 ??占쎌뵠??占?(TOEFL ??占쎄퐣) */}
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

          {/* ???占???Next (??占?獄쏆빓占?癰귣똻?占쏙옙? 筌띾뜆?筌띾맩?占쏙쭖?onFinish ??占쎈뻬) */}
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

        {/* 癰귣챶揆 ?怨몃열 */}
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4">
          {!oneColumn ? (
            /**
             * 3??域밸챶???
             * calc(50% - G/2) | G | calc(50% - G/2)
             * 餓λ쵐占???占쎈궖??占????占쎌뵥??? ?占썩뫂???占쏙옙?獄쏄퀗占?域밸챶??遺용섧?紐껋쨮 域밸챶???袁⑤꼥???占?
             */
            <div
              className="grid h-[calc(100vh-4rem)] min-h-0 items-stretch"
              style={{
                gridTemplateColumns: `calc(50% - (${gutter}) / 2) ${gutter} calc(50% - (${gutter}) / 2)`,
                // ??餓λ쵐占???占쎌뵥(1px)??獄쏄퀗占??占쎌쨮 域밸챶??????占쎄쾿占???占쎌뵠???怨밸샨 ??占쎌뵠 ??占???占쎈뻻
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
              {/* ?? ?占쎈챸占??醫뤾문筌왖 (??占쎌뵥?? 獄쏄퀗占??占쎌쨮 域밸챶?占썼첋?占?border-r ?占쎈뜇占?? */}
              <aside className="h-full min-h-0 overflow-y-auto pr-6">
                <div className="mx-auto max-w-[640px]">
                  <div className="mb-3 rounded-lg bg-[#0B1F3A]/5 px-3 py-2">
                    <div className="text-sm">Reading 占?study</div>
                    <div className="text-sm font-semibold">{questionNo}</div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-medium leading-relaxed">{stem}</p>
                    <div className="space-y-3">{leftPanel}</div>
                  </div>
                </div>
              </aside>

              {/* 揶쎛??占?? ??占쎌젫 ??燁살눖??筌왖?占쎈㈇????占쎌뵥 ????揶쏄쑨占? */}
              <div aria-hidden />

              {/* ?? ??占썬걠 + 筌왖??*/}
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
            // 1?占싼됱쓥(筌왖?占쎈챶占?癰귣떯占?
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



