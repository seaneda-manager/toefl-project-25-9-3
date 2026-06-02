// apps/web/app/(protected)/teacher/reports/students/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  grade: string | null;
  program: string | null;
};

type HiNaesinSessionRow = {
  user_id: string;
  status: string;
  submitted_at: string | null;
};

type JrDrillResultRow = {
  student_id: string;
  stage: string;
  score_pct: number | null;
  completed_at: string;
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
  grade: string | null;
  program: string | null;
  hiNaeSin: { total: number; completed: number; lastAt: string | null };
  jrNaesin: { total: number; avgScore: number | null; lastAt: string | null };
  vocab: { total: number; correct: number; lastAt: string | null };
};

// 프로그램별 활성 모듈 정의
function getActiveModules(program: string | null) {
  if (program === "lingx") return { hiNaesin: true, jr: true, vocab: true, toefl: false };
  if (program === "toefl") return { hiNaesin: false, jr: false, vocab: true, toefl: true };
  if (program === "gap")   return { hiNaesin: true,  jr: true,  vocab: true, toefl: false };
  // 미지정: 전부 표시 (회색으로)
  return { hiNaesin: false, jr: false, vocab: false, toefl: false };
}

function programLabel(program: string | null) {
  if (program === "lingx") return { text: "LEXiOX 내신", color: "bg-emerald-100 text-emerald-700" };
  if (program === "toefl") return { text: "TOEFL", color: "bg-blue-100 text-blue-700" };
  if (program === "gap")   return { text: "GAP", color: "bg-orange-100 text-orange-700" };
  return { text: "미지정", color: "bg-neutral-100 text-neutral-500" };
}

