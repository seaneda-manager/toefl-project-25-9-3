"use client";

import React from "react";

type Step = { index: number; total: number };

type Action = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;

  // legacy/compat
  variant?: string;
  [key: string]: any;
};

type Props = {
  children: React.ReactNode;

  stageKey?: string;
  stageLabel?: string;

  title?: string;
  subtitle?: string;

  step?: Step;
  topRight?: React.ReactNode;

  hint?: string;

  primary?: Action;
  secondary?: Action;

  align?: "left" | "center";
  className?: string;

  // legacy props (ignored intentionally)
  maxWidthClassName?: string;

  [key: string]: any;
};

function Btn({
  kind,
  label,
  onClick,
  disabled,
}: {
  kind: "primary" | "secondary";
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "h-11 rounded-2xl px-5 text-sm font-extrabold transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed";
  const cls =
    kind === "primary"
      ? "bg-emerald-700 text-white hover:bg-emerald-600"
      : "bg-white/80 text-emerald-900 border border-emerald-900/20 hover:bg-white";
  return (
    <button type="button" className={`${base} ${cls}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export default function StageScaffold({
  children,
  stageKey,
  stageLabel,
  title,
  subtitle,
  step,
  topRight,
  hint,
  primary,
  secondary,
  align = "center",
  className,
}: Props) {
  const headerAlign = align === "center" ? "text-center" : "text-left";
  const rowAlign = align === "center" ? "justify-center" : "justify-between";

  return (
    <div className="h-full w-full" data-stage={stageKey ?? ""}>
      <div
        className={[
          "h-full w-full overflow-hidden rounded-[28px]",
          "border border-black/10 bg-white/80 backdrop-blur-[2px]",
          "shadow-[0_18px_50px_rgba(0,0,0,0.16)]",
          className ?? "",
        ].join(" ")}
        // ✅ 핵심: cqi 단위가 StageCard 기준으로 계산되게 함
        style={{ containerType: "inline-size" }}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Top bar */}
          <div className="shrink-0 px-6 pt-5">
            <div className={`flex items-center ${rowAlign} gap-3`}>
              <div className="flex items-center gap-3">
                {stageLabel ? (
                  <div className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-700">
                    {stageLabel}
                  </div>
                ) : null}

                {step ? (
                  <div className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-600">
                    {step.index}/{step.total}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">{topRight}</div>
            </div>

            {(title || subtitle) ? (
              <div className={`mt-4 ${headerAlign}`}>
                {title ? (
                  <div className="text-[clamp(22px,2.0cqi,32px)] font-black text-slate-900">{title}</div>
                ) : null}
                {subtitle ? (
                  <div className="mt-1 text-[clamp(12px,1.25cqi,14px)] font-semibold text-slate-600">{subtitle}</div>
                ) : null}
              </div>
            ) : null}

            {hint ? (
              <div className={`mt-3 ${headerAlign}`}>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-[clamp(12px,1.2cqi,13px)] font-semibold text-slate-600">
                  <span className="text-slate-400">Hint:</span>
                  <span className="text-slate-700">{hint}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto px-6 pb-6 pt-5">
            <div className="h-full w-full">{children}</div>
          </div>

          {/* Footer */}
          {(primary || secondary) ? (
            <div className="shrink-0 px-6 pb-6">
              <div className="flex items-center justify-center gap-3">
                {secondary ? (
                  <Btn kind="secondary" label={secondary.label} onClick={secondary.onClick} disabled={secondary.disabled} />
                ) : null}
                {primary ? (
                  <Btn kind="primary" label={primary.label} onClick={primary.onClick} disabled={primary.disabled} />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
