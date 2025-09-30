'use client';
import React from 'react';

type Mode = 'study' | 'exam' | 'review';
type Section = 'reading' | 'listening';

export default function TopBar({
  mode,
  section,
  qIndex,
  total,
  onBack,
  onNext,
  onPause,
  onReview,
  onToggleTime,
  showTime,
  isSummary,
  showTextOnly,
  setShowTextOnly,
  rightExtra,
}: {
  mode: Mode;
  section: Section;
  qIndex: number;
  total: number;
  onBack?: () => void;
  onNext?: () => void;
  onPause?: () => void;
  onReview?: () => void;
  onToggleTime?: () => void;
  showTime?: boolean;
  isSummary?: boolean;
  showTextOnly?: boolean;
  setShowTextOnly?: (v: boolean) => void;
  rightExtra?: React.ReactNode;
}) {
  const badge = section === 'reading' ? 'Reading' : 'Listening';

  const Btn = ({
    children,
    onClick,
    disabled,
  }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'px-3 py-1.5 rounded-md text-sm border border-white/30',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  );

  return (
    <header className="rounded-xl p-3 text-white bg-gradient-to-r from-violet-700 to-fuchsia-600 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs rounded-full bg-white/10 px-2 py-0.5">
            {badge} 쨌 {mode}
          </span>
          <span className="text-sm/5 text-white/90">
            Question {qIndex + 1} of {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSummary && setShowTextOnly && (
            <Btn onClick={() => setShowTextOnly(!showTextOnly)}>
              {showTextOnly ? 'VIEW QUESTION' : 'VIEW TEXT'}
            </Btn>
          )}
          <Btn onClick={onReview}>Review</Btn>
          <Btn onClick={onPause}>Pause</Btn>
          <Btn onClick={onBack} disabled={qIndex <= 0}>Back</Btn>
          <Btn onClick={onNext}>Next</Btn>
          {onToggleTime && <Btn onClick={onToggleTime}>{showTime ? 'Hide Time' : 'Show Time'}</Btn>}
          {rightExtra}
        </div>
      </div>
    </header>
  );
}