export default async function TeacherStudentsReportPage() {
  const supabase = await getServerSupabase();

  // 1) 학생 목록 (grade, program 포함)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, grade, program")
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

  // 3) JR. 내신 드릴 결과
  const { data: jrResults } = await supabase
    .from("lexiox_jr_drill_results")
    .select("student_id, stage, score_pct, completed_at")
    .in("student_id", studentIds);
  const jrRows: JrDrillResultRow[] = jrResults ?? [];

  // 4) Vocab 드릴 시도
  const { data: vocabAttempts } = await supabase
    .from("vocab_drill_attempts")
    .select("user_id, is_correct, created_at")
    .in("user_id", studentIds);
  const vocabRows: VocabAttemptRow[] = vocabAttempts ?? [];

  // 5) 학생별 집계
  const summaries: StudentSummary[] = students.map((s) => {
    const sessions = hiSessionRows.filter((r) => r.user_id === s.id);
    const completed = sessions.filter((r) => r.status === "completed" || r.status === "submitted");
    const lastHi = sessions.map((r) => r.submitted_at).filter(Boolean).sort().at(-1) ?? null;

    const jr = jrRows.filter((r) => r.student_id === s.id);
    const jrScores = jr.map((r) => r.score_pct).filter((v): v is number => v !== null);
    const jrAvg = jrScores.length > 0
      ? Math.round(jrScores.reduce((a, b) => a + b, 0) / jrScores.length)
      : null;
    const lastJr = jr.map((r) => r.completed_at).sort().at(-1) ?? null;

    const vAttempts = vocabRows.filter((r) => r.user_id === s.id);
    const vCorrect = vAttempts.filter((r) => r.is_correct).length;
    const lastVocab = vAttempts.map((r) => r.created_at).sort().at(-1) ?? null;

    return {
      id: s.id,
      name: s.full_name ?? "(이름 없음)",
      email: s.email ?? "",
      grade: s.grade,
      program: s.program,
      hiNaeSin: { total: sessions.length, completed: completed.length, lastAt: lastHi },
      jrNaesin: { total: jr.length, avgScore: jrAvg, lastAt: lastJr },
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

  // 프로그램별 학생 수 집계
  const programCounts = summaries.reduce<Record<string, number>>((acc, s) => {
    const key = s.program ?? "미지정";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header>
        <div className="text-xs uppercase tracking-widest text-neutral-400">선생님 / 리포트</div>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">학생 활동 리포트</h1>
        <p className="mt-1 text-sm text-neutral-500">
          학생의 프로그램·학년에 따라 해당 활동 항목만 활성화됩니다
        </p>
      </header>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">전체 학생</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">{students.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">LEXiOX 내신</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">{programCounts["lingx"] ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">TOEFL</div>
          <div className="mt-2 text-3xl font-bold text-blue-700">{programCounts["toefl"] ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">미지정</div>
          <div className="mt-2 text-3xl font-bold text-neutral-400">{programCounts["미지정"] ?? 0}</div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-700">컬럼 활성화 기준:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-white border border-neutral-300" />
          활성 (프로그램 해당)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-100" />
          비활성 (프로그램 미해당)
        </span>
      </div>

      {/* 학생별 테이블 */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">학생별 현황</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium [&>th]:whitespace-nowrap">
                <th>학생</th>
                <th>프로그램</th>
                {/* Hi-내신 */}
                <th className="border-l border-emerald-100 bg-emerald-50/60 text-emerald-700">Hi-내신 세션</th>
                <th className="bg-emerald-50/60 text-emerald-700">완료</th>
                <th className="bg-emerald-50/60 text-emerald-700">마지막</th>
                {/* JR 내신 */}
                <th className="border-l border-orange-100 bg-orange-50/60 text-orange-700">JR. 드릴</th>
                <th className="bg-orange-50/60 text-orange-700">평균점수</th>
                <th className="bg-orange-50/60 text-orange-700">마지막</th>
                {/* 어휘 */}
                <th className="border-l border-violet-100 bg-violet-50/60 text-violet-700">어휘 시도</th>
                <th className="bg-violet-50/60 text-violet-700">정답률</th>
                <th className="bg-violet-50/60 text-violet-700">마지막</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const mods = getActiveModules(s.program);
                const pl = programLabel(s.program);

                // 비활성 셀 스타일
                const dim = "bg-neutral-50 text-neutral-300 select-none";
                const active = "";

                return (
                  <tr key={s.id} className="border-t hover:bg-neutral-50 [&>td]:px-4 [&>td]:py-3">
                    {/* 학생 정보 */}
                    <td>
                      <div className="font-medium text-neutral-900">{s.name}</div>
                      <div className="text-xs text-neutral-400">{s.email}</div>
                      {s.grade && (
                        <div className="mt-0.5 text-xs text-neutral-400">{s.grade}</div>
                      )}
                    </td>

                    {/* 프로그램 배지 */}
                    <td>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pl.color}`}>
                        {pl.text}
                      </span>
                    </td>

                    {/* Hi-내신 */}
                    <td className={`border-l border-emerald-100 ${mods.hiNaesin ? active : dim}`}>
                      {mods.hiNaesin ? s.hiNaeSin.total : "—"}
                    </td>
                    <td className={mods.hiNaesin ? active : dim}>
                      {mods.hiNaesin ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.hiNaeSin.completed > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {s.hiNaeSin.completed}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={`text-xs ${mods.hiNaesin ? "text-neutral-500" : dim}`}>
                      {mods.hiNaesin ? fmtDate(s.hiNaeSin.lastAt) : "—"}
                    </td>

                    {/* JR 내신 */}
                    <td className={`border-l border-orange-100 ${mods.jr ? active : dim}`}>
                      {mods.jr ? s.jrNaesin.total : "—"}
                    </td>
                    <td className={mods.jr ? active : dim}>
                      {mods.jr ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.jrNaesin.avgScore !== null
                            ? "bg-orange-50 text-orange-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {s.jrNaesin.avgScore !== null ? `${s.jrNaesin.avgScore}%` : "-"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={`text-xs ${mods.jr ? "text-neutral-500" : dim}`}>
                      {mods.jr ? fmtDate(s.jrNaesin.lastAt) : "—"}
                    </td>

                    {/* 어휘 */}
                    <td className={`border-l border-violet-100 ${mods.vocab ? active : dim}`}>
                      {mods.vocab ? s.vocab.total : "—"}
                    </td>
                    <td className={mods.vocab ? active : dim}>
                      {mods.vocab ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.vocab.total > 0
                            ? "bg-violet-50 text-violet-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {pct(s.vocab.correct, s.vocab.total)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={`text-xs ${mods.vocab ? "text-neutral-500" : dim}`}>
                      {mods.vocab ? fmtDate(s.vocab.lastAt) : "—"}
                    </td>

                    <td>
                      <Link
                        href={`/teacher/students/${s.id}`}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-neutral-400">
        * TOEFL Reading / Listening / Speaking / Writing 결과는 순차적으로 추가 예정
      </p>
    </main>
  );
}
