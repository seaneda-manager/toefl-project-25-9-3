// apps/web/components/vocab/prescreen/PrescreenSpellingBoard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { VocabWordCore } from "@/models/vocab";
import type { SpellingResult } from "@/models/vocab/session/spelling";

type Props = {
  words: VocabWordCore[];
  onFinish: (result: SpellingResult) => void;
};

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pickMeaning(w: any): string {
  // try a few common fields safely
  const ko = w?.meanings_ko;
  const en = w?.meanings_en_simple;

  if (Array.isArray(en) && en.length) return en[0];
  if (typeof en === "string" && en.trim()) return en;

  if (Array.isArray(ko) && ko.length) return ko[0];
  if (typeof ko === "string" && ko.trim()) return ko;

  return "";
}

function pickAnswerSet(w: any): string[] {
  const a: string[] = [];
  if (w?.text) a.push(String(w.text));
  if (w?.lemma) a.push(String(w.lemma));
  if (w?.word) a.push(String(w.word));
  return Array.from(new Set(a.map(norm).filter(Boolean)));
}

export default function PrescreenSpellingBoard({ words, onFinish }: Props) {
  const list = useMemo(() => (words ?? []).filter(Boolean), [words]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [attemptsById, setAttemptsById] = useState<Record<string, number>>({});
  const [wrongSet, setWrongSet] = useState<Set<string>>(new Set());
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());

  const current = list[idx] as any | undefined;

  const total = list.length;
  const done = idx >= total;

  useEffect(() => {
    // auto-finish if empty
    if (total === 0) {
      const result = {
        ok: true,
        total: 0,
        correct: 0,
        wrong: 0,
        wrongWordIds: [],
        incorrectWordIds: [],
        attemptsById: {},
        finishedAt: new Date().toISOString(),
      } as unknown as SpellingResult;
      onFinish(result);
    }
  }, [total, onFinish]);

  useEffect(() => {
    setMsg(null);
    setValue("");
    // focus input on each word
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [idx]);

  function finishNow() {
    const wrongWordIds = Array.from(wrongSet);
    const result = {
      ok: true,
      total,
      correct: correctSet.size,
      wrong: wrongWordIds.length,

      // common field candidates (so page.tsx can read whichever it expects)
      wrongWordIds,
      incorrectWordIds: wrongWordIds,
      missedWordIds: wrongWordIds,

      attemptsById,
      finishedAt: new Date().toISOString(),
    } as unknown as SpellingResult;

    onFinish(result);
  }

  function markWrong(wordId: string) {
    setWrongSet((prev) => new Set(prev).add(wordId));
  }

  function markCorrect(wordId: string) {
    setCorrectSet((prev) => new Set(prev).add(wordId));
  }

  function bumpAttempt(wordId: string) {
    setAttemptsById((prev) => {
      const n = (prev[wordId] ?? 0) + 1;
      return { ...prev, [wordId]: n };
    });
  }

  function goNext() {
    const next = idx + 1;
    if (next >= total) {
      setIdx(next);
      finishNow();
      return;
    }
    setIdx(next);
  }

  function onSubmit() {
    if (!current) return;

    const id = String(current.id ?? "");
    const answers = pickAnswerSet(current);
    const typed = norm(value);

    bumpAttempt(id);

    if (typed && answers.includes(typed)) {
      markCorrect(id);
      setMsg("✅ Correct");
      setTimeout(() => goNext(), 250);
      return;
    }

    const tries = (attemptsById[id] ?? 0) + 1; // because state updates async
    if (tries >= 2) {
      markWrong(id);
      setMsg("❌ Wrong (auto-next)");
      setTimeout(() => goNext(), 350);
      return;
    }

    setMsg("❌ Try again");
    setValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-3 px-4 py-4">
        <div className="rounded-2xl border bg-white p-6 text-center">
          <div className="text-lg font-semibold">Spelling Check</div>
          <div className="mt-2 text-sm text-slate-600">Finishing…</div>
        </div>
      </div>
    );
  }

  const meaning = pickMeaning(current);
  const id = String(current?.id ?? "");
  const tries = attemptsById[id] ?? 0;

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-4 py-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Spelling Check</div>
          <div className="text-xs text-slate-500">
            {idx + 1}/{total}
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-500">Meaning</div>
          <div className="mt-1 text-sm text-slate-800">
            {meaning || "(no meaning)"}
          </div>
        </div>

        <div className="mt-4">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Type the word…"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <div>Try: {Math.min(tries + 1, 2)}/2</div>
            {msg ? <div className="font-semibold">{msg}</div> : <div />}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="w-full rounded-xl border py-3 text-sm"
            onClick={() => {
              // skip counts as wrong
              if (id) markWrong(id);
              goNext();
            }}
          >
            Skip
          </button>

          <button
            className="w-full rounded-xl bg-black py-3 text-sm text-white"
            onClick={onSubmit}
          >
            Check
          </button>
        </div>
      </div>
    </div>
  );
}
