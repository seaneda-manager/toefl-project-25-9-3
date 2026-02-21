"use client";

import React from "react";

type Step = { index: number; total: number };

type ButtonSpec = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "ghost";
};

type Props = {
  stageKey?: string;
  stageLabel?: string;
  title?: string;
  subtitle?: string;
  step?: Step | null;
  topRight?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  primary?: ButtonSpec;
  secondary?: ButtonSpec;
  align?: "center" | "left";
  maxWidthClassName?: string;

  cardClassName?: string;
  bodyClassName?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function StagePill({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2",
        "rounded-full px-3 py-1",
        "bg-white/90 text-neutral-800",
        "border border-[rgba(245,208,84,0.45)]",
        "shadow-sm"
      )}
      style={{ backdropFilter: "none" }}
    >
      <span style={{ fontSize: "clamp(11px, 1.2cqi, 13px)" }} className="font-semibold tracking-wide">
        {children}
      </span>
    </div>
  );
}

function StageButton({ spec }: { spec: ButtonSpec }) {
  const disabled = !!spec.disabled;

  const base =
    "inline-flex items-center justify-center rounded-full font-extrabold transition select-none focus:outline-none focus:ring-2 focus:ring-black/10";
  const size = "h-11 px-5";
  const commonShadow = disabled ? "" : "shadow-[0_6px_0_#d4ae2b]";

  const primary = cx(
    "bg-[var(--focus-accent)] text-neutral-900",
    "hover:brightness-[0.98] active:translate-y-[1px]",
    commonShadow
  );
  const ghost = cx(
    "bg-white/80 text-neutral-900",
    "border border-[rgba(0,0,0,0.08)]",
    "hover:bg-white"
  );

  const cls = cx(
    base,
    size,
    spec.variant === "ghost" ? ghost : primary,
    disabled && "opacity-50 pointer-events-none shadow-none"
  );

  const labelStyle: React.CSSProperties = {
    fontSize: "clamp(12px, 1.35cqi, 14px)",
    letterSpacing: "-0.01em",
  };

  if (spec.href) {
    return (
      <a className={cls} href={spec.href} aria-disabled={disabled}>
        <span style={labelStyle}>{spec.label}</span>
      </a>
    );
  }

  return (
    <button className={cls} onClick={spec.onClick} disabled={disabled} type="button">
      <span style={labelStyle}>{spec.label}</span>
    </button>
  );
}

export default function StageScaffold({
  stageKey,
  stageLabel,
  title,
  subtitle,
  step,
  topRight,
  children,
  hint,
  primary,
  secondary,
  align = "center",
  maxWidthClassName,
  cardClassName,
  bodyClassName,
}: Props) {
  return (
    <div
      className="relative h-full w-full"
      data-stage={stageKey ?? stageLabel ?? ""}
      style={{ containerType: "size" as any }}
    >
      {/* Top bar */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: "clamp(16px, 3cqi, 28px)",
          right: "clamp(16px, 3cqi, 28px)",
          top: "clamp(16px, 3cqi, 28px)",
        }}
      >
        <div className="flex items-center gap-2">
          {stageLabel ? <StagePill>{stageLabel}</StagePill> : null}
        </div>

        <div className="flex items-center gap-3">
          {step ? (
            <StagePill>
              <span className="tabular-nums">
                {step.index}/{step.total}
              </span>
            </StagePill>
          ) : null}

          {topRight ? <div className="flex items-center gap-2">{topRight}</div> : null}
        </div>
      </div>

      {/* Center card */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: "clamp(16px, 3cqi, 28px)",
          right: "clamp(16px, 3cqi, 28px)",
          top: "clamp(72px, 12cqi, 132px)",
          bottom: "clamp(92px, 14cqi, 168px)",
        }}
      >
        <div
          className={cx(
            "w-full",
            maxWidthClassName ?? "max-w-[880px]",
            "rounded-[24px] overflow-hidden",
            "bg-white/88",
            "border border-[rgba(245,208,84,0.35)]",
            "shadow-[0_10px_40px_rgba(0,0,0,0.12)]",
            cardClassName
          )}
          style={{ backdropFilter: "none" }}
        >
          {(title || subtitle) && (
            <div className="px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              {title ? (
                <h1
                  className="font-extrabold text-neutral-900 leading-tight"
                  style={{ fontSize: "clamp(20px, 3.6cqi, 44px)", letterSpacing: "-0.02em" }}
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-2 text-neutral-600" style={{ fontSize: "clamp(12px, 1.55cqi, 14px)" }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          )}

          <div
            className={cx(
              "px-6 py-6",
              "max-h-[60cqh] overflow-auto",
              align === "center" ? "text-center" : "text-left",
              bodyClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute flex items-center justify-between gap-4"
        style={{
          left: "clamp(16px, 3cqi, 28px)",
          right: "clamp(16px, 3cqi, 28px)",
          bottom: "clamp(16px, 3cqi, 28px)",
        }}
      >
        <div className="min-w-0">
          {hint ? (
            <div
              className="text-neutral-700 truncate"
              style={{ fontSize: "clamp(12px, 1.45cqi, 13px)" }}
              title={hint}
            >
              {hint}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {secondary ? <StageButton spec={{ ...secondary, variant: secondary.variant ?? "ghost" }} /> : null}
          {primary ? <StageButton spec={{ ...primary, variant: primary.variant ?? "primary" }} /> : null}
        </div>
      </div>
    </div>
  );
}
