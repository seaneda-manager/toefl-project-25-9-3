// apps/web/app/(protected)/teacher/reports/students/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type HiNaesinSessionRow = {
  user_id: string;
  status: string;
  submitted_at: string | null;
};

type VocabAttemptRow = {
  user_id: string;
  is_correct: boolean | null;
  created_at: string;
};

type StudentSummary = {
  id: string;
  name: string;
  email: string;
  hiNaeSin: { total: number; completed: number; lastAt: string | null };
  vocab: { total: number; correct: number; lastAt: string | null };
};

export default async function TeacherStudentsReportPage() {
  const supabase = await getServerSupabase();

  // 1) 학생 목록
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  const students: ProfileRow[] = profiles ?? [];
  const studentIds = students.map((s) => s.id);

  if (studentIds.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-neutral-900">학생 활동 리포트</h1>
        <p className="mt-4 text-sm text-neutral-500">등록된 학생이 없습니다.</p>
      </main>
    );
  }

  // 2) Hi-내신 세션
  const { data: hiSessions } = await supabase
    .from("hi_naesin_sessions")
    .select("user_id, status, submitted_at")
    .in("user_id", studentIds);

  const hiSessionRows: HiNaesinSessionRow[] = hiSessions ?? [];

  // 3) Vocab 드릴 시도
  const { data: vocabAttempts } = await supabase
    .from("vocab_drill_attempts")
    .select("user_id, is_correct, created_at")
    .in("user_id", studentIds);

  const vocabRows: VocabAttemptRow[] = vocabAttempts ?? [];

  // 4) 학생별 집계
  const summaries: StudentSummary[] = students.map((s) => {
    const sessions = hiSessionRows.filter((r) => r.user_id === s.id);
    const completed = sessions.filter((r) => r.status === "completed" || r.status === "submitted");
    const lastHi = sessions
      .map((r) => r.submitted_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    const vAttempts = vocabRows.filter((r) => r.user_id === s.id);
    const vCorrect = vAttempts.filter((r) => r.is_correct).length;
    const lastVocab = vAttempts.map((r) => r.created_at).sort().at(-1) ?? null;

    return {
      id: s.id,
      name: s.full_name ?? "(이름 없음)",
      email: s.email ?? "",
      hiNaeSin: { total: sessions.length, completed: completed.length, lastAt: lastHi },
      vocab: { total: vAttempts.length, correct: vCorrect, lastAt: lastVocab },
    };
  });

  function fmtDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  function pct(a: number, b: number) {
    if (b === 0) return "-";
    return `${Math.round((a / b) * 100)}%`;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header>
        <div className="text-xs uppercase tracking-widest text-neutral-400">선생님 / 리포트</div>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">학생 활동 리포트</h1>
        <p className="mt-1 text-sm text-neutral-500">학생별 Hi-내신 및 어휘 드릴 활동 현황</p>
      </header>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">전체 학생</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{students.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">Hi-내신 세션 (전체)</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">{hiSessionRows.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">어휘 드릴 시도 (전체)</div>
          <div className="mt-2 text-3xl font-bold text-violet-700">{vocabRows.length}</div>
        </div>
      </div>

      {/* 학생별 테이블 */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">학생별 현황</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th>학생</th>
                <th>Hi-내신 세션</th>
                <th>Hi-내신 완료</th>
                <th>마지막 Hi-내신</th>
                <th>어휘 시도</th>
                <th>어휘 정답률</th>
                <th>마지막 어휘</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id} className="border-t hover:bg-neutral-50 [&>td]:px-4 [&>td]:py-3">
                  <td>
                    <div className="font-medium text-neutral-900">{s.name}</div>
                    <div className="text-xs text-neutral-400">{s.email}</div>
                  </td>
                  <td className="text-neutral-700">{s.hiNaeSin.total}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.hiNaeSin.completed > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {s.hiNaeSin.completed}
                    </span>
                  </td>
                  <td className="text-xs text-neutral-500">{fmtDate(s.hiNaeSin.lastAt)}</td>
                  <td className="text-neutral-700">{s.vocab.total}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.vocab.total > 0
                        ? "bg-violet-50 text-violet-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {pct(s.vocab.correct, s.vocab.total)}
                    </span>
                  </td>
                  <td className="text-xs text-neutral-500">{fmtDate(s.vocab.lastAt)}</td>
                  <td>
                    <Link
                      href={`/teacher/students/${s.id}`}
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-neutral-400">
        * Reading / Listening / Speaking / Writing 결과는 순차적으로 추가 예정
      </p>
    </main>
  );
}
