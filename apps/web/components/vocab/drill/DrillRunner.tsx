// apps/web/components/vocab/drill/DrillRunner.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DrillTask } from "./drill.types";

import SentenceBlankDrill from "./SentenceBlankDrill";
import CollocationDrill from "./CollocationDrill";
import WordFormPickDrill from "./WordFormPickDrill";

type Props = {
  userId: string;
  tasks: DrillTask[];
  onFinish: () => void;
  mode?: "classic" | string;
};

// ✅ v1.0 (final): only these 4 blocks (runner view)
const DRILL_TYPE_ORDER = ["SYNONYM", "WORD_FORM", "FILL_IN_THE_BLANKS", "COLLOCATION"] as const;
type CanonDrillType = (typeof DRILL_TYPE_ORDER)[number];

function canonType(x: unknown) {
  const raw = String(x ?? "").trim().toUpperCase();
  if (!raw) return "";

  // ✅ SSOT alias normalize (do NOT mutate original task.drillType)
  if (raw === "WORD_FORM_PICK") return "WORD_FORM";
  if (raw === "SENTENCE_BLANK") return "FILL_IN_THE_BLANKS";

  // ✅ meaning-similar legacy name -> SYNONYM block
  if (raw === "MEANING_SIMILAR") return "SYNONYM";

  // If upstream sometimes already sends canonical runner types:
  if (raw === "WORD_FORM") return "WORD_FORM";
  if (raw === "FILL_IN_THE_BLANKS") return "FILL_IN_THE_BLANKS";
  if (raw === "SYNONYM") return "SYNONYM";
  if (raw === "COLLOCATION") return "COLLOCATION";

  // ❌ removed / not supported in runner
  if (raw === "MEANING_OPPOSITE") return "REMOVED:MEANING_OPPOSITE";
  if (raw === "LISTEN_ARRANGE") return "REMOVED:LISTEN_ARRANGE";
  if (raw === "SYLLABLE_ARRANGE") return "REMOVED:SYLLABLE_ARRANGE";
  if (raw === "LISTEN_ARRANGE_SENTENCE") return "REMOVED:LISTEN_ARRANGE_SENTENCE";

  return raw;
}

function isSupportedCanon(dt: string): dt is CanonDrillType {
  return (DRILL_TYPE_ORDER as readonly string[]).includes(dt);
}

