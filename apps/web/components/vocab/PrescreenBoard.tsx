"use client";

import React, { useEffect, useMemo, useState } from "react";

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

/* ── Progress Bar ─────────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-[#0F766E]">어휘 확인</span>
        <span className="text-slate-400">
          <span className="text-[#F97316] font-bold">{current}</span>
          <span className="text-slate-300 mx-0.5">/</span>
          {total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#0F766E] transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
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
  const [animKey, setAnimKey] = useState(0);

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

    setAnimKey((k) => k + 1);
    setI(nextIndex);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "1" || e.key === "Enter") commit(true);
      if (e.key === "2") commit(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cur?.id, total, known, unknown]);

  if (!list.length) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#F7FAF9]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          단어가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#F7FAF9]">
      <div
        className="flex flex-col w-[min(420px,88%)] gap-6"
        key={animKey}
        style={{ animation: "lx-card-in 220ms cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* 헤더 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold tracking-widest text-[#0F766E] uppercase">
              LEXiOX
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-400">어휘 확인</span>
          </div>
          <ProgressBar current={i + 1} total={total} />
        </div>

        {/* 단어 카드 */}
        <div className="rounded-3xl bg-white shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-slate-100 px-8 py-10 text-center space-y-4">
          {/* 단어 */}
          <p className="text-[clamp(48px,7cqi,80px)] font-extrabold tracking-tight text-slate-900 leading-tight">
            {cur?.text ?? ""}
          </p>

          {/* 구분선 */}
          <div className="w-10 h-[2px] bg-[#0F766E] mx-auto rounded-full opacity-40" />

          {/* 질문 */}
          <p className="text-sm font-semibold text-slate-500">
            이 단어를 알고 있나요?
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => commit(true)}
            className="w-full rounded-2xl bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.98] text-white font-bold text-base py-4 transition-all duration-150 shadow-sm"
          >
            알아요 <span className="ml-2 opacity-50 text-xs font-semibold">(1)</span>
          </button>
          <button
            type="button"
            onClick={() => commit(false)}
            className="w-full rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-base py-4 transition-all duration-150 border border-slate-200 shadow-sm"
          >
            아직 몰라요 <span className="ml-2 opacity-40 text-xs font-semibold">(2)</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes lx-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
