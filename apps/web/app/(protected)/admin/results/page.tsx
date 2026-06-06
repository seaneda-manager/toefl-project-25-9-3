// apps/web/app/(protected)/admin/results/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmt(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default async function AdminResultsPage() {
  const supabase = await getServerSupabase();

  const { data: sessions, error } = await supabase
    .from("reading_sessions")
    .select(
      "id, user_id, mode, band_score, legacy_score, started_at, finished_at, reading_passages(id, title)"
    )
    .order("started_at", { ascending: false })
    .limit(300);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </div>
      </main>
    );
  }

  const userIds = Array.from(new Set((sessions ?? []).map((s) => s.user_id)));
  const nameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, name, email")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      const label =
        (p as { full_name?: string | null }).full_name ||
        (p as { name?: string | null }).name ||
        p.email ||
        null;
      if (label) nameMap.set(p.id, label);
    }
  }

  const rows = (sessions ?? []).map((s) => {
    const passage = Array.isArray(s.reading_passages)
      ? s.reading_passages[0]
      : s.reading_passages;
    const score = s.band_score ?? s.legacy_score;
    return {
      id: s.id,
      studentLabel: nameMap.get(s.user_id) ?? `…${s.user_id.slice(-6)}`,
      passageTitle: (passage as { title?: string } | null)?.title ?? "-",
      mode: s.mode,
      score: score != null ? String(score) : "-",
      startedAt: s.started_at,
      finishedAt: s.finished_at,
      done: !!s.finished_at,
    };
  });

  const doneCount = rows.filter((r) => r.done).length;
  const uniqueStudents = new Set(
    (sessions ?? []).map((s) => s.user_id)
  ).size;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-700">Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              학생 풀이 결과
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              reading_sessions 기반 · 최근 300건
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            지문별 통계 보기
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">전체 세션</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">완료</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{doneCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">학생 수</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{uniqueStudents}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>학생</th>
                <th>지문</th>
                <th>모드</th>
                <th>점수</th>
                <th>시작</th>
                <th>완료</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    세션 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 hover:bg-slate-50 [&>td]:px-4 [&>td]:py-3"
                  >
                    <td className="font-medium text-slate-900">
                      {row.studentLabel}
                    </td>
                    <td className="max-w-[220px] truncate text-slate-700">
                      {row.passageTitle}
                    </td>
                    <td className="text-slate-500">{row.mode}</td>
                    <td className="font-semibold text-slate-900">{row.score}</td>
                    <td className="text-slate-500">{fmt(row.startedAt)}</td>
                    <td className="text-slate-500">{fmt(row.finishedAt)}</td>
                    <td>
                      {row.done ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          완료
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          진행중
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/results/${row.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
