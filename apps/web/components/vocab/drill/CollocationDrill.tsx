"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DrillTask } from "./drill.types";

function pickString(...xs: any[]) {
  for (const x of xs) {
    const s = String(x ?? "").trim();
    if (s) return s;
  }
  return "";
}

function uniqStrings(arr: any[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr ?? []) {
    const s = String(x ?? "").trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function resolveCollocation(task: DrillTask) {
  const t: any = task as any;
  const seed: any = t?.seed ?? {};
  const meta: any = seed?.meta ?? {};

  const prompt = pickString(seed?.prompt, meta?.prompt, "Choose the best collocation:");
  const base = pickString(seed?.base, seed?.stem, seed?.target, meta?.base, meta?.stem, meta?.target, "");

  // phrase could be like: "make ____" or "____ a decision"
  const phrase = pickString(seed?.phrase, seed?.sentence, meta?.phrase, meta?.sentence, "");

  const rawChoices =
    seed?.choices ??
    seed?.options ??
    seed?.items ??
    meta?.choices ??
    meta?.options ??
    seed?.distractors ??
    meta?.distractors ??
    [];

  const choices = uniqStrings(Array.isArray(rawChoices) ? rawChoices : []);

  const correctText = pickString(seed?.answer, seed?.correct, meta?.answer, meta?.correct, seed?.key);
  const correctIndex =
    Number.isFinite(seed?.answerIndex) ? Number(seed?.answerIndex) :
    Number.isFinite(seed?.correctIndex) ? Number(seed?.correctIndex) :
    null;

  let answerIdx: number | null = null;
  if (choices.length) {
    if (correctIndex !== null && correctIndex >= 0 && correctIndex < choices.length) answerIdx = correctIndex;
    else if (correctText) {
      const i = choices.findIndex((c) => c.toLowerCase() === String(correctText).toLowerCase());
      if (i >= 0) answerIdx = i;
    }
  }

  return {
    prompt,
    base,
    phrase,
    choices,
    answerIdx,
    debug: { seed, meta, t },
  };
}

function Choice({
  label,
  state,
  disabled,
  onClick,
}: {
  label: string;
  state: "idle" | "correct" | "wrong" | "dim";
  disabled: boolean;
  onClick: () => void;
}) {
  const cls =
    state === "correct"
      ? "border-emerald-300 bg-emerald-50"
      : state === "wrong"
        ? "border-rose-300 bg-rose-50"
        : state === "dim"
          ? "border-black/10 bg-white/60 opacity-70"
          : "border-black/10 bg-white/80 hover:bg-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-4 text-left transition",
        disabled ? "cursor-default" : "",
        cls,
      ].join(" ")}
    >
      <div className="font-extrabold text-neutral-900" style={{ fontSize: "clamp(14px, 1.7cqi, 18px)" }}>
        {label}
      </div>
    </button>
  );
}

export default function CollocationDrill({
  task,
  onDone,
}: {
  task: DrillTask;
  onDone: (isCorrect: boolean) => void;
}) {
  const { prompt, base, phrase, choices, answerIdx, debug } = useMemo(() => resolveCollocation(task), [task]);

  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPicked(null);
    setLocked(false);
  }, [task]);

  const canAnswer = !locked && choices.length >= 2 && answerIdx !== null;
  const usable = choices.length >= 2 && answerIdx !== null && (!!base || !!phrase);

  function choose(i: number) {
    if (!canAnswer) return;
    setPicked(i);
    setLocked(true);
    const ok = i === answerIdx!;
    window.setTimeout(() => onDone(ok), 380);
  }

  if (!usable) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <div className="font-semibold">COLLOCATION seed is not usable</div>
        <div className="mt-1 text-xs text-rose-700">
          seed에 base/phrase + choices + answer(or answerIndex)가 필요합니다.
        </div>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border bg-white p-2 text-[11px] text-slate-700">
          {JSON.stringify(debug?.seed ?? debug, null, 2)}
        </pre>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-black py-2 text-white"
          onClick={() => onDone(false)}
        >
          Skip this task
        </button>
      </div>
    );
  }

  const headerLine = phrase
    ? phrase
    : base
      ? `Choose a strong collocation with: ${base}`
      : "Choose the best collocation:";

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
        Collocation
      </div>

      <div className="mt-2 text-neutral-900 font-extrabold" style={{ fontSize: "clamp(16px, 2.0cqi, 24px)" }}>
        {prompt}
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white/75 px-5 py-5 text-left">
        <div className="font-extrabold text-neutral-900" style={{ fontSize: "clamp(16px, 2.05cqi, 26px)" }}>
          {headerLine}
        </div>
        {base ? (
          <div className="mt-2 text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
            Base: <span className="font-black text-neutral-900">{base}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.slice(0, 6).map((c, i) => {
          const isPicked = picked === i;
          const isAns = i === answerIdx;
          const state =
            locked
              ? isAns
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "dim"
              : "idle";

          return (
            <Choice
              key={`${c}-${i}`}
              label={c}
              state={state as any}
              disabled={!canAnswer}
              onClick={() => choose(i)}
            />
          );
        })}
      </div>

      <div className="mt-4 text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
        Tap one choice. Auto-advances.
      </div>
    </div>
  );
}
