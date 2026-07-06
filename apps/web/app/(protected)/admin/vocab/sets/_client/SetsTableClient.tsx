// apps/web/app/(protected)/admin/vocab/sets/_client/SetsTableClient.tsx
"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";

type VocabSet = {
  id: string;
  title: string;
  description: string | null;
  grade_band: string | null;
  level: string | null;
  source_label: string | null;
  word_count: number | null;
  item_count: number | null;
  created_at: string | null;
  track_id: string | null;
};

type Props = {
  rows: VocabSet[];
};

export default function SetsTableClient({ rows }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === rows.length && rows.length > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const deployUrl = useMemo(() => {
    if (selectedIds.size === 0) return "";
    const setIds = Array.from(selectedIds).join(",");
    return `/admin/vocab/Tracks?sets=${setIds}`;
  }, [selectedIds]);

  return (
    <div className="space-y-4">
      {/* 벌크 작업 바 */}
      {selectedCount > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-violet-900">
              {selectedCount}개 선택됨
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-violet-600 hover:underline"
            >
              해제
            </button>
          </div>
          <Link
            href={deployUrl}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            {selectedCount}개 배포 →
          </Link>
        </div>
      )}

      {/* 목록 테이블 */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
          세트 목록 ({rows.length})
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-neutral-400">
            등록된 단어 책이 없습니다. CSV 업로드로 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium [&>th]:whitespace-nowrap">
                  <th className="w-10">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded cursor-pointer"
                    />
                  </th>
                  <th>제목</th>
                  <th>출처</th>
                  <th>학년대</th>
                  <th>레벨</th>
                  <th>단어 수</th>
                  <th>아이템 수</th>
                  <th>등록일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t [&>td]:px-4 [&>td]:py-3 ${
                      selectedIds.has(row.id)
                        ? "bg-violet-50 hover:bg-violet-100"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <td className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="h-4 w-4 rounded cursor-pointer"
                      />
                    </td>
                    <td>
                      <div className="font-medium text-neutral-900">{row.title}</div>
                      {row.description && (
                        <div className="mt-0.5 text-xs text-neutral-400 truncate max-w-xs">
                          {row.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {row.source_label ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          {row.source_label}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td>
                      {row.grade_band ? (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                          {row.grade_band}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="text-neutral-600">{row.level ?? "—"}</td>
                    <td>
                      <span className="font-semibold text-neutral-900">
                        {row.word_count?.toLocaleString() ?? "—"}
                      </span>
                    </td>
                    <td className="text-neutral-600">{row.item_count?.toLocaleString() ?? "—"}</td>
                    <td className="text-xs text-neutral-400">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/admin/vocab/Tracks?set=${row.id}${
                          row.track_id ? `&track_id=${row.track_id}` : ""
                        }`}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        배포
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
