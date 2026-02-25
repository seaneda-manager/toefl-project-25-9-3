"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LearningWord } from "./learning.types";
import StageScaffold from "@/components/common/stage/StageScaffold";

type Accent = "US" | "UK";

type Props = {
  word: LearningWord;
  index: number;
  total: number;
  onDoneWord: () => void;
};

function normEn(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
function normKo(s: string) {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .replace(/[.,!?~`'"“”‘’(){}\[\]<>]/g, "")
    .trim();
}

function splitList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  return s
    .split(/[\n;|/]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}
function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function pickWordText(word: any): string {
  return String(word?.text ?? word?.lemma ?? word?.target ?? "").trim();
}
function pickMeaningsKo(word: any): string[] {
  return uniq([
    ...splitList(word?.meanings_ko),
    ...splitList(word?.meaning_ko),
    ...splitList(word?.meaningKo),
  ]);
}
function pickSynonyms(word: any): string[] {
  const syn = uniq([
    ...splitList(word?.synonyms_en_simple),
    ...splitList(word?.synonyms_en),
    ...splitList(word?.synonyms),
  ]);
  if (syn.length > 0) return syn;

  const fallback = uniq([
    ...splitList(word?.meanings_en_simple),
    ...splitList(word?.meaning_en_simple),
    ...splitList(word?.definition_en),
  ]);
  return fallback.slice(0, 3);
}

function speak(text: string, accent: Accent) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = accent === "US" ? "en-US" : "en-GB";
  u.rate = 0.95;
  u.pitch = 1.0;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function FlagButton({
  active,
  flag,
  ariaLabel,
  onClick,
}: {
  active: boolean;
  flag: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "h-9 w-11 rounded-full font-extrabold",
        "bg-white/90 border border-black/10",
        active ? "ring-2 ring-black/10" : "hover:bg-white",
        "inline-flex items-center justify-center",
      ].join(" ")}
      style={{ fontSize: "18px", lineHeight: 1 }}
    >
      {flag}
    </button>
  );
}

export default function LearningShowroom({ word, index, total, onDoneWord }: Props) {
  const WORD_PALE = "#86AFA1";

  const [accent, setAccent] = useState<Accent>("US");

  const w: any = word as any;
  const target = useMemo(() => pickWordText(w), [w]);
  const targetNorm = useMemo(() => normEn(target), [target]);

  const meaningsKo = useMemo(() => pickMeaningsKo(w), [w]);
  const synonyms = useMemo(() => pickSynonyms(w), [w]);

  // ✅ “희미하게 보여줄 정답”
  const meaning1Expected = meaningsKo[0] ?? "";
  const meaning2Expected = meaningsKo[1] ?? (meaningsKo[0] ?? "");

  const [spelling, setSpelling] = useState("");
  const [spellingOk, setSpellingOk] = useState(false);

  const [meaning1, setMeaning1] = useState("");
  const [meaning1Ok, setMeaning1Ok] = useState(false);

  const [meaning2, setMeaning2] = useState("");
  const [meaning2Ok, setMeaning2Ok] = useState(false);

  const spellingRef = useRef<HTMLInputElement | null>(null);
  const meaning1Ref = useRef<HTMLInputElement | null>(null);
  const meaning2Ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAccent("US");

    setSpelling("");
    setSpellingOk(false);

    setMeaning1("");
    setMeaning1Ok(false);

    setMeaning2("");
    setMeaning2Ok(false);

    const t = window.setTimeout(() => spellingRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [targetNorm]);

  const passSpelling = () => {
    if (spellingOk) return;
    setSpellingOk(true);
    if (target) speak(target, accent);
    window.setTimeout(() => meaning1Ref.current?.focus(), 250);
  };

  const onChangeSpelling = (v: string) => {
    setSpelling(v);
    if (!targetNorm) return;
    if (normEn(v) === targetNorm) passSpelling();
  };

  const tryPassMeaning1 = (v: string) => {
    if (meaning1Ok) return;
    if (!meaning1Expected) return;
    if (normKo(v) === normKo(meaning1Expected)) {
      setMeaning1Ok(true);
      window.setTimeout(() => meaning2Ref.current?.focus(), 250);
    }
  };

  const tryPassMeaning2 = (v: string) => {
    if (meaning2Ok) return;
    if (!meaning2Expected) return;
    if (normKo(v) === normKo(meaning2Expected)) {
      setMeaning2Ok(true);
    }
  };

  const nextEnabled = spellingOk && meaning1Ok && meaning2Ok;

  const syn1 = synonyms[0] ?? "";
  const syn2 = synonyms[1] ?? synonyms[0] ?? "";

  const topRight = (
    <div className="flex items-center gap-2">
      <FlagButton active={accent === "US"} flag="🇺🇸" ariaLabel="US accent" onClick={() => setAccent("US")} />
      <FlagButton active={accent === "UK"} flag="🇬🇧" ariaLabel="UK accent" onClick={() => setAccent("UK")} />
      <button
        type="button"
        onClick={() => target && speak(target, accent)}
        className="h-9 px-4 rounded-full font-extrabold bg-white/90 border border-black/10 hover:bg-white"
        style={{ fontSize: "clamp(12px, 1.35cqi, 14px)" }}
      >
        Play
      </button>
    </div>
  );

  return (
    <div className="h-full w-full">
      <StageScaffold
        stageKey="learning"
        stageLabel="Learning"
        // ✅ 2) researcher 타이틀 제거: title은 아예 안 넘김
        subtitle="Type spelling, then enter two meanings to unlock synonyms."
        step={{ index: index + 1, total }}
        topRight={topRight}
        // ✅ 4) Hint 제거: hint prop 자체를 안 넘김
        primary={{ label: "Next", onClick: onDoneWord, disabled: !nextEnabled }}
        align="center"
      >
        {/* 카드가 커져도 “의도적으로” 보이게 가운데 정렬 */}
        <div className="h-full w-full flex flex-col justify-center">
          <div className="w-full space-y-5">
            {/* 5) Spelling: 정답은 희미하게, 타이핑하면 검게 */}
            <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-5">
              <div className="text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                Spelling
              </div>

              <div className="relative mt-3">
                {/* faint answer */}
                <div
                  className="absolute inset-0 grid place-items-center select-none pointer-events-none"
                  style={{
                    color: WORD_PALE,
                    fontWeight: 900,
                    fontSize: "clamp(28px, 4.0cqi, 56px)",
                    letterSpacing: "-0.02em",
                    opacity: spelling.length > 0 ? 0.18 : 0.55,
                  }}
                >
                  {target || "WORD"}
                </div>

                <input
                  ref={spellingRef}
                  value={spelling}
                  onChange={(e) => onChangeSpelling(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && normEn(spelling) === targetNorm) passSpelling();
                  }}
                  disabled={spellingOk}
                  className={[
                    "w-full rounded-2xl border border-black/10 bg-white/80 px-5 py-4 text-center outline-none",
                    "font-extrabold focus:ring-2 focus:ring-black/10",
                    spellingOk ? "text-neutral-400" : "text-neutral-900",
                  ].join(" ")}
                  style={{ fontSize: "clamp(18px, 2.3cqi, 30px)", letterSpacing: "-0.02em" }}
                  placeholder=""
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {spellingOk ? (
                <div className="mt-3 text-emerald-700 font-extrabold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                  ✅ Spelling OK
                </div>
              ) : null}
            </div>

            {/* 6~7) Meanings: 정답 한글이 희미하게, 그대로 치면 검게 + Syn 노출 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Meaning 1 */}
              <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-5">
                <div className="text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                  Meaning 1 (KO)
                </div>

                <div className="relative mt-3">
                  <div
                    className="absolute inset-0 grid place-items-center select-none pointer-events-none"
                    style={{
                      color: "#9CA3AF",
                      fontWeight: 800,
                      fontSize: "clamp(16px, 2.0cqi, 24px)",
                      opacity: meaning1.length > 0 ? 0.18 : 0.55,
                    }}
                  >
                    {meaning1Expected || "—"}
                  </div>

                  <input
                    ref={meaning1Ref}
                    value={meaning1}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMeaning1(v);
                      if (spellingOk) tryPassMeaning1(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && spellingOk) tryPassMeaning1(meaning1);
                    }}
                    disabled={!spellingOk || meaning1Ok}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-center outline-none font-extrabold",
                      "border-black/10 bg-white/80 focus:ring-2 focus:ring-black/10",
                      !spellingOk ? "opacity-50" : "",
                      meaning1Ok ? "text-neutral-400" : "text-neutral-900",
                    ].join(" ")}
                    style={{ fontSize: "clamp(16px, 2.0cqi, 24px)" }}
                    placeholder=""
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {meaning1Ok ? (
                  <div className="mt-3 inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-4 py-2 font-extrabold">
                    <span className="text-neutral-700" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                      Syn:
                    </span>
                    <span className="ml-2" style={{ color: "#F2B84B", fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                      {syn1 || "—"}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Meaning 2 */}
              <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-5">
                <div className="text-neutral-600 font-semibold" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                  Meaning 2 (KO)
                </div>

                <div className="relative mt-3">
                  <div
                    className="absolute inset-0 grid place-items-center select-none pointer-events-none"
                    style={{
                      color: "#9CA3AF",
                      fontWeight: 800,
                      fontSize: "clamp(16px, 2.0cqi, 24px)",
                      opacity: meaning2.length > 0 ? 0.18 : 0.55,
                    }}
                  >
                    {meaning2Expected || "—"}
                  </div>

                  <input
                    ref={meaning2Ref}
                    value={meaning2}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMeaning2(v);
                      if (meaning1Ok) tryPassMeaning2(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && meaning1Ok) tryPassMeaning2(meaning2);
                    }}
                    disabled={!meaning1Ok || meaning2Ok}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-center outline-none font-extrabold",
                      "border-black/10 bg-white/80 focus:ring-2 focus:ring-black/10",
                      !meaning1Ok ? "opacity-50" : "",
                      meaning2Ok ? "text-neutral-400" : "text-neutral-900",
                    ].join(" ")}
                    style={{ fontSize: "clamp(16px, 2.0cqi, 24px)" }}
                    placeholder=""
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {meaning2Ok ? (
                  <div className="mt-3 inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-4 py-2 font-extrabold">
                    <span className="text-neutral-700" style={{ fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                      Syn:
                    </span>
                    <span className="ml-2" style={{ color: "#F2B84B", fontSize: "clamp(12px, 1.35cqi, 13px)" }}>
                      {syn2 || "—"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 8) Next는 이미 nextEnabled로 활성화 */}
          </div>
        </div>
      </StageScaffold>
    </div>
  );
}
