"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SpeakingTest2026, SpeakingTask2026 } from "@/models/speaking-2026";

type Phase = "input" | "generating" | "edit" | "saving" | "locked";

const TASK_LABEL: Record<string, string> = {
  repeat: "Repeat (따라 말하기)",
  independent: "Independent (의견 말하기)",
  integrated: "Integrated (읽기+듣기+말하기)",
};

export default function SpeakingTestGeneratorClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<SpeakingTest2026 | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null);
    setPhase("generating");
    try {
      const res = await fetch("/api/admin/updated-speaking/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Generation failed");
      setTest(data.payload as SpeakingTest2026);
      setPhase("edit");
    } catch (e: any) {
      setError(e.message);
      setPhase("input");
    }
  }, [topic]);

  const updateTask = (idx: number, updater: (t: any) => any) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.tasks[idx] = updater(next.tasks[idx]);
      return next;
    });

  const handleSave = useCallback(async () => {
    if (!test) return;
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch("/api/admin/updated-speaking/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      setSavedId(test.id);
      setPhase("edit");
    } catch (e: any) {
      setError(e.message);
      setPhase("edit");
    }
  }, [test]);

  const handleLock = useCallback(async () => {
    const id = savedId ?? test?.id;
    if (!id) { setError("먼저 저장하세요."); return; }
    if (!confirm("Lock하면 이후 수정이 불가합니다. 진행할까요?")) return;
    setError(null);
    setPhase("saving");
    try {
      await fetch("/api/admin/updated-speaking/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const res = await fetch("/api/admin/updated-speaking/lock", {
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
          <button onClick={() => router.push("/admin/content/updated-speaking")} className="rounded-lg border px-4 py-2 text-xs hover:bg-gray-50">목록으로</button>
          <button onClick={() => { setPhase("input"); setTopic(""); setTest(null); setSavedId(null); }} className="rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-xs text-white hover:bg-orange-600">새 시험 만들기</button>
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
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
            placeholder="예: Campus facilities / Environmental science / Social media"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={phase === "generating"}
          />
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || phase === "generating"}
            className="rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {phase === "generating" ? "생성 중…" : test ? "재생성" : "AI 생성"}
          </button>
        </div>
        {phase === "generating" && <p className="text-xs text-gray-500 animate-pulse">Claude가 Speaking 태스크를 생성 중입니다 (약 15-30초)…</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </section>

      {test && phase !== "generating" && (
        <>
          {/* Label */}
          <section className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-gray-700">시험 제목</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={test.label}
              onChange={(e) => setTest((prev) => prev ? { ...prev, label: e.target.value } : prev)}
            />
          </section>

          {/* Tasks */}
          {test.tasks.map((task, idx) => (
            <section key={task.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700">
                  Task {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{TASK_LABEL[task.type] ?? task.type}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="text-gray-500">준비 시간 (초)</span>
                  <input type="number" className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={task.preparationSeconds ?? 15}
                    onChange={(e) => updateTask(idx, (t) => ({ ...t, preparationSeconds: Number(e.target.value) }))} />
                </label>
                <label className="block text-xs">
                  <span className="text-gray-500">말하기 시간 (초)</span>
                  <input type="number" className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={task.speakingSeconds ?? 45}
                    onChange={(e) => updateTask(idx, (t) => ({ ...t, speakingSeconds: Number(e.target.value) }))} />
                </label>
              </div>

              {task.type === "repeat" && (
                <label className="block text-xs">
                  <span className="text-gray-500">따라 말할 문장</span>
                  <textarea rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={(task as any).prompt}
                    onChange={(e) => updateTask(idx, (t) => ({ ...t, prompt: e.target.value }))} />
                </label>
              )}

              {task.type === "independent" && (
                <label className="block text-xs">
                  <span className="text-gray-500">질문</span>
                  <textarea rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={(task as any).question}
                    onChange={(e) => updateTask(idx, (t) => ({ ...t, question: e.target.value }))} />
                </label>
              )}

              {task.type === "integrated" && (
                <div className="space-y-3">
                  <label className="block text-xs">
                    <span className="text-gray-500">Reading 지문</span>
                    <textarea rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400"
                      value={(task as any).readingText}
                      onChange={(e) => updateTask(idx, (t) => ({ ...t, readingText: e.target.value }))} />
                  </label>
                  <label className="block text-xs">
                    <span className="text-gray-500">Listening 스크립트</span>
                    <textarea rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400"
                      value={(task as any).listeningText}
                      onChange={(e) => updateTask(idx, (t) => ({ ...t, listeningText: e.target.value }))} />
                  </label>
                  <label className="block text-xs">
                    <span className="text-gray-500">질문</span>
                    <textarea rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      value={(task as any).question}
                      onChange={(e) => updateTask(idx, (t) => ({ ...t, question: e.target.value }))} />
                  </label>
                </div>
              )}
            </section>
          ))}

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
