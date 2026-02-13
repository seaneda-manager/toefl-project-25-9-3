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

function readSeed(task: DrillTask) {
  const t: any = task as any;
  const seed: any = t?.seed ?? {};
  const meta: any = seed?.meta ?? t?.meta ?? {};

  const sentence =
    cleanStr(seed?.sentence) ||
    cleanStr(seed?.blankedSentence) ||
    cleanStr(seed?.stem) ||
    cleanStr(seed?.prompt) ||
    cleanStr(seed?.text) ||
    "";

  const rawChoices = seed?.choices ?? seed?.options ?? meta?.choices ?? meta?.options ?? seed?.items ?? [];
  const choices = uniqStrings(Array.isArray(rawChoices) ? rawChoices : []);

  const answerText = cleanStr(seed?.answer ?? seed?.correct ?? meta?.answer ?? meta?.correct ?? "");
  const answerIndex =
    Number.isFinite(seed?.answerIndex) ? Number(seed.answerIndex) :
    Number.isFinite(seed?.correctIndex) ? Number(seed.correctIndex) :
    null;

  let finalAnswerIdx: number | null = null;

  if (choices.length) {
    if (answerIndex !== null && answerIndex >= 0 && answerIndex < choices.length) {
      finalAnswerIdx = answerIndex;
    } else if (answerText) {
      const i = choices.findIndex((c) => c.toLowerCase() === answerText.toLowerCase());
      if (i >= 0) finalAnswerIdx = i;
    }
  }

  // If sentence has no blank marker, try to blank-out the answerText once.
  let display = sentence;
  if (display && !display.includes("___") && answerText) {
    const re = new RegExp(`\\b${answerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(display)) display = display.replace(re, "___");
  }
  if (display && !display.includes("___")) {
    // minimal safety: show blank at end
    display = `${display} ___`;
  }

  return { sentence: display, choices, answerIdx: finalAnswerIdx, answerText, seed };
}

export default function SentenceBlankDrill({
  task,
  onDone,
}: {
  task: DrillTask;
  onDone: (isCorrect: boolean) => void;
}) {
  const { sentence, choices, answerIdx, answerText, seed } = useMemo(() => readSeed(task), [task]);

  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPicked(null);
    setLocked(false);
  }, [task]);

  const usableMCQ = choices.length >= 2 && answerIdx !== null;

  function choose(i: number) {
    if (!usableMCQ || locked) return;
    setPicked(i);
    setLocked(true);
    const ok = i === answerIdx!;
    window.setTimeout(() => onDone(ok), 450);
  }

  // fallback: free typing (if builder ever provides no choices)
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [task]);

  function submitTyped() {
    if (locked) return;
    const user = cleanStr(typed);
    const ok = user && answerText ? user.toLowerCase() === answerText.toLowerCase() : false;
    setLocked(true);
    window.setTimeout(() => onDone(ok), 450);
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-xs font-semibold text-slate-500">FILL IN THE BLANK</div>

      <div className="mt-2 rounded-xl bg-slate-50 p-4 text-base font-semibold text-slate-900">
        {sentence}
      </div>

      {usableMCQ ? (
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
      ) : (
        <div className="mt-4">
          <div className="text-xs text-slate-500">No choices found. Type the answer.</div>
          <div className="mt-2 flex gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Type your answer"
            />
            <button onClick={submitTyped} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
              OK
            </button>
          </div>

          <details className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
            <summary className="cursor-pointer font-semibold">Debug seed</summary>
            <pre className="mt-2 max-h-56 overflow-auto rounded-lg border bg-white p-2 text-[11px]">
              {JSON.stringify(seed, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
