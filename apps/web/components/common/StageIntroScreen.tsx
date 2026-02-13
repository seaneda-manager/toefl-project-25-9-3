// apps/web/components/common/StageIntroScreen.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;

  /** optional body blocks */
  bullets?: Array<string | React.ReactNode>;
  children?: React.ReactNode;

  /** primary/secondary */
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;

  className?: string;
  rightSlot?: React.ReactNode;

  /** legacy tolerant names */
  ctaLabel?: string;
  buttonLabel?: string;
  actionLabel?: string;
  onStart?: () => void;
  onNext?: () => void;
  onContinue?: () => void;
  onClick?: () => void;

  // allow any extra props from old code without TS errors
  [key: string]: any;
};

function pickFirstFn(...fns: Array<unknown>) {
  for (const f of fns) if (typeof f === "function") return f as () => void;
  return undefined;
}

function pickFirstStr(...xs: Array<unknown>) {
  for (const x of xs) {
    const s = String(x ?? "").trim();
    if (s) return s;
  }
  return "";
}

export default function StageIntroScreen(props: Props) {
  const {
    title,
    subtitle,
    description,
    bullets,
    children,
    className = "",
    rightSlot,
  } = props;

  const primaryOnClick = useMemo(
    () =>
      pickFirstFn(
        props.onPrimary,
        props.onStart,
        props.onContinue,
        props.onNext,
        props.onClick,
      ),
    [props.onPrimary, props.onStart, props.onContinue, props.onNext, props.onClick],
  );

  const secondaryOnClick = useMemo(
    () => pickFirstFn(props.onSecondary, props.onBack, props.onCancel),
    [props.onSecondary, props.onBack, props.onCancel],
  );

  const primaryText = useMemo(() => {
    const s = pickFirstStr(
      props.primaryLabel,
      props.ctaLabel,
      props.buttonLabel,
      props.actionLabel,
      props.cta,
    );
    return s || "Continue";
  }, [props.primaryLabel, props.ctaLabel, props.buttonLabel, props.actionLabel, props.cta]);

  const secondaryText = useMemo(() => {
    const s = pickFirstStr(props.secondaryLabel, props.backLabel, props.cancelLabel);
    return s || "Back";
  }, [props.secondaryLabel, props.backLabel, props.cancelLabel]);

  return (
    <div className={`rounded-2xl border bg-white p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {subtitle ? (
            <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
          ) : null}
          {title ? (
            <div className="mt-1 text-xl font-semibold text-slate-900">{title}</div>
          ) : null}
          {description ? (
            <div className="mt-2 text-sm text-slate-600">{description}</div>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      {bullets && bullets.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}

      {(primaryOnClick || secondaryOnClick) ? (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {secondaryOnClick ? (
            <button
              onClick={secondaryOnClick}
              className="rounded-xl border bg-white py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {secondaryText}
            </button>
          ) : (
            <div />
          )}

          {primaryOnClick ? (
            <button
              onClick={primaryOnClick}
              className="rounded-xl bg-black py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              {primaryText}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
