"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { SpellingResult } from "@/models/vocab/session/spelling";
import StageScaffold from "@/components/common/stage/StageScaffold";

type WordItem = {
  id: string;
  text: string;
  meanings_ko?: string[];
};

type Props = {
  words: WordItem[];
  onFinish: (r: SpellingResult) => void;
};

function clean(s: unknown) {
  return String(s ?? "").trim();
}

export default function PrescreenSpellingBoard({ words, onFinish }: Props) {
  const list = useMemo(
    () => (Array.isArray(words) ? words.filter((w) => w?.id && w?.text) : []),
    [words]
  );

  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [miss, setMiss] = useState(0);
  const [reveal, setReveal] = useState(false);

  const finishedRef = useRef(false);
  const failedRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cur = list[idx];

  useEffect(() => {
    if (list.length === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinish({ spellingFailedIds: [] } as any);
    }
  }, [list.length, onFinish]);

  useEffect(() => {
    if (!cur) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [idx, cur?.id]);

  if (!cur) return null;

  const hintKo = clean(cur.meanings_ko?.[0] ?? "") || "(뜻 미입력)";
  const answer = clean(cur.text);

  function markFailedOnce(wordId: string) {
    if (!failedRef.current.includes(wordId)) failedRef.current.push(wordId);
  }

  function goNext() {
    setValue("");
    setMiss(0);
    setReveal(false);

    const next = idx + 1;
    if (next >= list.length) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish({ spellingFailedIds: failedRef.current } as any);
      }
      return;
    }
    setIdx(next);
  }

  function submit() {
    if (!answer) return;

    const typed = clean(value).toLowerCase();
    const ok = typed === answer.toLowerCase();

    if (ok) {
      goNext();
      return;
    }

    const nextMiss = miss + 1;
    setMiss(nextMiss);

    if (nextMiss >= 2) {
      markFailedOnce(cur.id);
      setReveal(true);
      return;
    }

    setValue("");
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function iDontKnow() {
    markFailedOnce(cur.id);
    setReveal(true);
  }

  const hint =
    reveal ? "Marked as spelling-failed. Continue to the next word." : miss > 0 ? `Try again (${miss}/2)` : "Press Enter to submit.";

  const primary = reveal
    ? { label: "Next", onClick: goNext }
    : { label: "Check", onClick: submit, disabled: clean(value).length === 0 };

  const secondary = !reveal ? { label: "I don't know", onClick: iDontKnow, variant: "ghost" as const } : undefined;

  return (
    <div className="h-full w-full">
      <StageScaffold
        stageKey="spelling"
        stageLabel="Spelling Check"
        title="Type the spelling"
        subtitle="Type the word that matches the meaning. Two attempts."
        step={{ index: idx + 1, total: list.length }}
        hint={hint}
        primary={primary}
        secondary={secondary}
        align="center"
      >
        <div className="mx-auto max-w-[720px] space-y-5">
          <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-4">
            <div className="text-neutral-700 font-extrabold" style={{ fontSize: "clamp(16px, 2.2cqi, 26px)" }}>
              {hintKo}
            </div>
            <div className="mt-2 text-neutral-500" style={{ fontSize: "clamp(12px, 1.4cqi, 14px)" }}>
              Meaning hint (Korean)
            </div>
          </div>

          {!reveal ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-5 py-4 text-center font-extrabold outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Type here..."
                  style={{ fontSize: "clamp(18px, 2.3cqi, 30px)" }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div className="text-neutral-600" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                {miss === 0 ? "One typo allowed. Second miss reveals the answer." : "Careful. One more miss reveals the answer."}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-6">
              <div className="text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                Answer
              </div>
              <div className="mt-1 font-black text-[#5D8E93]" style={{ fontSize: "clamp(28px, 4.2cqi, 54px)" }}>
                {answer || "—"}
              </div>
            </div>
          )}
        </div>
      </StageScaffold>
    </div>
  );
}
