"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

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

export default function TeacherDashboard() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.id) {
          setLoading(false);
          return;
        }

        // 1. 모든 학생 조회 (향후 teacher_id로 필터링)
        const { data: teacherStudents } = await supabase
          .from("academy_students")
          .select("id, full_name")
          .eq("is_active", true);

        if (!teacherStudents || teacherStudents.length === 0) {
          setLoading(false);
          return;
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

        // 3. 클래스별 통계 (선생님이 속한 모든 학생)
        const classStatsObj: ClassStats = {
          className: "전체 학생",
          studentCount: studentStats.length,
          totalAttempts: studentStats.reduce((sum, s) => sum + s.totalAttempts, 0),
          averageProgress: Math.round(studentStats.reduce((sum, s) => sum + s.totalAttempts, 0) / (studentStats.length * 50) * 100) || 0,
          averageSuccessRate: Math.round(studentStats.reduce((sum, s) => sum + s.averageSuccessRate, 0) / studentStats.length) || 0,
        };

        setStudents(studentStats.sort((a, b) => b.totalAttempts - a.totalAttempts));
        setClassStats([classStatsObj]);
      } catch (e) {
        console.warn("Error loading teacher dashboard:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="text-center text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">선생님 대시보드</h1>
          <p className="mt-2 text-slate-600">학생들의 학습 진도를 한눈에 확인하세요</p>
        </div>

        {/* Class Stats */}
        {classStats.map((stat, idx) => (
          <div key={idx} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="text-sm font-semibold text-slate-600">총 학생 수</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">{stat.studentCount}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="text-sm font-semibold text-slate-600">전체 학습 시도</div>
              <div className="mt-2 text-3xl font-bold text-emerald-600">{stat.totalAttempts}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="text-sm font-semibold text-slate-600">평균 진도율</div>
              <div className="mt-2 text-3xl font-bold text-purple-600">{Math.min(stat.averageProgress, 100)}%</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="text-sm font-semibold text-slate-600">평균 성공률</div>
              <div className="mt-2 text-3xl font-bold text-amber-600">{stat.averageSuccessRate}%</div>
            </div>
          </div>
        ))}

        {/* Student List */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-slate-900">학생별 진도</h2>

          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">학생명</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">학습 횟수</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">약한 단어</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">성공률</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">활성 목표</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">마지막 활동</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((student) => (
                    <tr
                      key={student.studentId}
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">{student.studentName}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{student.totalAttempts}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                          student.weakWordCount > 50 ? "bg-red-100 text-red-700" :
                          student.weakWordCount > 20 ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {student.weakWordCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                              style={{ width: `${student.averageSuccessRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{student.averageSuccessRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                          {student.activeGoals}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">
                        {student.lastActivityDate || "활동 없음"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-600">
              아직 학생이 없습니다. 학생을 추가하고 단어를 배정해주세요.
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.studentName}</h2>
                  <p className="mt-1 text-sm text-slate-600">상세 학습 현황</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-2xl text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-sm font-semibold text-blue-700">학습 시도</div>
                  <div className="mt-2 text-2xl font-bold text-blue-900">{selectedStudent.totalAttempts}</div>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="text-sm font-semibold text-red-700">약한 단어</div>
                  <div className="mt-2 text-2xl font-bold text-red-900">{selectedStudent.weakWordCount}</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-700">성공률</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-900">{selectedStudent.averageSuccessRate}%</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-sm font-semibold text-purple-700">활성 목표</div>
                  <div className="mt-2 text-2xl font-bold text-purple-900">{selectedStudent.activeGoals}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">마지막 활동</div>
                <p className="text-slate-600">
                  {selectedStudent.lastActivityDate || "아직 학습한 적이 없습니다"}
                </p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800 transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
