"use client";

import React, { useEffect, useMemo, useState } from "react";
import PenguinMascot from "@/components/mascot/PenguinMascot";
import { usePenguinMood } from "@/components/mascot/usePenguinMood";

type Props = {
  title: string;
  subtitle?: string;
  onDone: () => void;

  ctaLabel?: string;
  autoMs?: number;
};

export default function StageIntroScreen({
  title,
  subtitle,
  onDone,
  ctaLabel = "Start",
  autoMs = 0,
}: Props) {
  const [msLeft, setMsLeft] = useState<number>(autoMs);
  const p = usePenguinMood();

  const showAuto = useMemo(
    () => Number.isFinite(autoMs) && autoMs > 0,
    [autoMs]
  );

  useEffect(() => {
    if (!showAuto) return;
    setMsLeft(autoMs);

    const t = setInterval(() => {
      setMsLeft((v) => Math.max(0, v - 250));
    }, 250);

    return () => clearInterval(t);
  }, [autoMs, showAuto]);

  useEffect(() => {
    if (!showAuto) return;
    if (msLeft <= 0) {
      p.success();
      setTimeout(onDone, 400);
    }
  }, [msLeft, showAuto, onDone, p]);

  const pct =
    showAuto && autoMs > 0
      ? Math.min(100, Math.max(0, (1 - msLeft / autoMs) * 100))
      : 0;

  return (
    <div
      className="relative overflow-hidden rounded-[var(--lx-radius)] border p-8 sm:p-14"
      style={{
        background: "var(--lx-surface)",
        borderColor: "var(--lx-border)",
        boxShadow: "var(--lx-shadow)",
      }}
    >
      {/* Pastel floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--lx-secondary)", opacity: 0.25 }}
        />
        <div
          className="absolute -right-28 -bottom-28 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "var(--lx-accent)", opacity: 0.25 }}
        />
      </div>

      <div className="relative text-center">
        <div className="mx-auto max-w-3xl">

          {/* 🐧 Penguin */}
          <div className="mb-10 flex justify-center">
            <PenguinMascot
              src="/assets/lingox/penguin.png"
              mood={p.mood}
              size={150}
            />
          </div>

          {/* Title */}
          <div
            className="text-5xl font-extrabold tracking-tight sm:text-6xl"
            style={{ color: "var(--lx-text)" }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle ? (
            <div
              className="mt-5 text-xl font-semibold sm:text-2xl"
              style={{ color: "var(--lx-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}

          {/* Auto progress */}
          {showAuto ? (
            <div className="mt-8">
              <div
                className="h-3 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(0,0,0,0.05)" }}
              >
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${pct}%`,
                    background: "var(--lx-accent)",
                  }}
                />
              </div>
              <div
                className="mt-3 text-sm"
                style={{ color: "var(--lx-muted)" }}
              >
                Auto starting…
              </div>
            </div>
          ) : null}

          {/* Buttons */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                p.success();
                setTimeout(onDone, 350);
              }}
              className="rounded-3xl px-8 py-4 text-white transition active:scale-[0.98]"
              style={{
                background: "var(--lx-primary)",
                boxShadow: "0 8px 24px rgba(91,140,255,0.25)",
              }}
            >
              {ctaLabel}
            </button>

            <button
              type="button"
              onClick={onDone}
              className="rounded-3xl px-8 py-4 transition active:scale-[0.98]"
              style={{
                background: "var(--lx-surface)",
                border: "1px solid var(--lx-border)",
                color: "var(--lx-text)",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
