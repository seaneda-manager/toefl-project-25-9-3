// apps/web/app/(protected)/admin/analytics/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getTab(sp: Record<string, string | string[] | undefined>): string {
  const v = sp["tab"];
  const val = Array.isArray(v) ? v[0] : v;
  if (val === "passages" || val === "classes" || val === "trend") return val;
  return "overview";
}

function weekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(key: string): string {
  const [year, w] = key.split("-W");
  return `${year}/${w}주`;
}

function MiniBar({
  value,
  max,
  color = "bg-violet-400",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TabLink({
  tab,
  current,
  label,
}: {
  tab: string;
  current: string;
  label: string;
}) {
  const active = tab === current;
  return (
    <Link
      href={`/admin/analytics?tab=${tab}`}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

async function OverviewTab() {
  const supabase = await getServerSupabase();

  const [{ data: sessions }, { data: students }] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("id, user_id, band_score, legacy_score, started_at, finished_at"),
    supabase.from("academy_students").select("id, is_active"),
  ]);

  const allSessions = sessions ?? [];
  const doneSessions = allSessions.filter((s) => !!s.finished_at);
  const uniqueUsers = new Set(allSessions.map((s) => s.user_id)).size;
  const activeStudents = (students ?? []).filter((s) => s.is_active !== false).length;

  const scores = doneSessions
    .map((s) => s.band_score ?? s.legacy_score)
    .filter((v): v is number => v != null);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  // 최근 8주 주간 세션 수
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 56 * 86400000);
  const recent = allSessions.filter(
    (s) => s.started_at && new Date(s.started_at) >= eightWeeksAgo
  );

  const weekMap = new Map<string, number>();
  for (const s of recent) {
    if (!s.started_at) continue;
    const k = weekKey(s.started_at);
    weekMap.set(k, (weekMap.get(k) ?? 0) + 1);
  }
  const weekEntries = Array.from(weekMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const maxWeek = Math.max(...weekEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "전체 세션", value: allSessions.length },
          { label: "완료 세션", value: doneSessions.length },
          { label: "활동 학생 수", value: uniqueUsers },
          { label: "등록 학생 수 (active)", value: activeStudents },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      {avgScore != null && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">전체 평균 점수 (완료 세션 기준)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{avgScore}점</p>
        </div>
      )}

      {/* 주간 세션 추이 */}
      {weekEntries.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-900">주간 세션 수 (최근 8주)</h3>
          <div className="space-y-2">
            {weekEntries.map(([key, count]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-slate-500">{weekLabel(key)}</span>
                <MiniBar value={count} max={maxWeek} color="bg-violet-400" />
                <span className="w-6 text-right text-xs font-semibold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Passages ────────────────────────────────────────────────────────────────

async function PassagesTab() {
  const supabase = await getServerSupabase();

  // 세션별 답안 + 지문 정보
  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("id, passage_id, reading_passages(id, title)")
    .not("finished_at", "is", null);

  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: answers } = sessionIds.length > 0
    ? await supabase
        .from("reading_answers")
        .select("session_id, question_id, reading_questions(type, passage_id), reading_choices(is_correct)")
        .in("session_id", sessionIds)
    : { data: [] };

  // passage_id → { title, sessions, correct, total }
  type PassageStat = {
    title: string;
    sessions: number;
    correct: number;
    total: number;
  };
  const passageMap = new Map<string, PassageStat>();

  // 세션별 지문 제목 수집
  for (const s of sessions ?? []) {
    const p = Array.isArray(s.reading_passages) ? s.reading_passages[0] : s.reading_passages;
    const title = (p as { title?: string } | null)?.title ?? s.passage_id;
    if (!passageMap.has(s.passage_id)) {
      passageMap.set(s.passage_id, { title, sessions: 0, correct: 0, total: 0 });
    }
    passageMap.get(s.passage_id)!.sessions += 1;
  }

  // 답안별 정오답
  for (const a of answers ?? []) {
    const q = Array.isArray(a.reading_questions) ? a.reading_questions[0] : a.reading_questions;
    const c = Array.isArray(a.reading_choices) ? a.reading_choices[0] : a.reading_choices;
    const pid = (q as { passage_id?: string } | null)?.passage_id;
    if (!pid || !passageMap.has(pid)) continue;
    const stat = passageMap.get(pid)!;
    stat.total += 1;
    if ((c as { is_correct?: boolean } | null)?.is_correct) stat.correct += 1;
  }

  // 오답률 기준 정렬 (오답률 높은 순)
  const rows = Array.from(passageMap.entries())
    .map(([id, stat]) => ({
      id,
      ...stat,
      errorRate: stat.total > 0 ? Math.round(((stat.total - stat.correct) / stat.total) * 100) : null,
      accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null,
    }))
    .sort((a, b) => (b.errorRate ?? 0) - (a.errorRate ?? 0));

  const maxSessions = Math.max(...rows.map((r) => r.sessions), 1);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">지문별 오답률 (높은 순)</h3>
          <p className="text-xs text-slate-400">완료된 세션 기준</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th className="min-w-[200px]">지문</th>
                <th>세션</th>
                <th>정답률</th>
                <th className="min-w-[160px]">오답률</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 [&>td]:px-4 [&>td]:py-3">
                    <td className="max-w-[220px] truncate font-medium text-slate-800">
                      {row.title}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MiniBar value={row.sessions} max={maxSessions} color="bg-slate-300" />
                        <span className="w-6 shrink-0 text-xs text-slate-600">{row.sessions}</span>
                      </div>
                    </td>
                    <td>
                      {row.accuracy != null ? (
                        <span
                          className={`font-semibold ${
                            row.accuracy >= 70
                              ? "text-emerald-600"
                              : row.accuracy >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {row.accuracy}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      {row.errorRate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                row.errorRate >= 50 ? "bg-rose-400" : row.errorRate >= 30 ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${row.errorRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{row.errorRate}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────

async function ClassesTab() {
  const supabase = await getServerSupabase();

  const { data: classes } = await supabase
    .from("academy_classes")
    .select("id, name");

  const { data: memberships } = await supabase
    .from("academy_class_students")
    .select("class_id, student_id");

  // student_id(=profiles.id) → reading sessions
  const allStudentIds = Array.from(
    new Set((memberships ?? []).map((m) => m.student_id))
  );

  const { data: sessions } = allStudentIds.length > 0
    ? await supabase
        .from("reading_sessions")
        .select("id, user_id, band_score, legacy_score, started_at")
        .in("user_id", allStudentIds)
        .not("finished_at", "is", null)
    : { data: [] };

  // class_id → student_ids
  const classStudents = new Map<string, Set<string>>();
  for (const m of memberships ?? []) {
    if (!classStudents.has(m.class_id)) classStudents.set(m.class_id, new Set());
    classStudents.get(m.class_id)!.add(m.student_id);
  }

  // student_id → sessions
  const studentSessions = new Map<string, typeof sessions>();
  for (const s of sessions ?? []) {
    if (!studentSessions.has(s.user_id)) studentSessions.set(s.user_id, []);
    studentSessions.get(s.user_id)!.push(s);
  }

  const classRows = (classes ?? []).map((cls) => {
    const studentIds = Array.from(classStudents.get(cls.id) ?? []);
    const clsSessions = studentIds.flatMap((sid) => studentSessions.get(sid) ?? []);
    const scores = clsSessions
      .map((s) => s.band_score ?? s.legacy_score)
      .filter((v): v is number => v != null);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return {
      id: cls.id,
      name: cls.name,
      studentCount: studentIds.length,
      sessionCount: clsSessions.length,
      avgScore,
    };
  });

  const maxScore = Math.max(...classRows.map((r) => r.avgScore ?? 0), 1);
  const maxSessions = Math.max(...classRows.map((r) => r.sessionCount), 1);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">클래스별 비교</h3>
          <p className="text-xs text-slate-400">완료 세션 기준 평균 점수</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>클래스</th>
                <th>학생 수</th>
                <th>세션 수</th>
                <th className="min-w-[180px]">평균 점수</th>
              </tr>
            </thead>
            <tbody>
              {classRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    클래스 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                classRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 [&>td]:px-4 [&>td]:py-3">
                    <td className="font-medium text-slate-900">{row.name}</td>
                    <td className="text-slate-600">{row.studentCount}명</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-sky-300"
                            style={{
                              width: `${Math.round((row.sessionCount / maxSessions) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{row.sessionCount}</span>
                      </div>
                    </td>
                    <td>
                      {row.avgScore != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-violet-400"
                              style={{
                                width: `${Math.round((row.avgScore / maxScore) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-800">
                            {row.avgScore}점
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">데이터 없음</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Trend ───────────────────────────────────────────────────────────────────

async function TrendTab() {
  const supabase = await getServerSupabase();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("id, user_id, band_score, legacy_score, started_at, finished_at")
    .gte("started_at", sixMonthsAgo.toISOString())
    .order("started_at", { ascending: true });

  // 주간 집계: { sessions, done, users, avgScore }
  type WeekBucket = {
    sessions: number;
    done: number;
    users: Set<string>;
    scores: number[];
  };
  const weekMap = new Map<string, WeekBucket>();

  for (const s of sessions ?? []) {
    if (!s.started_at) continue;
    const k = weekKey(s.started_at);
    if (!weekMap.has(k)) {
      weekMap.set(k, { sessions: 0, done: 0, users: new Set(), scores: [] });
    }
    const bucket = weekMap.get(k)!;
    bucket.sessions += 1;
    bucket.users.add(s.user_id);
    if (s.finished_at) {
      bucket.done += 1;
      const score = s.band_score ?? s.legacy_score;
      if (score != null) bucket.scores.push(score);
    }
  }

  const weekEntries = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => ({
      key,
      label: weekLabel(key),
      sessions: b.sessions,
      done: b.done,
      users: b.users.size,
      avgScore:
        b.scores.length > 0
          ? Math.round(b.scores.reduce((a, c) => a + c, 0) / b.scores.length)
          : null,
    }));

  const maxSessions = Math.max(...weekEntries.map((e) => e.sessions), 1);
  const maxScore = Math.max(...weekEntries.map((e) => e.avgScore ?? 0), 1);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">주간 세션 수 (최근 6개월)</h3>
        {weekEntries.length === 0 ? (
          <p className="text-sm text-slate-400">데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {weekEntries.map((entry) => (
              <div key={entry.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-slate-500">{entry.label}</span>
                <MiniBar value={entry.sessions} max={maxSessions} color="bg-sky-400" />
                <span className="w-6 text-right text-xs font-semibold text-slate-700">
                  {entry.sessions}
                </span>
                <span className="text-xs text-slate-400">({entry.users}명)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">주간 평균 점수 추이</h3>
        {weekEntries.filter((e) => e.avgScore != null).length === 0 ? (
          <p className="text-sm text-slate-400">점수 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {weekEntries.map((entry) => (
              <div key={entry.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-slate-500">{entry.label}</span>
                {entry.avgScore != null ? (
                  <>
                    <MiniBar value={entry.avgScore} max={maxScore} color="bg-emerald-400" />
                    <span className="w-10 text-right text-xs font-semibold text-slate-700">
                      {entry.avgScore}점
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-300">완료 세션 없음</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 월별 요약 테이블 */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">주별 상세</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>주</th>
                <th>전체 세션</th>
                <th>완료</th>
                <th>활동 학생</th>
                <th>평균 점수</th>
              </tr>
            </thead>
            <tbody>
              {weekEntries.map((entry) => (
                <tr
                  key={entry.key}
                  className="border-t border-slate-100 [&>td]:px-4 [&>td]:py-3"
                >
                  <td className="font-medium text-slate-700">{entry.label}</td>
                  <td className="text-slate-600">{entry.sessions}</td>
                  <td className="text-slate-600">{entry.done}</td>
                  <td className="text-slate-600">{entry.users}명</td>
                  <td className="font-semibold text-slate-800">
                    {entry.avgScore != null ? `${entry.avgScore}점` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = getTab(sp);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-violet-700">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">학원 전체 학습 현황 분석</p>

        <div className="mt-4 flex gap-2">
          <TabLink tab="overview" current={tab} label="전체 현황" />
          <TabLink tab="passages" current={tab} label="지문·문제별" />
          <TabLink tab="classes" current={tab} label="클래스별" />
          <TabLink tab="trend" current={tab} label="기간별 추이" />
        </div>
      </header>

      {tab === "overview" && <OverviewTab />}
      {tab === "passages" && <PassagesTab />}
      {tab === "classes" && <ClassesTab />}
      {tab === "trend" && <TrendTab />}
    </main>
  );
}
