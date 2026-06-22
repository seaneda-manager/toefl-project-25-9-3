import { getServerSupabase } from '@/lib/supabase/server';
import ExamGeneratorForm from './_components/ExamGeneratorForm';

export default async function ExamGeneratorPage() {
  const supabase = await getServerSupabase();

  // Only show schools + grades that actually have drill assignments
  const [{ data: schoolRows }, { data: gradeRows }] = await Promise.all([
    supabase
      .from('hi_naesin_passages')
      .select('school_name, hi_naesin_assignments!inner(id)')
      .eq('is_published', true)
      .not('school_name', 'is', null),
    supabase
      .from('hi_naesin_passages')
      .select('grade, hi_naesin_assignments!inner(id)')
      .eq('is_published', true)
      .not('grade', 'is', null),
  ]);

  const schools = [...new Set((schoolRows ?? []).map((r) => r.school_name as string))].sort();
  const grades = [...new Set((gradeRows ?? []).map((r) => r.grade as string))].sort();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-neutral-900">📝 예상문제 생성기</h1>
        <p className="mt-1 text-sm text-neutral-500">
          학교·학년별 배정 지문을 분석해 수능/내신 스타일 30문항을 생성합니다.
        </p>
      </div>

      <ExamGeneratorForm schools={schools} grades={grades} />
    </div>
  );
}
