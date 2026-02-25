"use client";

import React, { useEffect, useMemo, useState } from "react";
import StageIntroScreen from "@/components/common/StageIntroScreen";

type Word = {
  id: string;
  text: string;
  meanings_ko?: string[];
};

type PrescreenResult = {
  knownWordIds: string[];
  unknownWordIds: string[];
};

function safeWords(v: any): Word[] {
  return Array.isArray(v) ? (v as Word[]).filter(Boolean) : [];
}

export default function PrescreenBoard({
  words,
  onFinish,
}: {
  words: Word[];
  onFinish: (r: PrescreenResult) => void;
}) {
  const list = useMemo(() => safeWords(words), [words]);

  const [i, setI] = useState(0);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);

  const cur = list[i] ?? null;
  const total = list.length;

  const commit = (isKnown: boolean) => {
    if (!cur?.id) return;

    const id = cur.id;

    if (isKnown) setKnown((prev) => (prev.includes(id) ? prev : [...prev, id]));
    else setUnknown((prev) => (prev.includes(id) ? prev : [...prev, id]));

    const nextIndex = i + 1;

    if (nextIndex >= total) {
      const knownIds = isKnown ? (known.includes(id) ? known : [...known, id]) : known;
      const unknownIds = !isKnown ? (unknown.includes(id) ? unknown : [...unknown, id]) : unknown;

      onFinish({ knownWordIds: knownIds, unknownWordIds: unknownIds });
      return;
    }

    setI(nextIndex);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") commit(true);
      if (e.key === "2") commit(false);
      if (e.key === "Enter") commit(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cur?.id, total, known, unknown]);

  if (!list.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 text-center text-slate-700">
          No words found for Prescreen.
        </div>
      </div>
    );
  }

  return (
    <div className="lx-panel-wrap">
      <StageIntroScreen
        badge={`Know / Not Yet  ${i + 1}/${total}`}
        title={cur?.text ?? "Word"}
        subtitle="Do you know this word?"
        hint={
          <div>
            <div className="font-extrabold">Choose one.</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Press <b>1</b> for Know, <b>2</b> for Not Yet.
            </div>
          </div>
        }
        primaryLabel="Know"
        secondaryLabel="Not Yet"
        onPrimary={() => commit(true)}
        onSecondary={() => commit(false)}
      />
    </div>
  );
}
