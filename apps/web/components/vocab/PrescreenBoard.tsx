"use client";

import React, { useEffect, useMemo } from "react";
import StageScaffold from "@/components/common/StageScaffold";

type AnyProps = Record<string, any>;

function pickFirst<T>(...candidates: any[]): T | null {
  for (const c of candidates) if (c !== undefined && c !== null) return c as T;
  return null;
}

function safeCall(fn: any, argSets: any[][]) {
  if (typeof fn !== "function") return false;
  for (const args of argSets) {
    try {
      fn(...args);
      return true;
    } catch {}
  }
  return false;
}

function getWordText(word: any) {
  return String(word?.text ?? word?.lemma ?? word?.target ?? word ?? "").trim();
}

export default function PrescreenBoard(props: AnyProps) {
  const wordObj =
    pickFirst<any>(props.word, props.currentWord, props.item, props.question?.word, props.question) ?? null;

  const wordText = useMemo(() => getWordText(wordObj), [wordObj]);

  const index = pickFirst<number>(props.index, props.currentIndex, props.i, props.progressIndex) ?? 0;
  const total = pickFirst<number>(props.total, props.count, props.totalCount, props.progressTotal) ?? 0;

  const onAnswer = props.onAnswer ?? props.onSelect ?? props.onResponse ?? props.onResult ?? null;
  const onKnow = props.onKnow ?? props.onYes ?? props.onKnown ?? null;
  const onDontKnow = props.onDontKnow ?? props.onNo ?? props.onUnknown ?? null;

  const handle = (known: boolean) => {
    return (
      safeCall(known ? onKnow : onDontKnow, [[known], []]) ||
      safeCall(onAnswer, [
        [known],
        [{ known }],
        [{ value: known ? "KNOW" : "DONT_KNOW", known }],
        [known ? "KNOW" : "DONT_KNOW"],
        [],
      ])
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handle(false);
      if (e.key === "ArrowRight") handle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordText, onAnswer, onKnow, onDontKnow]);

  return (
    <StageScaffold
      stageKey="PRESCREEN"
      stageLabel="Know / Not Yet"
      step={total > 0 ? { index: index + 1, total } : null}
      title={wordText || "—"}
      subtitle="Do you know this word?"
      hint="← Not Yet   •   → Know"
      secondary={{ label: "Not Yet", onClick: () => handle(false), variant: "ghost" }}
      primary={{ label: "Know", onClick: () => handle(true) }}
      align="center"
      maxWidthClassName="max-w-[880px]"
    >
      <div className="text-[14px] font-semibold text-neutral-600">
        Choose one. (Keyboard supported)
      </div>
    </StageScaffold>
  );
}
