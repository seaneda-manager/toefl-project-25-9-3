import { getServiceSupabase } from "@/lib/supabase/service";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

type StudentProgress = {
  studentId: string;
  studentName: string;
  totalAttempts: number;
  weakWordCount: number;
  averageSuccessRate: number;
  activeGoals: number;
  lastActivityDate: string | null;
};

type ClassStats = {
  className: string;
  studentCount: number;
  totalAttempts: number;
  averageProgress: number;
  averageSuccessRate: number;
};

export default async function TeacherDashboardPage() {
  const supabase = getServiceSupabase();

  try {
    // 1. 모든 활성 학생 조회
    const { data: teacherStudents } = await supabase
      .from("academy_students")
      .select("id, full_name")
      .eq("is_active", true);

    if (!teacherStudents || teacherStudents.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl font-bold text-slate-900">선생님 대시보드</h1>
            <div className="mt-8 rounded-lg bg-slate-50 p-6 text-center text-slate-600">
              아직 학생이 없습니다.
            </div>
          </div>
        </div>
      );
    }

    // 2. 각 학생별 통계 수집
    const studentStats: StudentProgress[] = [];

    for (const student of teacherStudents) {
      // 학습 시도 조회
      const { data: attempts } = await supabase
        .from("vocab_learning_attempts")
        .select("wrong_word_ids, stage, attempted_at")
        .eq("student_id", student.id);

      const totalAttempts = attempts?.length || 0;

      // 약한 단어 수집
      const weakWordIds = new Set<string>();
      let stageStats = { know: 0, spelling: 0, speed: 0, totalWrong: 0 };

      if (attempts) {
        for (const attempt of attempts) {
          const wrongIds = Array.isArray(attempt.wrong_word_ids) ? attempt.wrong_word_ids : [];
          wrongIds.forEach((id) => weakWordIds.add(id));
          stageStats.totalWrong += wrongIds.length;

          if (attempt.stage === "know") stageStats.know++;
          else if (attempt.stage === "spelling") stageStats.spelling++;
          else if (attempt.stage === "speed") stageStats.speed++;
        }
      }

      // 성공률 계산
      const totalStages = stageStats.know + stageStats.spelling + stageStats.speed;
      const averageSuccessRate = totalStages > 0 ? Math.round(((totalStages - (stageStats.totalWrong / totalAttempts || 0)) / totalStages) * 100) : 0;

      // 활성 목표 수
      const { data: goalsData } = await supabase
        .from("vocab_student_goals")
        .select("id", { count: "exact" })
        .eq("student_id", student.id)
        .eq("status", "active");

      const lastActivity = attempts?.[attempts.length - 1]?.attempted_at || null;

      studentStats.push({
        studentId: student.id,
        studentName: student.full_name || "Unknown",
        totalAttempts,
        weakWordCount: weakWordIds.size,
        averageSuccessRate: Math.max(0, averageSuccessRate),
        activeGoals: goalsData?.count || 0,
        lastActivityDate: lastActivity ? new Date(lastActivity).toLocaleDateString("ko-KR") : null,
      });
    }

    // 3. 클래스별 통계
    const classStatsObj: ClassStats = {
      className: "전체 학생",
      studentCount: studentStats.length,
      totalAttempts: studentStats.reduce((sum, s) => sum + s.totalAttempts, 0),
      averageProgress: Math.round(studentStats.reduce((sum, s) => sum + s.totalAttempts, 0) / (studentStats.length * 50) * 100) || 0,
      averageSuccessRate: Math.round(studentStats.reduce((sum, s) => sum + s.averageSuccessRate, 0) / studentStats.length) || 0,
    };

    return (
      <DashboardClient
        students={studentStats.sort((a, b) => b.totalAttempts - a.totalAttempts)}
        classStats={[classStatsObj]}
      />
    );
  } catch (e) {
    console.error("Error loading teacher dashboard:", e);
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-slate-900">선생님 대시보드</h1>
          <div className="mt-8 rounded-lg bg-red-50 p-6 text-center text-red-600">
            데이터를 불러오는 중에 오류가 발생했습니다.
          </div>
        </div>
      </div>
    );
  }
}
