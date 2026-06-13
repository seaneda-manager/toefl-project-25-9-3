"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { WWritingTest2026, WFillBlankItem, WEmailWritingItem, WAcademicWritingItem } from "@/models/writing";

type Phase = "input" | "generating" | "edit" | "saving" | "locked";

const TASK_LABEL: Record<string, string> = {
  fill_in_blank: "빈칸 채우기",
  email: "Email Writing",
  academic_discussion: "Academic Discussion",
};

export default function WritingTestGeneratorClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<WWritingTest2026 | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null);
    setPhase("generating");
    try {
      const res = await fetch("/api/admin/updated-writing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Generation failed");
      setTest(data.payload as WWritingTest2026);
      setPhase("edit");
    } catch (e: any) {
      setError(e.message);
      setPhase("input");
    }
  }, [topic]);

  const setLabel = (label: string) =>
    setTest((prev) => prev ? { ...prev, meta: { ...prev.meta, label } } : prev);

  const updateItem = (idx: number, updater: (item: any) => any) =>
    setTest((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.items[idx] = updater(next.items[idx]);
      return next;
    });

  const handleSave = useCallback(async () => {
    if (!test) return;
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch("/api/admin/updated-writing/save", {
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
      await fetch("/api/admin/updated-writing/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const res = await fetch("/api/admin/updated-writing/lock", {
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
          <button onClick={() => router.push("/admin/content/updated-writing")} className="rounded-lg border px-4 py-2 text-xs hover:bg-gray-50">목록으로</button>
          <button onClick={() => { setPhase("input"); setTopic(""); setTest(null); setSavedId(null); }} className="rounded-lg border border-teal-500 bg-teal-600 px-4 py-2 text-xs text-white hover:bg-teal-700">새 시험 만들기</button>
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
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50"
            placeholder="예: Campus housing / Environmental policy / Technology and education"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={phase === "generating"}
          />
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || phase === "generating"}
            className="rounded-lg border border-teal-500 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {phase === "generating" ? "생성 중…" : test ? "재생성" : "AI 생성"}
          </button>
        </div>
        {phase === "generating" && <p className="text-xs text-gray-500 animate-pulse">Claude가 3가지 Writing 태스크를 생성 중입니다 (약 20-40초)…</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </section>

      {test && phase !== "generating" && (
        <>
          {/* Label */}
          <section className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-gray-700">시험 제목</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={test.meta.label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </section>

          {/* Tasks */}
          {test.items.map((item, idx) => (
            <section key={item.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-semibold text-teal-700">
                  Task {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{TASK_LABEL[item.taskKind] ?? item.taskKind}</span>
              </div>

              {item.taskKind === "fill_in_blank" && (
                <FillBlankEditor item={item as WFillBlankItem} onChange={(updated) => updateItem(idx, () => updated)} />
              )}
              {item.taskKind === "email" && (
                <EmailEditor item={item as WEmailWritingItem} onChange={(updated) => updateItem(idx, () => updated)} />
              )}
              {item.taskKind === "academic_discussion" && (
                <AcademicEditor item={item as WAcademicWritingItem} onChange={(updated) => updateItem(idx, () => updated)} />
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

// ── Sub-editors ────────────────────────────────────────────────────

function FillBlankEditor({ item, onChange }: { item: WFillBlankItem; onChange: (updated: WFillBlankItem) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">제목</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">본문 HTML ({"{{BLANK_1}}"} 형식으로 빈칸 표시)</label>
        <textarea rows={6} className="w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.promptHtml} onChange={(e) => onChange({ ...item, promptHtml: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-gray-500">빈칸 정답 예시</label>
        {item.blanks.map((blank, bi) => (
          <div key={blank.id} className="flex gap-2 items-start">
            <span className="mt-2 w-20 shrink-0 text-[11px] font-mono text-gray-400">{blank.id}</span>
            <input className="flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
              placeholder="예시 답안"
              value={blank.sampleAnswer}
              onChange={(e) => {
                const blanks = item.blanks.map((b, i) => i === bi ? { ...b, sampleAnswer: e.target.value } : b);
                onChange({ ...item, blanks });
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailEditor({ item, onChange }: { item: WEmailWritingItem; onChange: (updated: WEmailWritingItem) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">상황 설명</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.situation} onChange={(e) => onChange({ ...item, situation: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">지시문 (무엇을 써야 하는지)</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.prompt} onChange={(e) => onChange({ ...item, prompt: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">힌트 (한 줄씩, 줄바꿈으로 구분)</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={(item.hints ?? []).join("\n")}
          onChange={(e) => onChange({ ...item, hints: e.target.value.split("\n").filter(Boolean) })} />
      </div>
    </div>
  );
}

function AcademicEditor({ item, onChange }: { item: WAcademicWritingItem; onChange: (updated: WAcademicWritingItem) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">수업 배경 설명</label>
        <textarea rows={2} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.context} onChange={(e) => onChange({ ...item, context: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">교수 질문</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          value={item.professorPrompt} onChange={(e) => onChange({ ...item, professorPrompt: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-gray-500">학생 게시글</label>
        {(item.studentPosts ?? []).map((post, pi) => (
          <div key={post.id} className="rounded-lg border bg-gray-50 p-3 space-y-2">
            <input className="w-full rounded border px-2 py-1 text-xs font-semibold focus:outline-none"
              value={post.author}
              onChange={(e) => {
                const posts = item.studentPosts!.map((p, i) => i === pi ? { ...p, author: e.target.value } : p);
                onChange({ ...item, studentPosts: posts });
              }} />
            <textarea rows={3} className="w-full rounded border px-2 py-1 text-xs focus:outline-none"
              value={post.content}
              onChange={(e) => {
                const posts = item.studentPosts!.map((p, i) => i === pi ? { ...p, content: e.target.value } : p);
                onChange({ ...item, studentPosts: posts });
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}
