"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import StageIntroScreen from "@/components/common/StageIntroScreen";

type Word = {
  id: string;
  text: string;
  meanings_ko?: string[];
};

type SpellingResult = {
  spellingFailedIds: string[];
};

function safeWords(v: any): Word[] {
  return Array.isArray(v) ? (v as Word[]).filter(Boolean) : [];
}

function norm(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

export default function PrescreenSpellingBoard({
  words,
  onFinish,
}: {
  words: Word[];
  onFinish: (r: SpellingResult) => void;
}) {
  const list = useMemo(() => safeWords(words), [words]);
  const total = list.length;

  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [pulse, setPulse] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const cur = list[i] ?? null;
  const answer = cur?.text ?? "";
  const meaning = (cur?.meanings_ko ?? []).filter(Boolean).slice(0, 2);

  const done = (nextFailed: string[]) => onFinish({ spellingFailedIds: nextFailed });

  const goNext = (nextFailed: string[]) => {
    const nextIndex = i + 1;
    if (nextIndex >= total) return done(nextFailed);

    setI(nextIndex);
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const markFailAndNext = () => {
    if (!cur?.id) return;
    const nextFailed = failedIds.includes(cur.id) ? failedIds : [...failedIds, cur.id];
    setFailedIds(nextFailed);
    goNext(nextFailed);
  };

  const submit = () => {
    if (!cur?.id) return;

    const ok = norm(value) === norm(answer);

    if (ok) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 280);
      goNext(failedIds);
      return;
    }

    setShake(true);
    window.setTimeout(() => setShake(false), 260);

    if (!failedIds.includes(cur.id)) setFailedIds((p) => [...p, cur.id]);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        markFailAndNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, value, answer, failedIds, cur?.id]);

  if (!list.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 text-center text-slate-700">
          No words found for Spelling Check.
        </div>
      </div>
    );
  }

  return (
    <div className="lx-panel-wrap">
      <div className={[shake ? "wrong" : "", pulse ? "correct" : ""].join(" ")}>
        <StageIntroScreen
          badge={
            <>
              Spelling Check {i + 1}/{total}{" "}
              <span className="text-slate-500">(Enter to submit · Esc to skip)</span>
            </>
          }
          title="Type the spelling"
          subtitle={meaning.length ? `Meaning: ${meaning.join(" / ")}` : "Meaning not available"}
          hint={
            <div>
              <div className="font-extrabold">Type the correct spelling.</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                Press <b>Enter</b> to submit. Press <b>Esc</b> to skip (counts as failed).
              </div>
            </div>
          }
          primaryLabel="Submit"
          secondaryLabel="Not sure"
          onPrimary={submit}
          onSecondary={markFailAndNext}
        >
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type here..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="mt-3 text-xs font-semibold text-slate-500">
              Failed so far: <span className="text-slate-700">{failedIds.length}</span>
            </div>
          </div>
        </StageIntroScreen>
      </div>
    </div>
  );
}
