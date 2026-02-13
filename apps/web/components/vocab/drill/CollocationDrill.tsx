"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DrillTask } from "./drill.types";

function cleanStr(v: unknown) {
  return String(v ?? "").trim();
}
function uniqStrings(xs: any[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs ?? []) {
    const s = cleanStr(x);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function parsePair(s: string): { base: string; right: string } | null {
  const raw = cleanStr(s);
  if (!raw) return null;
  if (raw.includes("|")) {
    const [a, b] = raw.split("|").map((x) => x.trim());
    if (a && b) return { base: a, right: b };
  }
  if (raw.includes("___")) {
    const [a, b] = raw.split("___").map((x) => x.trim());
    if (a && b) return { base: a, right: b };
  }
  return null;
}

function readSeed(task: DrillTask) {
  const t: any = task as any;
  const seed: any = t?.seed ?? {};
  const meta: any = seed?.meta ?? t?.meta ?? {};

  const prompt = cleanStr(seed?.prompt) || "Choose the best collocation:";

  // base
  const base =
    cleanStr(seed?.base) ||
    cleanStr(seed?.left) ||
    cleanStr(meta?.base) ||
    cleanStr(meta?.left) ||
    "";

  const rawChoices = seed?.choices ?? seed?.options ?? meta?.choices ?? meta?.options ?? seed?.items ?? [];
  const choices = uniqStrings(Array.isArray(rawChoices) ? rawChoices : []);

  const answerText = cleanStr(seed?.answer ?? seed?.correct ?? meta?.answer ?? meta?.correct ?? "");
  const answerIndex =
    Number.isFinite(seed?.answerIndex) ? Number(seed.answerIndex) :
    Number.isFinite(seed?.correctIndex) ? Number(seed.correctIndex) :
    null;

  let answerIdx: number | null = null;
  if (choices.length) {
    if (answerIndex !== null && answerIndex >= 0 && answerIndex < choices.length) {
      answerIdx = answerIndex;
    } else if (answerText) {
      const i = choices.findIndex((c) => c.toLowerCase() === answerText.toLowerCase());
      if (i >= 0) answerIdx = i;
    }
  }

  // If choices look like "base|right", display right side only.
  const parsed = choices
    .map((c) => ({ raw: c, pair: parsePair(c) }))
    .filter((x) => x.pair);

  const displayChoices =
    parsed.length === choices.length && parsed.length > 0
      ? parsed.map((x) => x.pair!.right)
      : choices;

  // Also normalize base from answer if missing
  let finalBase = base;
  if (!finalBase && answerText) {
    const p = parsePair(answerText);
    if (p) finalBase = p.base;
  }
  if (!finalBase && parsed.length) finalBase = parsed[0]!.pair!.base;

  // remap answerIdx if we converted choices
  let displayAnswerIdx = answerIdx;
  if (displayAnswerIdx !== null && displayChoices !== choices) {
    // keep same index
    displayAnswerIdx = answerIdx;
  }

  return { prompt, base: finalBase, choices: displayChoices, answerIdx: displayAnswerIdx, seed };
}

export default function CollocationDrill({
  task,
  onDone,
}: {
  task: DrillTask;
  onDone: (isCorrect: boolean) => void;
}) {
  const { prompt, base, choices, answerIdx, seed } = useMemo(() => readSeed(task), [task]);

  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPicked(null);
    setLocked(false);
  }, [task]);

  const usable = base && choices.length >= 2 && answerIdx !== null;

  function choose(i: number) {
    if (!usable || locked) return;
    setPicked(i);
    setLocked(true);
    const ok = i === answerIdx!;
    window.setTimeout(() => onDone(ok), 450);
  }

  if (!usable) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <div className="font-semibold">COLLOCATION seed is not usable</div>
        <div className="mt-1 text-xs text-red-700">
          base + choices + answer(또는 answerIndex)가 필요합니다.
        </div>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border bg-white p-2 text-[11px] text-slate-700">
          {JSON.stringify(seed, null, 2)}
        </pre>
        <button className="mt-3 w-full rounded-xl bg-black py-2 text-white" onClick={() => onDone(false)}>
          Skip this task
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-xs font-semibold text-slate-500">COLLOCATION</div>

      <div className="mt-2 text-lg font-semibold text-slate-900">
        {prompt}{" "}
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono">{base}</span>{" "}
        <span className="text-slate-500">___</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.slice(0, 6).map((c, i) => {
          const isPicked = picked === i;
          const isAnswer = i === answerIdx;
          const cls = locked
            ? isAnswer
              ? "border-emerald-300 bg-emerald-50"
              : isPicked
                ? "border-rose-300 bg-rose-50"
                : "border-slate-200"
            : "border-slate-200 hover:bg-slate-50";

          return (
            <button
              key={`${c}-${i}`}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}
              disabled={locked}
              onClick={() => choose(i)}
            >
              <div className="font-semibold text-slate-900">{c}</div>
              {locked && isAnswer ? (
                <div className="mt-1 text-xs font-semibold text-emerald-700">Correct</div>
              ) : locked && isPicked && !isAnswer ? (
                <div className="mt-1 text-xs font-semibold text-rose-700">Incorrect</div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500">Tap one choice. Auto-advances.</div>
    </div>
  );
}
