// apps/web/components/vocab/summary/SummaryScreen.tsx
"use client";

import type { PrescreenResult } from "@/models/vocab/session/prescreen";
import type { SpellingResult } from "@/models/vocab/session/spelling";

type Props = {
  prescreenResult?: PrescreenResult | null;
  spellingResult?: SpellingResult | null;
  onDone: () => void;

  // optional extras (don’t break callers)
  title?: string;
};

export default function SummaryScreen({
  prescreenResult,
  spellingResult,
  onDone,
  title,
}: Props) {
  const dontKnowMeaningCount =
    prescreenResult?.unknownWordIds?.length ?? 0;

  const dontKnowSpellingCount =
    spellingResult?.spellingFailedIds?.length ?? 0;

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border p-6">
      <div className="space-y-1">
        <div className="text-lg font-semibold">
          {title ?? "Summary"}
        </div>
        <div className="text-sm text-slate-500">
          Results for today’s session
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Meaning</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {dontKnowMeaningCount}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Unknown words (meaning)
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Spelling</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {dontKnowSpellingCount}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Missed spelling checks
          </div>
        </div>
      </div>

      <button
        className="w-full rounded-xl bg-black py-3 text-white"
        onClick={onDone}
      >
        Continue
      </button>
    </div>
  );
}
