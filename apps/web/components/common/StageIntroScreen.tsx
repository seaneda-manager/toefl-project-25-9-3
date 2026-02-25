"use client";

import React, { useEffect } from "react";

type Props = {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hint?: React.ReactNode;

  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;

  // legacy
  doneLabel?: string;
  onDone?: () => void;

  children?: React.ReactNode;
};

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((node as any).isContentEditable) return true;
  return false;
}

export default function StageIntroScreen({
  badge,
  title,
  subtitle,
  hint,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  doneLabel,
  onDone,
  children,
}: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "1" && onPrimary) onPrimary();
      if (e.key === "2" && onSecondary) onSecondary();

      if (e.key === "Enter") {
        if (onPrimary) onPrimary();
        else if (onDone) onDone();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPrimary, onSecondary, onDone]);

  const showTwo = Boolean(primaryLabel && secondaryLabel && (onPrimary || onSecondary));
  const showOne = Boolean(!showTwo && onDone);

  return (
    <div className="lx-panel rounded-[28px] border border-slate-200 bg-white/95 shadow-sm text-slate-900">
      {/* ✅ 스케일 래퍼(전체 내용이 창 크기 변화에 비례해서 같이 줄고 늘어남) */}
      <div className="lx-panel-content">
        <div className="lx-panel-scroll">
          {/* ✅ 헤더: 중첩 패널일 때 CSS로 숨길 수 있게 class를 분리 */}
          <div className="lx-panel-header p-8 pb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
              {badge ?? "Info"}
              <span className="text-slate-500">(Keyboard supported)</span>
            </div>

            {title ? (
              <div className="mt-6 text-[clamp(28px,3cqi,56px)] font-extrabold leading-tight text-slate-900">
                {title}
              </div>
            ) : null}

            {subtitle ? (
              <div className="mt-2 text-[clamp(14px,1.5cqi,20px)] font-semibold text-slate-600">
                {subtitle}
              </div>
            ) : null}

            {hint ? (
              <div className="mt-4 text-sm font-semibold text-slate-700">{hint}</div>
            ) : null}
          </div>

          {/* body */}
          {children ? <div className="px-8 pb-6">{children}</div> : null}

          {/* actions */}
          {showTwo ? (
            <div className="px-8 pb-8">
              <div className="flex gap-4">
                <button type="button" className="lx-btn lx-btn-primary" onClick={onPrimary}>
                  {primaryLabel} <span className="ml-2 opacity-80">(1)</span>
                </button>
                <button type="button" className="lx-btn lx-btn-secondary" onClick={onSecondary}>
                  {secondaryLabel} <span className="ml-2 opacity-70">(2)</span>
                </button>
              </div>
            </div>
          ) : showOne ? (
            <div className="px-8 pb-8">
              <button type="button" className="lx-btn lx-btn-primary w-full" onClick={onDone}>
                {doneLabel ?? "Continue"} <span className="ml-2 opacity-80">(Enter)</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
