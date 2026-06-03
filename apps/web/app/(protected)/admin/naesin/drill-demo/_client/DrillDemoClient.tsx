// app/(protected)/admin/naesin/drill-demo/_client/DrillDemoClient.tsx
"use client";

import { useState } from "react";
import NaesinDrillShell from "@/components/naesin/drill/NaesinDrillShell";
import type { NaesinPassage } from "@/components/naesin/drill/types";
import { payloadToNaesinPassage } from "@/lib/naesin/passageDocToNaesinPassage";

type PassageMeta = {
  id: string;
  title: string;
  status: string;
  school_level: string | null;
  sentence_count: number;
  payload: unknown;
};

export default function DrillDemoClient({ passages }: { passages: PassageMeta[] }) {
  const [selectedId, setSelectedId] = useState<string>(passages[0]?.id ?? "");
  const [activePassage, setActivePassage] = useState<NaesinPassage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function loadPassage(id: string) {
    setDone(false);
    setError(null);
    const meta = passages.find((p) => p.id === id);
    if (!meta) { setError("지문을 찾을 수 없습니다."); return; }

    const passage = payloadToNaesinPassage(meta.payload);
    if (!passage) {
      setError("이 지문은 아직 문단/문장 분리가 완료되지 않았습니다. 에디터에서 분리 후 저장하세요.");
      setActivePassage(null);
      return;
    }
    if (!passage.paragraphs.length || !passage.paragraphs[0].sentences.length) {
      setError("문장 데이터가 없습니다.");
      setActivePassage(null);
      return;
    }
    setActivePassage(passage);
  }

  const stageReadiness = activePassage
    ? {
        "구조 분석": activePassage.paragraphs.some((p) =>
          p.sentences.some((s) => s.structureAnswer),
        ),
        "해석": activePassage.paragraphs.some((p) =>
          p.sentences.some((s) => s.translationAnswer),
        ),
        "작문": activePassage.paragraphs.some((p) =>
          p.sentences.some((s) => s.compositionAnswer),
        ),
        "문장 기능": activePassage.paragraphs.some((p) =>
          p.sentences.some((s) => s.sentenceFunctionAnswer),
        ),
        "문장 순서": (activePassage.sentenceOrderItems?.length ?? 0) > 0,
      }
    : null;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-5xl">🎉</div>
        <div className="text-xl font-bold">드릴 완료!</div>
        <button
          onClick={() => { setDone(false); setActivePassage(null); }}
          className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white"
        >
          다른 지문 선택
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 지문 선택 */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-base font-extrabold text-slate-900 mb-3">지문 선택</div>
        {passages.length === 0 ? (
          <div className="text-sm text-slate-500">
            저장된 지문이 없습니다.{" "}
            <a href="/admin/naesin/passages/new" className="text-emerald-700 underline">
              새 지문 만들기
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-56">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setActivePassage(null); setError(null); }}
              >
                {passages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}{p.school_level ? ` · ${p.school_level}` : ""} · {p.sentence_count}문장 · {p.status}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => loadPassage(selectedId)}
              disabled={!selectedId}
              className="h-10 px-5 rounded-2xl bg-slate-900 text-white font-extrabold text-sm disabled:opacity-40"
            >
              드릴 시작
            </button>
            <a
              href={`/admin/naesin/passages/${selectedId}/edit`}
              className="h-10 px-5 rounded-2xl border font-extrabold text-sm flex items-center text-slate-700"
            >
              에디터 열기
            </a>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {/* 단계별 준비 상태 */}
        {activePassage && stageReadiness && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(stageReadiness).map(([label, ready]) => (
              <span
                key={label}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  ready
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {ready ? "✅" : "⬜"} {label}
              </span>
            ))}
            <span className="rounded-full px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700">
              ✅ 단어 분석 (항상)
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700">
              ✅ 낭독
            </span>
          </div>
        )}
      </div>

      {/* 드릴 */}
      {activePassage && (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
            <div className="font-extrabold text-slate-900">{activePassage.title}</div>
            {activePassage.sourceLabel && (
              <div className="text-xs text-slate-500">{activePassage.sourceLabel}</div>
            )}
          </div>
          <div className="p-2">
            <NaesinDrillShell
              initialPassage={activePassage}
              onComplete={() => setDone(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
