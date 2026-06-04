// app/(protected)/teacher/session-report/[studentId]/page.tsx
// 선생님 — 특정 학생의 오늘 PT 요약 (하브루타 용)

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default async function TeacherStudentPtPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = todayISO();

  // ── 학생 정보 ──────────────────────────────────────────────
  const { data: student } = await supabase
    .from('academy_students')
    .select('id, display_name, grade, school, user_id, auth_user_id, class_days')
    .eq('id', studentId)
    .maybeSingle();

  if (!student) notFound();

  const authId    = (student as any).user_id ?? (student as any).auth_user_id as string | null;
  const studentName = (student as any).display_name ?? '(이름 없음)';

  // ── 숙제 결과 ─────────────────────────────────────────────
  const { data: activeHW } = await supabase
    .from('photo_homework')
    .select('id, title, subject')
    .eq('is_active', true);

  const hwIds = (activeHW ?? []).map((h: any) => h.id as string);

  const { data: hwSubs } = hwIds.length > 0 && authId
    ? await supabase
        .from('photo_homework_submissions')
        .select('homework_id, correct_count, total_count, result_data')
        .eq('student_id', authId)
        .in('homework_id', hwIds)
        .gte('created_at', today)
    : { data: [] };

  const hwResults = (hwSubs ?? []).map((sub: any) => {
    const hw       = (activeHW ?? []).find((h: any) => h.id === sub.homework_id);
    const scorePct = sub.total_count > 0 ? Math.round((sub.correct_count / sub.total_count) * 100) : null;
    const items: any[] = (sub.result_data as any)?.items ?? [];
    return {
      title:      hw?.title ?? '숙제',
      subject:    hw?.subject ?? '',
      scorePct,
      correct:    sub.correct_count ?? 0,
      total:      sub.total_count   ?? 0,
      wrongItems: items.filter((it: any) => !it.is_correct),
    };
  });

  // ── 리딩 드릴 ─────────────────────────────────────────────
  const { data: readingSessions } = authId
    ? await supabase
        .from('hi_naesin_sessions')
        .select('id, passage_id, status, score_percent')
        .eq('student_id', authId)
        .gte('started_at', today)
    : { data: [] };

  const readingPassageIds = [...new Set((readingSessions ?? []).map((s: any) => s.passage_id as string))];
  const { data: passages } = readingPassageIds.length > 0
    ? await supabase
        .from('hi_naesin_passages')
        .select('id, title')
        .in('id', readingPassageIds)
    : { data: [] };
  const passageMap = new Map((passages ?? []).map((p: any) => [p.id, p.title]));

  // ── 그래머 ─────────────────────────────────────────────────
  const { data: grammarRows } = authId
    ? await supabase
        .from('grammar_2026_unit_completions')
        .select('unit_id, completed_at')
        .eq('student_id', authId)
        .gte('completed_at', today)
    : { data: [] };

  // ── 오답 분석 (내신 드릴) ───────────────────────────────────
  const sessionIds = (readingSessions ?? []).map((s: any) => s.id as string);
  const { data: wrongResponses } = sessionIds.length > 0
    ? await supabase
        .from('hi_naesin_drill_responses')
        .select('drill_id, is_correct')
        .in('session_id', sessionIds)
        .eq('is_correct', false)
    : { data: [] };

  const wrongCount = (wrongResponses ?? []).length;

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 pb-16">

      {/* 헤더 */}
      <header>
        <div className="text-xs text-neutral-400 mb-1">
          <Link href="/teacher/session-report" className="hover:underline">오늘 리포트</Link>
          {' / '}
          {studentName}
        </div>
        <h1 className="text-xl font-bold text-neutral-900">{studentName} — PT 시트</h1>
        <p className="text-xs text-neutral-400">{todayStr}</p>
      </header>

      {/* 숙제 */}
      <section className="rounded-2xl border border-neutral-200 bg-white divide-y">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">📋 숙제 채점</h2>
          {hwResults.length === 0
            ? <span className="text-sm text-neutral-300">미제출</span>
            : <span className={`text-xl font-black ${
                (hwResults[0].scorePct ?? 0) >= 80 ? 'text-emerald-600'
                : (hwResults[0].scorePct ?? 0) >= 60 ? 'text-amber-500'
                : 'text-red-500'
              }`}>{hwResults[0].scorePct ?? '—'}%</span>
          }
        </div>

        {hwResults.map((hw, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">{hw.title}</p>
              <p className="text-sm text-neutral-500">{hw.correct}/{hw.total}</p>
            </div>
            {hw.wrongItems.length > 0 && (
              <div className="space-y-1">
                {hw.wrongItems.map((it: any) => (
                  <div key={it.number} className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                    <span className="shrink-0 text-xs font-bold text-red-500">Q{it.number}</span>
                    <div className="text-xs text-red-700">
                      <span className="line-through text-red-400 mr-2">내 답: {it.student_answer || '—'}</span>
                      <span className="font-semibold">정답: {it.correct_answer}</span>
                      {it.explanation && <p className="mt-1 text-red-600 opacity-80">{it.explanation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {hwResults.length === 0 && (
          <div className="px-5 py-4 text-sm text-neutral-400">오늘 제출된 숙제가 없습니다.</div>
        )}
      </section>

      {/* 프로그램 학습 */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">💻 프로그램</h2>

        {/* 리딩 드릴 */}
        {readingPassageIds.length > 0 ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-sky-800">📖 리딩 드릴</p>
            {(readingSessions ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 truncate">
                  {passageMap.get(s.passage_id) ?? '(지문)'}
                </span>
                <span className={`shrink-0 ml-2 font-semibold ${s.status === 'submitted' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {s.status === 'submitted' ? '완료' : '진행 중'}
                  {s.score_percent != null && ` · ${s.score_percent}%`}
                </span>
              </div>
            ))}
            {wrongCount > 0 && (
              <p className="text-xs text-red-500">오답 {wrongCount}개</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-3 text-sm text-neutral-400">
            📖 리딩 드릴 미진행
          </div>
        )}

        {/* 그래머 */}
        {(grammarRows ?? []).length > 0 ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3">
            <p className="text-sm font-semibold text-indigo-800">
              ✏️ 그래머 — {(grammarRows ?? []).length}유닛 완료
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-3 text-sm text-neutral-400">
            ✏️ 그래머 미완료
          </div>
        )}
      </section>

      {/* 하브루타 가이드 */}
      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-3">
        <h2 className="text-sm font-bold text-violet-800">💬 하브루타 포인트</h2>
        <ul className="space-y-2 text-sm text-violet-700">
          {hwResults.some(h => h.wrongItems.length > 0) && (
            <li>→ 오답 Q{hwResults.find(h=>h.wrongItems.length>0)?.wrongItems[0]?.number}번 — 왜 틀렸는지 설명시키기</li>
          )}
          {readingPassageIds.length > 0 && (
            <li>→ &quot;{passageMap.get(readingPassageIds[0])}&quot; 해석 구술</li>
          )}
          {(grammarRows ?? []).length > 0 && (
            <li>→ 오늘 배운 문법 규칙 예문 만들기</li>
          )}
          <li>→ 다음 수업 예고 + 복습 포인트 확인</li>
        </ul>
      </section>

      <Link
        href="/teacher/session-report"
        className="block w-full rounded-xl border border-neutral-200 py-2.5 text-center text-sm text-neutral-600 hover:bg-neutral-50"
      >
        ← 전체 리포트로
      </Link>
    </main>
  );
}
