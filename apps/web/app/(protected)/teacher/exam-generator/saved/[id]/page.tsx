import { getServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SavedExamViewer from './_components/SavedExamViewer';

const MONTH_LABEL: Record<number, string> = {
  4: '1학기 중간 (4월)',
  7: '1학기 기말 (7월)',
  10: '2학기 중간 (10월)',
  12: '2학기 기말 (12월)',
};

const GRADE_LABEL: Record<string, string> = {
  H1: '고1', H2: '고2', H3: '고3',
  M1: '중1', M2: '중2', M3: '중3',
};

export default async function SavedExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: exam } = await supabase
    .from('generated_exams')
    .select('*')
    .eq('id', id)
    .single();

  if (!exam) notFound();

  const gradeLabel = GRADE_LABEL[exam.grade] ?? exam.grade;
  const monthLabel = MONTH_LABEL[exam.exam_month] ?? `${exam.exam_month}월`;
  const examLabel = `${exam.school} ${gradeLabel} ${exam.exam_year}년 ${monthLabel}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="print:hidden flex items-center gap-3">
        <Link href="/teacher/exam-generator/saved" className="text-sm text-neutral-400 hover:text-neutral-600 transition">
          ← 목록
        </Link>
        <span className="text-neutral-200">|</span>
        <h1 className="text-xl font-bold text-neutral-900">{examLabel}</h1>
      </div>

      <SavedExamViewer exam={exam} examLabel={examLabel} />
    </div>
  );
}
