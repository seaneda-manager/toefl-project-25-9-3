// apps/web/app/(protected)/admin/naesin/scopes/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  deleteNaesinScopeAction,
  duplicateNaesinScopeAction,
  toggleNaesinScopeActiveAction,
} from "./actions";

type SearchParams = Promise<{
  q?: string;
  school_level?: string;
  grade?: string;
  semester?: string;
  exam_type?: string;
  active?: string;
}>;

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
  scope_id: string;
};

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

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "기간 미설정";
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  return startDate ?? endDate ?? "기간 미설정";
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

export const dynamic = "force-dynamic";

export default async function AdminNaesinScopesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await getServerSupabase();

  const q = sp.q?.trim() ?? "";

  let query = supabase
    .from("naesin_exam_scopes")
    .select(
      "id, title, school_name, school_level, academic_year, grade, semester, exam_type, memo, start_date, end_date, is_active, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (sp.school_level) query = query.eq("school_level", sp.school_level);
  if (sp.grade) query = query.eq("grade", sp.grade);
  if (sp.semester) query = query.eq("semester", sp.semester);
  if (sp.exam_type) query = query.eq("exam_type", sp.exam_type);
  if (sp.active === "true") query = query.eq("is_active", true);
  if (sp.active === "false") query = query.eq("is_active", false);
  if (q) {
    query = query.or(`title.ilike.%${q}%,school_name.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          시험 범위를 불러오지 못했습니다.
          <div className="mt-2 text-xs">{error.message}</div>
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as NaesinScopeRow[];
  const scopeIds = rows.map((row) => row.id);

  const { data: scopeItemRows, error: itemError } =
    scopeIds.length > 0
      ? await supabase
          .from("naesin_exam_scope_items")
          .select("scope_id")
          .in("scope_id", scopeIds)
      : { data: [], error: null };

  if (itemError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          범위 아이템 수를 불러오지 못했습니다.
          <div className="mt-2 text-xs">{itemError.message}</div>
        </div>
      </main>
    );
  }

  const itemRows = (scopeItemRows ?? []) as ScopeItemRow[];
  const itemCountByScope = new Map<string, number>();

  for (const row of itemRows) {
    itemCountByScope.set(row.scope_id, (itemCountByScope.get(row.scope_id) ?? 0) + 1);
  }

  const normalizedRows = rows.map((row) => ({
    ...row,
    isActive: row.is_active ?? true,
  }));

  const totalScopes = normalizedRows.length;
  const activeScopes = normalizedRows.filter((row) => row.isActive).length;
  const inactiveScopes = totalScopes - activeScopes;
  const totalItems = itemRows.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Admin / Naesin / Scopes
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            시험 범위 관리
          </h1>
          <p className="text-sm text-neutral-500">
            학교 시험 범위를 조립하는 허브. 교과서, 기출, 예상문제를 하나의 범위로 묶는다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/content"
            className="rounded-xl border px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            콘텐츠 허브
          </Link>
          <Link
            href="/admin/naesin/scopes/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            새 범위 만들기
          </Link>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">전체 범위</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">{totalScopes}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">활성 범위</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700">{activeScopes}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">비활성 범위</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-700">{inactiveScopes}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">연결 콘텐츠 수</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-900">{totalItems}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <form className="grid gap-3 md:grid-cols-6">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="제목 / 학교 검색"
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          />

          <select
            name="school_level"
            defaultValue={sp.school_level ?? ""}
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          >
            <option value="">전체 학교급</option>
            <option value="middle">중등</option>
            <option value="high">고등</option>
          </select>

          <input
            name="grade"
            defaultValue={sp.grade ?? ""}
            placeholder="예: 고1 / 중2"
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          />

          <input
            name="semester"
            defaultValue={sp.semester ?? ""}
            placeholder="예: 1학기"
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          />

          <select
            name="exam_type"
            defaultValue={sp.exam_type ?? ""}
            className="rounded-xl border px-3 py-2 text-sm outline-none"
          >
            <option value="">전체 시험유형</option>
            <option value="midterm">중간</option>
            <option value="final">기말</option>
            <option value="monthly_exam">월말/학평형</option>
            <option value="practice">연습/기타</option>
          </select>

          <div className="flex gap-2">
            <select
              name="active"
              defaultValue={sp.active ?? ""}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            >
              <option value="">전체 활성 상태</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>

            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              적용
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold text-neutral-900">시험 범위 목록</div>
          <div className="text-xs text-neutral-500">
            범위를 클릭하면 상세와 콘텐츠 연결 화면으로 이동
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>제목</th>
                <th>학교</th>
                <th>학년 / 학기</th>
                <th>시험유형</th>
                <th>기간</th>
                <th>포함 콘텐츠 수</th>
                <th>활성</th>
                <th>수정일</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {normalizedRows.map((row) => {
                const itemCount = itemCountByScope.get(row.id) ?? 0;

                return (
                  <tr key={row.id} className="border-t align-top [&>td]:px-4 [&>td]:py-3">
                    <td>
                      <Link
                        href={`/admin/naesin/scopes/${row.id}`}
                        className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                      <div className="mt-1 text-xs text-neutral-500">
                        {row.academic_year} · {getSchoolLevelLabel(row.school_level)}
                        {row.memo ? ` · ${row.memo}` : ""}
                      </div>
                    </td>

                    <td>{row.school_name}</td>

                    <td>
                      <div className="text-neutral-900">{row.grade}</div>
                      <div className="mt-1 text-xs text-neutral-500">{row.semester}</div>
                    </td>

                    <td>{getExamTypeLabel(row.exam_type)}</td>

                    <td className="text-neutral-700">
                      <div>{formatDateRange(row.start_date, row.end_date)}</div>
                    </td>

                    <td>
                      <div className="font-medium text-neutral-900">{itemCount}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {itemCount === 0 ? "아직 비어 있음" : "연결됨"}
                      </div>
                    </td>

                    <td>
                      <form action={toggleNaesinScopeActiveAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="is_active" value={String(!row.isActive)} />
                        <button
                          type="submit"
                          className={[
                            "rounded-full border px-3 py-1 text-xs",
                            row.isActive
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-neutral-300 bg-neutral-50 text-neutral-600",
                          ].join(" ")}
                        >
                          {row.isActive ? "활성" : "비활성"}
                        </button>
                      </form>
                    </td>

                    <td className="text-neutral-700">{formatUpdatedAt(row.updated_at)}</td>

                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/naesin/scopes/${row.id}`}
                          className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50"
                        >
                          상세
                        </Link>

                        <Link
                          href={`/admin/naesin/scopes/${row.id}/edit`}
                          className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50"
                        >
                          수정
                        </Link>

                        <form action={duplicateNaesinScopeAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            className="rounded-xl border px-3 py-2 text-xs hover:bg-neutral-50"
                          >
                            복제
                          </button>
                        </form>

                        <form action={deleteNaesinScopeAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {normalizedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-neutral-500"
                  >
                    등록된 시험 범위가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
