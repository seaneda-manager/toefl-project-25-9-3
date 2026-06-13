"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { LListeningTest2026, LBaseItem } from "@/models/listening";

type Phase = "input" | "generating" | "edit" | "saving" | "locked";

const KIND_LABEL: Record<string, string> = {
  conversation: "Conversation",
  academic_talk: "Lecture",
  announcement: "Announcement",
};

export default function ListeningTestGeneratorClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<LListeningTest2026 | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null);
    setPhase("generating");
    try {
      const res = await fetch("/api/admin/listening-2026/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Generation failed");
      setTest(data.payload as LListeningTest2026);
      setPhase("edit");
    } catch (e: any) {
      setError(e.message);
      setPhase("input");
    }
  }, [topic]);

  const setLabel = (label: string) =>
    setTest((prev) => prev ? { ...prev, meta: { ...prev.meta, label } } : prev);

  const setTranscript = (stageIdx: 0 | 1, itemIdx: number, val: string) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const item = next.modules[stageIdx]?.items?.[itemIdx] as any;
      if (item) item.transcript = val;
      return next;
    });

  const setQStem = (stageIdx: 0 | 1, itemIdx: number, qi: number, val: string) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const q = (next.modules[stageIdx]?.items?.[itemIdx] as any)?.questions?.[qi];
      if (q) q.stem = val;
      return next;
    });

  const setChoiceText = (stageIdx: 0 | 1, itemIdx: number, qi: number, ci: number, val: string) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const c = (next.modules[stageIdx]?.items?.[itemIdx] as any)?.questions?.[qi]?.choices?.[ci];
      if (c) c.text = val;
      return next;
    });

  const setCorrect = (stageIdx: 0 | 1, itemIdx: number, qi: number, ci: number) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const qs = (next.modules[stageIdx]?.items?.[itemIdx] as any)?.questions?.[qi];
      if (qs) qs.choices.forEach((c: any, i: number) => {
        c.is_correct = i === ci;
        c.correct = i === ci;
        c.isCorrect = i === ci;
      });
      return next;
    });

  const handleSave = useCallback(async () => {
    if (!test) return;
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch("/api/admin/listening-2026/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      setSavedId(test.meta.id);
      setPhase("edit");
    } catch (e: any) {
      setError(e.message);
      setPhase("edit");
    }
  }, [test]);

  const handleLock = useCallback(async () => {
    const id = savedId ?? test?.meta.id;
    if (!id) { setError("먼저 저장하세요."); return; }
    if (!confirm("Lock하면 이후 수정이 불가합니다. 진행할까요?")) return;
    setError(null);
    setPhase("saving");
    try {
      await fetch("/api/admin/listening-2026/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const res = await fetch("/api/admin/listening-2026/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Lock failed");
      setPhase("locked");
    } catch (e: any) {
      setError(e.message);
      setPhase("edit");
    }
  }, [savedId, test]);

  if (phase === "locked") {
    return (
      <div className="space-y-4 text-center py-12">
        <div className="text-4xl">🔒</div>
        <p className="text-sm font-semibold text-gray-800">시험이 Lock되었습니다.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => router.push("/admin/content/listening-2026")} className="rounded-lg border px-4 py-2 text-xs hover:bg-gray-50">목록으로</button>
          <button onClick={() => { setPhase("input"); setTopic(""); setTest(null); setSavedId(null); }} className="rounded-lg border border-violet-500 bg-violet-600 px-4 py-2 text-xs text-white hover:bg-violet-700">새 시험 만들기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">토픽 입력</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50"
            placeholder="예: Campus life / Environmental science / Ancient civilizations"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={phase === "generating"}
          />
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || phase === "generating"}
            className="rounded-lg border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {phase === "generating" ? "생성 중…" : test ? "재생성" : "AI 생성"}
          </button>
        </div>
        {phase === "generating" && <p className="text-xs text-gray-500 animate-pulse">Claude가 대화/강의 스크립트와 문제를 생성 중입니다 (약 20-40초)…</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </section>

      {test && phase !== "generating" && (
        <>
          {/* Label */}
          <section className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-gray-700">시험 제목</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={test.meta.label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </section>

          {/* Stages */}
          {([0, 1] as const).map((si) => {
            const mod = test.modules[si];
            if (!mod) return null;
            return (
              <section key={si} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Stage {si + 1}
                  <span className="ml-2 text-[11px] font-normal text-gray-400">
                    {si === 0 ? "Routing Module" : "Final Module"}
                  </span>
                </h2>

                {mod.items.map((item: LBaseItem, ii) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${item.taskKind === "academic_talk" ? "bg-indigo-100 text-indigo-700" : "bg-violet-100 text-violet-700"}`}>
                        {KIND_LABEL[item.taskKind] ?? item.taskKind}
                      </span>
                      <span className="text-xs text-gray-500">{item.title}</span>
                    </div>

                    {/* Transcript */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">스크립트</label>
                      <textarea
                        rows={6}
                        className="w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
                        value={(item as any).transcript ?? ""}
                        onChange={(e) => setTranscript(si, ii, e.target.value)}
                      />
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                      {(item.questions ?? []).map((q, qi) => (
                        <div key={q.id} className="rounded-lg border border-white bg-white p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-gray-400">Q{q.number ?? qi + 1}</span>
                            <span className="rounded-full border px-2 py-0.5 text-[10px] text-gray-400">{(q as any).type ?? "—"}</span>
                          </div>
                          <textarea
                            rows={2}
                            className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                            value={q.stem ?? (q as any).prompt ?? ""}
                            onChange={(e) => setQStem(si, ii, qi, e.target.value)}
                          />
                          <div className="space-y-1">
                            {q.choices.map((c, ci) => {
                              const isCorrect = !!(c.correct || (c as any).is_correct || (c as any).isCorrect);
                              return (
                                <label key={c.id} className={`flex items-start gap-2 rounded border px-2 py-1 text-xs cursor-pointer transition ${isCorrect ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                                  <input type="radio" name={`${si}-${ii}-${qi}-correct`} checked={isCorrect} onChange={() => setCorrect(si, ii, qi, ci)} className="mt-0.5 shrink-0" />
                                  <input className="flex-1 bg-transparent focus:outline-none" value={c.text} onChange={(e) => setChoiceText(si, ii, qi, ci, e.target.value)} />
                                  {isCorrect && <span className="shrink-0 text-[10px] font-semibold text-violet-600">✓ 정답</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}

          {/* Actions */}
          <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-400">
              {savedId ? `저장됨 (ID: ${savedId.slice(0, 8)}…)` : "아직 저장되지 않았습니다."}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={phase === "saving"} className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                {phase === "saving" ? "저장 중…" : "임시 저장"}
              </button>
              <button onClick={handleLock} disabled={phase === "saving"} className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                🔒 Lock & 완료
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
