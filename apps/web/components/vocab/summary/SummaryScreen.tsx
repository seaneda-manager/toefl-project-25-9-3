"use client";

import React, { useMemo } from "react";
import StageScaffold from "@/components/common/stage/StageScaffold";

type AnyProps = Record<string, any>;

function pickFirst<T>(...candidates: any[]): T | null {
  for (const c of candidates) if (c !== undefined && c !== null) return c as T;
  return null;
}

function getId(w: any): string {
  return String(w?.id ?? w?.wordId ?? w?.wid ?? w?.word_id ?? "").trim();
}

function getText(w: any): string {
  return String(w?.text ?? w?.lemma ?? w?.target ?? w?.word ?? "").trim();
}

function safeList(v: any): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}

function asBool(v: any): boolean | null {
  if (v === true) return true;
  if (v === false) return false;

  if (v === "KNOW" || v === "known" || v === "YES" || v === "Y") return true;
  if (v === "DONT_KNOW" || v === "unknown" || v === "NO" || v === "N") return false;

  if (v === 1) return true;
  if (v === 0) return false;

  return null;
}

function gridClassForCount(count: number) {
  const dense = count >= 28;
  return {
    list: [
      "grid",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      dense ? "gap-x-5 gap-y-1" : "gap-x-6 gap-y-1.5",
    ].join(" "),
    item: [
      "break-inside-avoid",
      dense ? "text-[11px] sm:text-[12px]" : "text-[12px] sm:text-[13px]",
      dense ? "leading-[1.25]" : "leading-[1.35]",
      "font-bold",
      "text-slate-800",
      "truncate",
    ].join(" "),
  };
}

export default function SummaryScreen(props: AnyProps) {
  const onNext =
    typeof props?.onNext === "function"
      ? props.onNext
      : typeof props?.onContinue === "function"
        ? props.onContinue
        : typeof props?.onDone === "function"
          ? props.onDone
          : typeof props?.onFinish === "function"
            ? props.onFinish
            : null;

  const words = useMemo(() => {
    const list =
      pickFirst<any[]>(
        props.words,
        props.items,
        props.allWords,
        props.sessionWords,
        props.results?.words,
        props.result?.words
      ) ?? [];
    return safeList(list);
  }, [props.words, props.items, props.allWords, props.sessionWords, props.results, props.result]);

  const prescreenMap =
    pickFirst<Record<string, any>>(
      props.prescreenChoiceMap,
      props.prescreenMap,
      props.choiceMap,
      props.knowMap,
      props.knownMap,
      props.prescreenChoices,
      props.prescreen
    ) ?? null;

  const spellPassMap =
    pickFirst<Record<string, any>>(
      props.spellPassMap,
      props.spellingPassMap,
      props.spellMap,
      props.spellingMap,
      props.spellcheckMap,
      props.spellCheckMap
    ) ?? null;

  const { spellFailedList, knowCount, spellFailedCount } = useMemo(() => {
    const failed: any[] = [];
    let kCount = 0;

    for (const w of words) {
      const id = getId(w);
      if (!id) continue;

      const prescreenKnown = asBool(prescreenMap ? prescreenMap[id] : null);
      const spellPass = asBool(spellPassMap ? spellPassMap[id] : null);

      const isKnownFromSpeed = prescreenKnown === true;
      if (isKnownFromSpeed) kCount++;

      const isSpellFailed = isKnownFromSpeed && spellPass !== true;
      if (isSpellFailed) failed.push(w);
    }

    return {
      spellFailedList: failed,
      knowCount: kCount,
      spellFailedCount: failed.length,
    };
  }, [words, prescreenMap, spellPassMap]);

  const grid = gridClassForCount(spellFailedCount);

  const nextPayload = useMemo(
    () => ({
      spellFailedList,
      spellFailedCount,
      knowCount,
      xknowList: spellFailedList,
    }),
    [spellFailedList, spellFailedCount, knowCount]
  );

  function fireNext() {
    if (!onNext) return;
    try {
      (onNext as any)(nextPayload);
      return;
    } catch {}
    try {
      (onNext as any)();
    } catch {}
  }

  const hint = `Speed KNOW: ${knowCount} • Spell failed: ${spellFailedCount}`;

  return (
    <div className="h-full w-full">
      <StageScaffold
        stageKey="summary"
        stageLabel="Summary"
        title="Summary"
        subtitle="These words will be studied in the Learning stage."
        hint={hint}
        primary={onNext ? { label: "Continue", onClick: fireNext } : undefined}
        align="left"
        maxWidthClassName="max-w-[980px]"
      >
        {spellFailedCount === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white/70 px-5 py-5 text-neutral-700 font-semibold">
            No spelling failures ✅
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-extrabold text-neutral-900">
                Spell Check Failed <span className="ml-2 text-neutral-500 font-bold">({spellFailedCount})</span>
              </div>
              <div className="text-neutral-500 text-sm font-semibold">Listed below</div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-4">
              <ul className={grid.list}>
                {spellFailedList.map((w, i) => (
                  <li
                    key={`${getId(w) || getText(w) || "f"}-${i}`}
                    className={grid.item}
                    title={getText(w) || ""}
                  >
                    {getText(w) || "—"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </StageScaffold>
    </div>
  );
}
