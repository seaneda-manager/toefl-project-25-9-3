import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  createNaesinScopeItemAction,
  deleteNaesinScopeAction,
  deleteNaesinScopeItemAction,
  duplicateNaesinScopeAction,
  moveNaesinScopeItemAction,
  toggleNaesinScopeActiveAction,
  toggleNaesinScopeItemActiveAction,
  updateNaesinScopeItemAction,
} from "../actions";

type PageProps = {
  params: Promise<{ scopeId: string }>;
  searchParams: Promise<{
    q?: string;
    item_type?: string;
    item_active?: string;
  }>;
};

type NaesinScopeRow = {
  id: string;
  title: string;
  school_name: string;
  school_level: string;
  academic_year: number;
  grade: string;
  semester: string;
  exam_type: string;
  memo: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

type ScopeItemRow = {
  id: string;
  scope_id: string;
  item_type: string;
  title: string;
  body: string | null;
  sort_order: number;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReadingTestDbRow = {
  id: string;
  label: string;
  exam_era: string | null;
  updated_at: string | null;
  payload: unknown | null;
};

const ITEM_TYPE_OPTIONS = [
  { value: "passage", label: "지문" },
  { value: "grammar", label: "문법" },
  { value: "note", label: "메모" },
  { value: "question_seed", label: "문제 씨앗" },
  { value: "review_seed", label: "직전정리 씨앗" },
] as const;

const CONTENT_REF_PREFIX = "[[CONTENT_REF:";
const CONTENT_LABEL_PREFIX = "[[CONTENT_LABEL:";

function getItemTypeLabel(itemType: string) {
  return ITEM_TYPE_OPTIONS.find((x) => x.value === itemType)?.label ?? itemType;
}

function getExamTypeLabel(examType: string) {
  const map: Record<string, string> = {
    midterm: "중간",
    final: "기말",
    monthly_exam: "월말/학평형",
    practice: "연습/기타",
  };
  return map[examType] ?? examType;
}

function getSchoolLevelLabel(level: string) {
  const map: Record<string, string> = {
    middle: "중등",
    high: "고등",
  };
  return map[level] ?? level;
}

function buildScopeDetailHref(
  scopeId: string,
  next: {
    q?: string;
    item_type?: string;
    item_active?: string;
  },
) {
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.item_type) params.set("item_type", next.item_type);
  if (next.item_active) params.set("item_active", next.item_active);

  const query = params.toString();
  return query ? `/admin/naesin/scopes/${scopeId}?${query}` : `/admin/naesin/scopes/${scopeId}`;
}

function formatUpdatedAt(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "기간 미설정";
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  return startDate ?? endDate ?? "기간 미설정";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function countQuestionsDeep(node: unknown): number {
  if (!node) return 0;

  if (Array.isArray(node)) {
    return node.reduce((sum, item) => sum + countQuestionsDeep(item), 0);
  }

  const obj = asRecord(node);
  if (!obj) return 0;

  if (Array.isArray(obj.questions)) {
    return obj.questions.length;
  }

  const keysToScan = ["passages", "sections", "modules", "testlets", "sets", "parts", "items"] as const;

  return keysToScan.reduce((sum, key) => sum + countQuestionsDeep(obj[key]), 0);
}

function extractQuestionCount(payload: unknown): number {
  const count = countQuestionsDeep(payload);
  return count > 0 ? count : 0;
}

function buildReadingRefBody(row: ReadingTestDbRow) {
  const qCount = extractQuestionCount(row.payload);
  const updated = formatUpdatedAt(row.updated_at);
  const examEra = row.exam_era ?? "ibt_2026";

  return [
    `[[CONTENT_REF:reading_tests_2026:${row.id}]]`,
    `[[CONTENT_LABEL:${row.label}]]`,
    "",
    "Reading 2026 콘텐츠 연결",
    `원본 ID: ${row.id}`,
    `시험 버전: ${examEra}`,
    `문항 수: ${qCount}`,
    `최근 수정: ${updated}`,
  ].join("\n");
}

function parseContentRef(body: string | null) {
  if (!body) return null;

  const refMatch = body.match(/\[\[CONTENT_REF:([^:]+):([^\]]+)\]\]/);
  if (!refMatch) return null;

  const labelMatch = body.match(/\[\[CONTENT_LABEL:([^\]]+)\]\]/);

  return {
    table: refMatch[1],
    id: refMatch[2],
    label: labelMatch?.[1] ?? null,
  };
}

