import { getServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

const MONTH_LABEL: Record<number, string> = {
  4: '1학기 중간', 7: '1학기 기말', 10: '2학기 중간', 12: '2학기 기말',
};
const GRADE_LABEL: Record<string, string> = {
  H1: '고1', H2: '고2', H3: '고3', M1: '중1', M2: '중2', M3: '중3',
};

export default async function StudentExamsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from('generated_exam_assignments')
    .select(`
      id, assigned_at, due_date,
      generated_exams(id, school, grade, exam_year, exam_month, questions),
      generated_exam_responses(submitted_at)
    `)
    .eq('student_id', user!.id)
    .order('assigned_at', { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">📋 배정된 시험</h1>
        <p className="mt-1 text-sm text-neutral-500">선생님이 배정한 예상문제 목록입니다.</p>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-400">
          배정된 시험이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const exam = a.generated_exams;
            const response = a.generated_exam_responses?.[0];
            const submitted = !!response?.submitted_at;
            const qCount = Array.isArray(exam?.questions) ? exam.questions.length : 0;
            const gradeLabel = GRADE_LABEL[exam?.grade] ?? exam?.grade;
            const monthLabel = MONTH_LABEL[exam?.exam_month] ?? `${exam?.exam_month}월`;

            return (
              <Link key={a.id} href={`/student/exams/${a.id}`}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-900">
                    {exam?.school} · {gradeLabel} · {exam?.exam_year}년 {monthLabel}
                  </p>
                  <p className="text-sm text-neutral-500">{qCount}문항</p>
                  {a.due_date && (
                    <p className="text-xs text-amber-600">마감: {new Date(a.due_date).toLocaleDateString('ko-KR')}</p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${submitted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {submitted ? '제출완료' : '응시하기'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
