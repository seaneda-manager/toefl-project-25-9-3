"use client";

import { useState } from "react";
import type { ExplanationSegment, ExplanationSegmentType } from "@/models/grammar/types";

type Props = {
  unitId: string;
  segments: ExplanationSegment[];
  onChange: (segments: ExplanationSegment[]) => void;
};

const TYPE_LABELS: Record<ExplanationSegmentType, string> = {
  text: "텍스트",
  animation: "애니메이션",
  blank: "빈칸 채우기",
};

const TYPE_COLORS: Record<ExplanationSegmentType, string> = {
  text:      "bg-gray-100 text-gray-600",
  animation: "bg-blue-100 text-blue-700",
  blank:     "bg-amber-100 text-amber-700",
};

export default function SegmentsEditor({ unitId, segments, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<ExplanationSegmentType>("text");
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (next: ExplanationSegment[]) => onChange(next);

  const handleAdd = () => {
    const id = `seg-${Date.now()}`;
    const base = { id, unit_id: unitId, order_index: segments.length + 1 };
    let content: any;
    if (newType === "text")      content = { text: "" };
    else if (newType === "animation") content = { key: "", duration_ms: 2000 };
    else                         content = { prompt: "", answer: "", hint_ko: "" };
    update([...segments, { ...base, type: newType, content }]);
    setAdding(false);
    setEditingId(id);
  };

  const handleUpdateContent = (id: string, content: any) =>
    update(segments.map((s) => s.id === id ? { ...s, content } : s));

  const handleDelete = (id: string) =>
    update(segments.filter((s) => s.id !== id));

  const handleMoveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...segments];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    update(arr.map((s, idx) => ({ ...s, order_index: idx + 1 })));
  };

  const handleMoveDown = (i: number) => {
    if (i >= segments.length - 1) return;
    const arr = [...segments];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    update(arr.map((s, idx) => ({ ...s, order_index: idx + 1 })));
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-400">
        세그먼트가 순서대로 재생됩니다. <span className="text-amber-600">blank</span> 타입은 학생 입력 시 자동 일시정지.
      </p>

      {segments.map((seg, i) => (
        <div key={seg.id} className="border rounded-xl bg-white overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b">
            <span className="text-[11px] text-gray-300 font-mono w-4">{i + 1}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[seg.type]}`}>
              {TYPE_LABELS[seg.type]}
            </span>
            <div className="ml-auto flex items-center gap-0.5">
              <button onClick={() => handleMoveUp(i)} disabled={i === 0}
                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs">↑</button>
              <button onClick={() => handleMoveDown(i)} disabled={i >= segments.length - 1}
                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs">↓</button>
              <button onClick={() => setEditingId(editingId === seg.id ? null : seg.id)}
                className="px-2 py-1 text-[11px] text-indigo-500 hover:text-indigo-700">
                {editingId === seg.id ? "접기" : "편집"}
              </button>
              <button onClick={() => handleDelete(seg.id)}
                className="px-2 py-1 text-[11px] text-red-400 hover:text-red-600">삭제</button>
            </div>
          </div>

          {/* 미리보기 (편집 닫힌 상태) */}
          {editingId !== seg.id && (
            <p className="px-3 py-2 text-xs text-gray-500 truncate">
              {seg.type === "text"      && (seg.content as any).text || <span className="text-gray-300 italic">내용 없음</span>}
              {seg.type === "animation" && `[애니: ${(seg.content as any).key || "키 없음"}]`}
              {seg.type === "blank"     && ((seg.content as any).prompt || <span className="text-gray-300 italic">문장 없음</span>)}
            </p>
          )}

          {/* 편집 폼 */}
          {editingId === seg.id && (
            <div className="px-3 py-3 space-y-2.5">
              {seg.type === "text" && (
                <textarea
                  value={(seg.content as any).text}
                  onChange={(e) => handleUpdateContent(seg.id, { text: e.target.value })}
                  rows={3}
                  placeholder="설명 텍스트..."
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                  autoFocus
                />
              )}

              {seg.type === "animation" && (
                <div className="grid grid-cols-2 gap-2">
                  <InlineInput label="애니메이션 키"
                    value={(seg.content as any).key}
                    onChange={(v) => handleUpdateContent(seg.id, { ...(seg.content as any), key: v })}
                    placeholder="noun-pronoun-arrow"
                  />
                  <InlineInput label="재생 시간 (ms)"
                    value={String((seg.content as any).duration_ms)}
                    onChange={(v) => handleUpdateContent(seg.id, { ...(seg.content as any), duration_ms: Number(v) })}
                    placeholder="2000"
                  />
                </div>
              )}

              {seg.type === "blank" && (
                <div className="space-y-2">
                  <InlineInput
                    label='문장 (빈칸 = ___)'
                    value={(seg.content as any).prompt}
                    onChange={(v) => handleUpdateContent(seg.id, { ...(seg.content as any), prompt: v })}
                    placeholder="명사가 단수이면 대명사도 ___이어야 한다."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <InlineInput label="정답"
                      value={(seg.content as any).answer}
                      onChange={(v) => handleUpdateContent(seg.id, { ...(seg.content as any), answer: v })}
                      placeholder="단수"
                    />
                    <InlineInput label="힌트 (선택)"
                      value={(seg.content as any).hint_ko ?? ""}
                      onChange={(v) => handleUpdateContent(seg.id, { ...(seg.content as any), hint_ko: v })}
                      placeholder="단수 / 복수"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* 추가 */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 text-xs text-gray-400 rounded-xl hover:border-indigo-300 hover:text-indigo-500 transition"
        >
          + 세그먼트 추가
        </button>
      ) : (
        <div className="border rounded-xl p-3 bg-indigo-50 space-y-2.5">
          <p className="text-xs font-medium text-indigo-700">추가할 유형</p>
          <div className="flex gap-2">
            {(["text", "animation", "blank"] as ExplanationSegmentType[]).map((t) => (
              <button key={t} onClick={() => setNewType(t)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition
                  ${newType === t
                    ? "border-indigo-400 bg-white font-medium text-indigo-700"
                    : "border-indigo-200 text-gray-500 hover:bg-white"}`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
              추가
            </button>
            <button onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-500">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
    </div>
  );
}
