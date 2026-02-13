// apps/web/components/vocab/speed/SpeedChallengeRunner.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { SpeedAttemptResult, SpeedQuestion } from "@/models/vocab/speed.types";

type Props = {
  userId: string;
  questions?: SpeedQuestion[];
  tryIndex?: number; // 1 or 2
  onFinish: (result: SpeedAttemptResult) => void;

  /** Optional tuning */
  secondsPerQuestion?: number; // default 6
  minPassAccuracy?: number; // default 0.7
};

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SpeedChallengeRunner({
  userId,
  questions,
  tryIndex = 1,
  onFinish,
  secondsPerQuestion = 6,
  minPassAccuracy = 0.7,
}: Props) {
  const qs = useMemo(() => (Array.isArray(questions) ? questions : []).filter(Boolean), [questions]);

  const total = qs.length;

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [lastVerdict, setLastVerdict] = useState<"correct" | "wrong" | null>(null);

  const timeLimit = useMemo(() => clamp(Math.floor(secondsPerQuestion), 2, 30), [secondsPerQuestion]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // reset when question set changes
  useEffect(() => {
    setIndex(0);
    setInput("");
    setLocked(false);
    setCorrectCount(0);
    setWrongWordIds([]);
    setLastVerdict(null);
    setTimeLeft(timeLimit);
  }, [qs, timeLimit]);

  // focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  // if no questions, finish immediately
  useEffect(() => {
    if (total !== 0) return;

    const result: SpeedAttemptResult = {
      userId,
      tryIndex,
      totalQuestions: 0,
      correctCount: 0,
      wrongWordIds: [],
      retryWordIds: [],
      accuracy: 0,
      passed: true,
      finishedAt: new Date().toISOString(),
    };

    onFinish(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const q = total > 0 ? qs[index] : null;

  // timer per question
  useEffect(() => {
    if (!q) return;
    if (locked) return;

    setTimeLeft(timeLimit);

    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [q?.id, locked, timeLimit]);

  // when time runs out, auto mark wrong + advance
  useEffect(() => {
    if (!q) return;
    if (locked) return;
    if (timeLeft !== 0) return;

    gradeAndAdvance(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, q?.id, locked]);

  function finishNow(nextCorrectCount: number, nextWrongWordIds: string[]) {
    const accuracy = total === 0 ? 0 : nextCorrectCount / total;
    const passed = accuracy >= minPassAccuracy;

    const result: SpeedAttemptResult = {
      userId,
      tryIndex,
      totalQuestions: total,
      correctCount: nextCorrectCount,
      wrongWordIds: nextWrongWordIds,
      retryWordIds: nextWrongWordIds,
      accuracy,
      passed,
      finishedAt: new Date().toISOString(),
    };

    onFinish(result);
  }

  function gradeAndAdvance(isCorrect: boolean) {
    if (!q) return;
    if (locked) return;

    setLocked(true);

    const wid = String(q.wordId ?? "").trim();

    if (isCorrect) {
      setLastVerdict("correct");
      setCorrectCount((c) => c + 1);
    } else {
      setLastVerdict("wrong");
      if (wid) {
        setWrongWordIds((prev) => (prev.includes(wid) ? prev : [...prev, wid]));
      }
    }

    window.setTimeout(() => {
      setLastVerdict(null);
      setInput("");

      const nextIndex = index + 1;

      // compute next values safely
      const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
      const nextWrong = !isCorrect && wid ? (wrongWordIds.includes(wid) ? wrongWordIds : [...wrongWordIds, wid]) : wrongWordIds;

      if (nextIndex >= total) {
        finishNow(nextCorrect, nextWrong);
        return;
      }

      setIndex(nextIndex);
      setLocked(false);
    }, 450);
  }

  function onSubmit() {
    if (!q) return;
    if (locked) return;

    const ans = norm(q.answer);
    const typed = norm(input);

    const ok = typed.length > 0 && typed === ans;
    gradeAndAdvance(ok);
  }

  if (total === 0) return null;

  const progressText = `${index + 1} / ${total}`;
  const accuracySoFar = index === 0 ? 0 : correctCount / index;

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Speed Challenge</div>
        <div className="text-xs text-slate-500">
          Try {tryIndex} • {progressText}
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-slate-50 p-4">
        <div className="text-xs text-slate-500">Prompt</div>
        <div className="mt-1 text-lg font-bold text-slate-900">{q?.prompt ?? ""}</div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>Type the word</div>
          <div className={timeLeft <= 2 ? "text-red-600 font-semibold" : ""}>⏱ {timeLeft}s</div>
        </div>

        <input
          ref={inputRef}
          value={input}
          disabled={locked}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10"
          placeholder="Type here..."
          autoComplete="off"
          spellCheck={false}
        />

        <button
          onClick={onSubmit}
          disabled={locked || norm(input).length === 0}
          className={[
            "w-full rounded-xl bg-black py-3 text-sm font-semibold text-white",
            locked || norm(input).length === 0 ? "opacity-60" : "hover:opacity-95",
          ].join(" ")}
        >
          Submit
        </button>

        {lastVerdict === "correct" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            ✅ Correct
          </div>
        )}
        {lastVerdict === "wrong" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            ❌ Wrong <span className="text-red-700/80">(Answer: {q?.answer})</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <div>
          Correct: <span className="font-semibold text-slate-900">{correctCount}</span>
        </div>
        <div>
          Accuracy (so far): <span className="font-semibold text-slate-900">{Math.round(accuracySoFar * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