function countsByType(tasks: DrillTask[]) {
  const m: Record<string, number> = {};
  for (const t of tasks) {
    const k = canonType((t as any)?.drillType) || "UNKNOWN";
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

/**
 * ✅ Hard guarantee: NEVER mix types on screen (block order enforced)
 * - Forces block order: SYNONYM -> WORD_FORM -> FILL_IN_THE_BLANKS -> COLLOCATION
 * - Keeps original relative order within each block
 * - Unknown/removed types appended at the end (visible for debugging upstream)
 *
 * ✅ IMPORTANT: we DO NOT mutate task.drillType.
 * Runner uses canonType(task.drillType) only for ordering & rendering.
 */
function enforceStrictTypeBlocks(tasks: DrillTask[]) {
  const buckets = new Map<CanonDrillType, DrillTask[]>();
  const unknown: DrillTask[] = [];

  for (const t of tasks ?? []) {
    const dt = canonType((t as any)?.drillType);
    if (!dt) {
      unknown.push(t);
      continue;
    }

    if (isSupportedCanon(dt)) {
      buckets.set(dt, [...(buckets.get(dt) ?? []), t]);
    } else {
      unknown.push(t);
    }
  }

  const out: DrillTask[] = [];
  for (const dt of DRILL_TYPE_ORDER) {
    const group = buckets.get(dt);
    if (group && group.length) out.push(...group);
  }
  if (unknown.length) out.push(...unknown);

  return out;
}

function stableTaskSig(t: DrillTask) {
  const id = String((t as any)?.id ?? "");
  const dt = canonType((t as any)?.drillType);
  const wordId = String((t as any)?.wordId ?? "");
  const variant = String((t as any)?.seed?.variant ?? "");
  const mode = String((t as any)?.seed?.mode ?? "");
  const metaKind = String((t as any)?.seed?.meta?.kind ?? "");
  const metaRel = String((t as any)?.seed?.meta?.relation ?? "");
  return `${id}|${dt}|${wordId}|${variant}|${mode}|${metaKind}|${metaRel}`;
}

// lightweight string hash (djb2)
function hashStr(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function makeTasksKey(tasks: DrillTask[]) {
  const joined = (tasks ?? []).map(stableTaskSig).join(";");
  return hashStr(joined);
}

/* ======================================================
 * Inline "SYNONYM block" Drill
 * - ✅ supports MeaningMcqSeed { prompt, stem, choices, answer, meta }
 * - ✅ supports legacy shapes too
 * - ✅ renders properly for:
 *   1) synonym MCQ (word -> synonym)
 *   2) meaning->word MCQ fallback (meta.kind === "MEANING_TO_WORD")
 * ====================================================== */

function pickString(...xs: any[]) {
  for (const x of xs) {
    const s = String(x ?? "").trim();
    if (s) return s;
  }
  return "";
}

function uniqStrings(arr: any[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr ?? []) {
    const s = String(x ?? "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function readMeaningMCQ(task: DrillTask) {
  const t: any = task as any;
  const seed: any = t?.seed ?? {};
  const meta: any = seed?.meta ?? {};

  const kind = pickString(meta?.kind, seed?.kind, "");
  const relation = pickString(meta?.relation, seed?.relation, "");

  const prompt = pickString(seed?.prompt, meta?.prompt, "");

  // MeaningMcqSeed: stem is displayed
  const stem = pickString(seed?.stem, seed?.target, seed?.question, meta?.stem, meta?.target, meta?.question, "");

  const rawChoices =
    seed?.choices ??
    seed?.options ??
    seed?.items ??
    meta?.choices ??
    meta?.options ??
    seed?.distractors ??
    meta?.distractors ??
    [];

  const choices = uniqStrings(Array.isArray(rawChoices) ? rawChoices : []);

  // answer can be text or index
  const correctText = pickString(seed?.answer, seed?.correct, meta?.answer, meta?.correct, seed?.key);
  const correctIndex =
    Number.isFinite(seed?.answerIndex) ? Number(seed?.answerIndex) :
    Number.isFinite(seed?.correctIndex) ? Number(seed?.correctIndex) :
    null;

  let answerIdx: number | null = null;

  if (choices.length) {
    if (correctIndex !== null && correctIndex >= 0 && correctIndex < choices.length) {
      answerIdx = correctIndex;
    } else if (correctText) {
      const i = choices.findIndex((c) => c.toLowerCase() === String(correctText).toLowerCase());
      if (i >= 0) answerIdx = i;
    }
  }

  return {
    kind,
    relation,
    prompt,
    stem,
    choices,
    answerIdx,
    meta,
    debug: { seed, meta, t },
  };
}

function InlineSynonymDrill({
  task,
  onDone,
}: {
  task: DrillTask;
  onDone: (isCorrect: boolean) => void;
}) {
  const { kind, relation, prompt, stem, choices, answerIdx, meta, debug } = useMemo(
    () => readMeaningMCQ(task),
    [task]
  );

  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPicked(null);
    setLocked(false);
  }, [task]);

  const canAnswer = !locked && choices.length >= 2 && answerIdx !== null;

  function choose(i: number) {
    if (!canAnswer) return;
    setPicked(i);
    setLocked(true);
    const ok = i === answerIdx!;
    window.setTimeout(() => onDone(ok), 450);
  }

  // title & instruction
  const isMeaningToWord = String(kind).toUpperCase() === "MEANING_TO_WORD";
  const isSyn = String(relation).toLowerCase() === "synonym";

  const title = isMeaningToWord ? "MEANING" : "SYNONYM";
  const instruction =
    prompt ||
    (isMeaningToWord
      ? "Choose the word that matches this meaning:"
      : isSyn
        ? "Choose the closest synonym for:"
        : "Choose the best answer:");

  const subHint =
    !isMeaningToWord && meta?.meaningKo
      ? `뜻: ${String(meta.meaningKo)}`
      : "";

  if (!stem || choices.length < 2 || answerIdx === null) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <div className="font-semibold">{title} task seed is not usable</div>
        <div className="mt-1 text-xs text-red-700">
          seed에 stem + choices(또는 options) + answer(또는 answerIndex)가 필요합니다.
        </div>

        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border bg-white p-2 text-[11px] text-slate-700">
          {JSON.stringify(debug?.seed ?? debug, null, 2)}
        </pre>

        <button
          className="mt-3 w-full rounded-xl bg-black py-2 text-white"
          onClick={() => onDone(false)}
        >
          Skip this task
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-xs font-semibold text-slate-500">{title}</div>

      <div className="mt-1 text-lg font-semibold text-slate-900">
        {instruction}{" "}
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono">{stem}</span>
      </div>

      {subHint ? <div className="mt-2 text-xs text-slate-500">{subHint}</div> : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.slice(0, 6).map((c, i) => {
          const isPicked = picked === i;
          const isAnswer = i === answerIdx;
          const show =
            locked
              ? isAnswer
                ? "border-emerald-300 bg-emerald-50"
                : isPicked
                  ? "border-rose-300 bg-rose-50"
                  : "border-slate-200"
              : "border-slate-200";

          return (
            <button
              key={`${c}-${i}`}
              onClick={() => choose(i)}
              disabled={!canAnswer}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                canAnswer ? "hover:bg-slate-50" : "opacity-80"
              } ${show}`}
            >
              <div className="font-semibold text-slate-900">{c}</div>
              {locked && isAnswer ? (
                <div className="mt-1 text-xs font-semibold text-emerald-700">Correct</div>
              ) : locked && isPicked && !isAnswer ? (
                <div className="mt-1 text-xs font-semibold text-rose-700">Incorrect</div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500">Tap one choice. Auto-advances.</div>
    </div>
  );
}

export default function DrillRunner({ userId: _userId, tasks, onFinish, mode = "classic" }: Props) {
  const [index, setIndex] = useState(0);
  const finishedRef = useRef(false);

  const normalizedTasks = useMemo(() => {
    // currently same for all modes; keeping hook for future
    return enforceStrictTypeBlocks(tasks ?? []);
  }, [tasks, mode]);

  const tasksKey = useMemo(() => makeTasksKey(normalizedTasks), [normalizedTasks]);

  // reset when content changes (not just reference)
  useEffect(() => {
    finishedRef.current = false;
    setIndex(0);
  }, [tasksKey]);

  const total = normalizedTasks.length;
  const current = useMemo(() => normalizedTasks[index] ?? null, [normalizedTasks, index]);

  // debug (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const first10 = normalizedTasks.slice(0, 10).map((t) => ({
      dt: canonType((t as any)?.drillType) || "UNKNOWN",
      raw: String((t as any)?.drillType ?? ""),
      id: String((t as any)?.id ?? ""),
      wordId: String((t as any)?.wordId ?? ""),
      variant: String((t as any)?.seed?.variant ?? ""),
      mode: String((t as any)?.seed?.mode ?? ""),
      metaKind: String((t as any)?.seed?.meta?.kind ?? ""),
      metaRel: String((t as any)?.seed?.meta?.relation ?? ""),
    }));

    console.log("[DrillRunner] tasks:", {
      total: normalizedTasks.length,
      counts: countsByType(normalizedTasks),
      first10,
      note: "strict type blocks enforced WITHOUT mutating drillType",
    });
  }, [normalizedTasks]);

  function finishOnce() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    window.setTimeout(() => onFinish(), 0);
  }

  function goNext() {
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= total) {
        finishOnce();
        return prev;
      }
      return next;
    });
  }

  function onDone(_isCorrect: boolean) {
    goNext();
  }

  if (!current) {
    // IMPORTANT: do not hard-block user
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-slate-700">
        <div className="font-semibold">No drill tasks.</div>
        <div className="mt-2 text-xs text-slate-500">
          (Upstream에서 tasks를 못 만들었어요. 보통 word_forms/collocations가 비었거나, drillTypes가 SYNONYM/BLANK 없이 구성된 경우가 많습니다.)
        </div>
        <button
          className="mt-4 w-full rounded-xl bg-black py-2 text-white"
          onClick={() => finishOnce()}
        >
          Finish
        </button>
      </div>
    );
  }

  const dt = canonType((current as any)?.drillType);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
        <div className="font-semibold text-slate-900">Drill</div>
        <div className="text-slate-600">
          {Math.min(index + 1, Math.max(1, total))} / {Math.max(1, total)}{" "}
          <span className="ml-2 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {dt || "UNKNOWN"}
          </span>
        </div>
      </div>

      {dt === "SYNONYM" ? (
        <InlineSynonymDrill task={current} onDone={onDone} />
      ) : dt === "WORD_FORM" ? (
        <WordFormPickDrill task={current} onDone={onDone} />
      ) : dt === "FILL_IN_THE_BLANKS" ? (
        <SentenceBlankDrill task={current} onDone={onDone} />
      ) : dt === "COLLOCATION" ? (
        <CollocationDrill task={current} onDone={onDone} />
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <div className="font-semibold">Unknown/removed drillType</div>
          <div className="mt-1">
            drillType(canon): <code className="font-mono">{dt || "(empty)"}</code>
          </div>
          <div className="mt-1 text-xs text-red-700">
            raw drillType: <code className="font-mono">{String((current as any)?.drillType ?? "")}</code>
          </div>

          <div className="mt-3 text-xs text-red-700">
            이 타입이 여기까지 내려오면 buildBlockDrillTasksV1에서 아직 구 타입/미지원 타입을 만들고 있는 상태임.
            runner는 숨기지 않고 노출해서 upstream을 강제로 고치게 함.
          </div>

          <pre className="mt-3 max-h-64 overflow-auto rounded-lg border bg-white p-2 text-[11px] text-slate-700">
            {JSON.stringify(current, null, 2)}
          </pre>

          <button className="mt-3 w-full rounded-xl bg-black py-2 text-white" onClick={() => goNext()}>
            Skip this task
          </button>
        </div>
      )}
    </div>
  );
}
