// apps/web/components/vocab/PreScreenBoard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VocabWordCore } from "@/models/vocab";
import type { PrescreenResult } from "@/models/vocab/session/prescreen";

type Props = {
  words: VocabWordCore[];
  onFinish: (result: PrescreenResult) => void;
};

export default function PrescreenBoard({ words, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [knownWordIds, setKnownWordIds] = useState<string[]>([]);
  const [unknownWordIds, setUnknownWordIds] = useState<string[]>([]);
  const [flash, setFlash] = useState<"known" | "unknown" | "idle">("idle");
  const [locked, setLocked] = useState(false);

  const finishedRef = useRef(false);
  const total = words.length;
  const current = words[index];

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((index + 1) / total) * 100);
  }, [index, total]);

  /* =========================
     finish guard (CALL ONCE)
  ========================= */
  useEffect(() => {
    if (finishedRef.current) return;
    if (index < total) return;

    finishedRef.current = true;
    onFinish({
      knownWordIds,
      unknownWordIds,
    });
  }, [index, total, knownWordIds, unknownWordIds, onFinish]);

  if (!current) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
        Prescreen 완료
      </div>
    );
  }

  /* =========================
     handlers
  ========================= */

  function commitKnown() {
    if (locked) return;
    setLocked(true);
    setFlash("known");

    setKnownWordIds((p) => [...p, current.id]);

    setTimeout(() => {
      setFlash("idle");
      setLocked(false);
      setIndex((i) => i + 1);
    }, 200);
  }

  function commitUnknown() {
    if (locked) return;
    setLocked(true);
    setFlash("unknown");

    setUnknownWordIds((p) => [...p, current.id]);

    setTimeout(() => {
      setFlash("idle");
      setLocked(false);
      setIndex((i) => i + 1);
    }, 200);
  }

  const flashStyle =
    flash === "known"
      ? "border-emerald-500 bg-emerald-50"
      : flash === "unknown"
      ? "border-amber-400 bg-amber-50"
      : "border-gray-200 bg-white";

  /* =========================
     render
  ========================= */

  return (
    <div className="space-y-4">
      {/* progress */}
      <header className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Know / Don’t-know Prescreen</span>
          <span>
            {index + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* card */}
      <main className="flex min-h-[260px] items-center justify-center">
        <div
          className={`w-full max-w-md rounded-2xl border px-6 py-8 text-center shadow-sm transition ${flashStyle}`}
        >
          <p className="mb-2 text-xs text-gray-500">
            이 단어를 보면 의미가 바로 떠오르나요?
          </p>
          <p className="text-3xl font-bold">{current.text}</p>
          {current.pos && (
            <p className="mt-1 text-[11px] text-gray-400">
              {current.pos}
            </p>
          )}
        </div>
      </main>

      {/* buttons */}
      <footer className="flex justify-center gap-3">
        <button
          onClick={commitUnknown}
          disabled={locked}
          className="w-40 rounded-xl bg-gray-100 py-3 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40"
        >
          몰라요 🤔
        </button>
        <button
          onClick={commitKnown}
          disabled={locked}
          className="w-40 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          알아요 👍
        </button>
      </footer>
    </div>
  );
}