function stripContentRefMeta(body: string | null) {
  if (!body) return "";

  return body
    .replace(/\[\[CONTENT_REF:[^\]]+\]\]\n?/g, "")
    .replace(/\[\[CONTENT_LABEL:[^\]]+\]\]\n?/g, "")
    .trim();
}

export const dynamic = "force-dynamic";

export default async function AdminNaesinScopeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { scopeId } = await params;
  const sp = await searchParams;
  const supabase = await getServerSupabase();

  const { data: scope, error: scopeError } = await supabase
    .from("naesin_exam_scopes")
    .select(
      "id, title, school_name, school_level, academic_year, grade, semester, exam_type, memo, start_date, end_date, is_active, updated_at",
    )
    .eq("id", scopeId)
    .maybeSingle();

  if (scopeError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          시험 범위를 불러오지 못했습니다.
          <div className="mt-2 text-xs">{scopeError.message}</div>
        </div>
      </main>
    );
  }

  if (!scope) notFound();

  const scopeRow = scope as NaesinScopeRow;

  const { data: allItems, error: allItemsError } = await supabase
    .from("naesin_exam_scope_items")
    .select(
      "id, scope_id, item_type, title, body, sort_order, is_active, created_at, updated_at",
    )
    .eq("scope_id", scopeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (allItemsError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          범위 아이템을 불러오지 못했습니다.
          <div className="mt-2 text-xs">{allItemsError.message}</div>
        </div>
      </main>
    );
  }

  const { data: recentReadingTests, error: readingError } = await supabase
    .from("reading_tests_2026")
    .select("id,label,exam_era,updated_at,payload")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(8);

  const allItemRows = (allItems ?? []) as ScopeItemRow[];
  const readingRows = ((recentReadingTests ?? []) as ReadingTestDbRow[]) ?? [];

  let filteredItemRows = [...allItemRows];

  if (sp.item_type) {
    filteredItemRows = filteredItemRows.filter((item) => item.item_type === sp.item_type);
  }

  if (sp.item_active === "true") {
    filteredItemRows = filteredItemRows.filter((item) => item.is_active === true);
  }

  if (sp.item_active === "false") {
    filteredItemRows = filteredItemRows.filter((item) => item.is_active !== true);
  }

  if (sp.q) {
    const needle = sp.q.toLowerCase();
    filteredItemRows = filteredItemRows.filter((item) => {
      const title = item.title.toLowerCase();
      const body = (item.body ?? "").toLowerCase();
      return title.includes(needle) || body.includes(needle);
    });
  }

  const countByType = allItemRows.reduce<Record<string, number>>((acc, item) => {
    acc[item.item_type] = (acc[item.item_type] ?? 0) + 1;
    return acc;
  }, {});

  const linkedHubItems = allItemRows.filter((item) => parseContentRef(item.body));
  const quickTabs = [
    { value: "", label: "전체", count: allItemRows.length },
    ...ITEM_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      count: countByType[option.value] ?? 0,
    })),
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Admin / Naesin / Scope Detail
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-neutral-900">{scopeRow.title}</h1>
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs",
                scopeRow.is_active
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-neutral-300 bg-neutral-50 text-neutral-600",
              ].join(" ")}
            >
              {scopeRow.is_active ? "활성" : "비활성"}
            </span>
          </div>

          <p className="text-sm text-neutral-500">
            {scopeRow.school_name} · {getSchoolLevelLabel(scopeRow.school_level)} ·{" "}
            {scopeRow.academic_year} · {scopeRow.grade} · {scopeRow.semester} ·{" "}
            {getExamTypeLabel(scopeRow.exam_type)}
          </p>

          <p className="text-sm text-neutral-500">
            범위 기간: {formatDateRange(scopeRow.start_date, scopeRow.end_date)} · 최근 수정:{" "}
            {formatUpdatedAt(scopeRow.updated_at)}
          </p>

          {scopeRow.memo ? (
            <p className="max-w-3xl text-sm text-neutral-700">{scopeRow.memo}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/naesin/scopes"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            목록으로
          </Link>

          <Link
            href="/admin/content"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            콘텐츠 허브
          </Link>

          <Link
            href={`/admin/naesin/scopes/${scopeRow.id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            범위 수정
          </Link>

          <form action={duplicateNaesinScopeAction}>
            <input type="hidden" name="id" value={scopeRow.id} />
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              범위 복제
            </button>
          </form>

          <form action={toggleNaesinScopeActiveAction}>
            <input type="hidden" name="id" value={scopeRow.id} />
            <input
              type="hidden"
              name="is_active"
              value={String(!(scopeRow.is_active ?? true))}
            />
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {scopeRow.is_active ? "범위 비활성화" : "범위 활성화"}
            </button>
          </form>

          <form action={deleteNaesinScopeAction}>
            <input type="hidden" name="id" value={scopeRow.id} />
            <button
              type="submit"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              범위 삭제
            </button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-neutral-500">총 아이템</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">{allItemRows.length}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-neutral-500">지문</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">
            {countByType.passage ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-neutral-500">문법/메모</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">
            {(countByType.grammar ?? 0) + (countByType.note ?? 0)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-neutral-500">리뷰/문제 씨앗</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">
            {(countByType.question_seed ?? 0) + (countByType.review_seed ?? 0)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-neutral-500">허브 연결 아이템</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">{linkedHubItems.length}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-900">Scope Item 필터</div>
                <p className="mt-1 text-sm text-neutral-500">
                  유형 / 활성상태 / 제목·본문 검색으로 item을 빠르게 추립니다.
                </p>
              </div>

              <div className="text-sm text-neutral-500">
                현재 {filteredItemRows.length} / 전체 {allItemRows.length}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickTabs.map((tab) => {
                const active = (sp.item_type ?? "") === tab.value;
                const href = buildScopeDetailHref(scopeRow.id, {
                  q: sp.q,
                  item_active: sp.item_active,
                  item_type: tab.value || undefined,
                });

                return (
                  <Link
                    key={tab.value || "all"}
                    href={href}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
                    ].join(" ")}
                  >
                    {tab.label} {tab.count}
                  </Link>
                );
              })}
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-4">
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="제목 / 본문 검색"
                className="rounded-xl border px-3 py-2 text-sm outline-none"
              />

              <select
                name="item_type"
                defaultValue={sp.item_type ?? ""}
                className="rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="">전체 유형</option>
                {ITEM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                name="item_active"
                defaultValue={sp.item_active ?? ""}
                className="rounded-xl border px-3 py-2 text-sm outline-none"
              >
                <option value="">전체 활성상태</option>
                <option value="true">활성만</option>
                <option value="false">비활성만</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  적용
                </button>

                <Link
                  href={`/admin/naesin/scopes/${scopeRow.id}`}
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  초기화
                </Link>
              </div>
            </form>
          </section>

          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
              연결된 Scope Items
            </div>

            <div className="divide-y">
              {filteredItemRows.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === filteredItemRows.length - 1;
                const ref = parseContentRef(item.body);
                const cleanBody = stripContentRefMeta(item.body);

                return (
                  <div key={item.id} className="space-y-4 px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700">
                            {getItemTypeLabel(item.item_type)}
                          </span>
                          <span className="rounded-full border bg-neutral-50 px-2.5 py-1 text-xs text-neutral-500">
                            순서 {item.sort_order}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-xs",
                              item.is_active
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-neutral-300 bg-neutral-50 text-neutral-500",
                            ].join(" ")}
                          >
                            {item.is_active ? "활성" : "비활성"}
                          </span>

                          {ref ? (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                              허브 연결
                            </span>
                          ) : null}
                        </div>

                        <div className="text-base font-semibold text-neutral-900">{item.title}</div>

                        {ref ? (
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/content/${ref.id}`}
                              className="rounded-lg border px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                            >
                              콘텐츠 브리지 열기
                            </Link>
                            <Link
                              href={`/admin/content/reading-2026/${ref.id}`}
                              className="rounded-lg border px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                            >
                              원본 에디터 열기
                            </Link>
                          </div>
                        ) : null}

                        {cleanBody ? (
                          <div className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                            {cleanBody}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">본문 없음</div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <form action={moveNaesinScopeItemAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="scope_id" value={scopeRow.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={isFirst}
                            className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            위로
                          </button>
                        </form>

                        <form action={moveNaesinScopeItemAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="scope_id" value={scopeRow.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={isLast}
                            className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            아래로
                          </button>
                        </form>

                        <form action={toggleNaesinScopeItemActiveAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="scope_id" value={scopeRow.id} />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(!(item.is_active ?? true))}
                          />
                          <button
                            type="submit"
                            className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50"
                          >
                            {item.is_active ? "비활성화" : "활성화"}
                          </button>
                        </form>

                        <form action={deleteNaesinScopeItemAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="scope_id" value={scopeRow.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </form>
                      </div>
                    </div>

                    <details className="rounded-2xl border bg-neutral-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-800">
                        수정
                      </summary>

                      <form action={updateNaesinScopeItemAction} className="space-y-4 border-t p-4">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="scope_id" value={scopeRow.id} />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-800">
                              아이템 유형
                            </label>
                            <select
                              name="item_type"
                              defaultValue={item.item_type}
                              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                            >
                              {ITEM_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label} ({option.value})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-800">
                              정렬 순서
                            </label>
                            <input
                              name="sort_order"
                              type="number"
                              min={0}
                              defaultValue={item.sort_order}
                              className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-neutral-800">제목</label>
                          <input
                            name="title"
                            defaultValue={item.title}
                            className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-neutral-800">본문</label>
                          <textarea
                            name="body"
                            rows={8}
                            defaultValue={item.body ?? ""}
                            className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="rounded-xl border bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                          >
                            저장
                          </button>
                        </div>
                      </form>
                    </details>
                  </div>
                );
              })}

              {filteredItemRows.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  조건에 맞는 scope item이 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  콘텐츠 허브에서 가져오기
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  최근 Reading 2026 콘텐츠를 현재 시험 범위에 연결합니다.
                </p>
              </div>

              <Link
                href="/admin/content"
                className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50"
              >
                콘텐츠 허브 열기
              </Link>
            </div>

            {readingError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Reading 콘텐츠를 불러오지 못했습니다.
                <div className="mt-1 text-xs">{readingError.message}</div>
              </div>
            ) : readingRows.length === 0 ? (
              <div className="mt-4 rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-500">
                연결 가능한 Reading 콘텐츠가 없습니다.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {readingRows.map((row, idx) => {
                  const qCount = extractQuestionCount(row.payload);
                  const sortOrder = allItemRows.length * 10 + idx * 10;

                  return (
                    <div key={row.id} className="rounded-2xl border p-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-neutral-900">{row.label}</div>

                        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                          <span className="rounded-full border px-2.5 py-1">
                            {row.exam_era ?? "ibt_2026"}
                          </span>
                          <span className="rounded-full border px-2.5 py-1">
                            문항 {qCount}개
                          </span>
                          <span className="rounded-full border px-2.5 py-1">
                            {formatUpdatedAt(row.updated_at)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/content/reading-2026/${row.id}`}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50"
                          >
                            원본 보기
                          </Link>

                          <form action={createNaesinScopeItemAction}>
                            <input type="hidden" name="scope_id" value={scopeRow.id} />
                            <input type="hidden" name="is_active" value="true" />
                            <input type="hidden" name="item_type" value="passage" />
                            <input type="hidden" name="title" value={row.label} />
                            <input type="hidden" name="sort_order" value={String(sortOrder)} />
                            <input type="hidden" name="body" value={buildReadingRefBody(row)} />
                            <button
                              type="submit"
                              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                            >
                              이 범위에 연결
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold text-neutral-900">텍스트 Item 직접 추가</div>
            <p className="mt-1 text-sm text-neutral-500">
              원본 콘텐츠가 아직 없거나 메모/직전정리 포인트를 직접 넣고 싶을 때 사용합니다.
            </p>

            <form action={createNaesinScopeItemAction} className="mt-4 space-y-4">
              <input type="hidden" name="scope_id" value={scopeRow.id} />
              <input type="hidden" name="is_active" value="true" />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-800">아이템 유형</label>
                <select
                  name="item_type"
                  defaultValue="note"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                >
                  {ITEM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-800">제목</label>
                <input
                  name="title"
                  placeholder="예: 교과서 3과 핵심 지문 1"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-800">본문</label>
                <textarea
                  name="body"
                  rows={10}
                  placeholder="샘플 지문, 문법 메모, 직전 정리 포인트 등을 입력"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-800">정렬 순서</label>
                <input
                  name="sort_order"
                  type="number"
                  min={0}
                  defaultValue={allItemRows.length * 10 + 100}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl border bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Scope Item 추가
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
