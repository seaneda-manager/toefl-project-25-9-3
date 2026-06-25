'use client';

import { useState } from 'react';
import type { ExamQuestion } from '../../../_actions/generate';

type Student = { id: string; name: string };
type Response = {
  studentId: string;
  answers: Record<string, string>;
  submittedAt: string | null;
};

type Props = {
  students: Student[];
  responses: Response[];
  questions: ExamQuestion[];
};

export default function ResponsesPanel({ students, responses, questions }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const responseMap = Object.fromEntries(responses.map((r) => [r.studentId, r]));
  const submittedCount = responses.filter((r) => r.submittedAt).length;

  const selectedResponse = selected ? responseMap[selected] : null;

  function getScore(answers: Record<string, string>) {
    let correct = 0;
    for (const q of questions) {
      if (q.type === '서술형') continue;
      const studentAns = answers[String(q.number)]?.trim();
      const correctAns = q.answer?.trim().slice(0, 1);
      if (studentAns && correctAns && studentAns === correctAns) correct++;
    }
    const objectiveCount = questions.filter((q) => q.type !== '서술형').length;
    return { correct, total: objectiveCount };
  }

  return (
    <div className="print:hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900">📊 학생 답안 현황</h2>
        <span className="text-sm text-neutral-500">제출 {submittedCount} / {students.length}명</span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-neutral-400">배정된 학생이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const res = responseMap[s.id];
            const submitted = !!res?.submittedAt;
            const score = submitted ? getScore(res.answers) : null;
            const isSelected = selected === s.id;

            return (
              <div key={s.id} className="rounded-xl border border-neutral-100 overflow-hidden">
                <button
                  onClick={() => setSelected(isSelected ? null : s.id)}
                  disabled={!submitted}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition
                    ${submitted ? 'hover:bg-neutral-50 cursor-pointer' : 'cursor-default'}
                    ${isSelected ? 'bg-indigo-50' : ''}`}
                >
                  <span className="font-medium text-neutral-800">{s.name}</span>
                  <div className="flex items-center gap-3">
                    {submitted && score && (
                      <span className="font-semibold text-indigo-700">
                        {score.correct} / {score.total}점
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${submitted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {submitted ? '제출완료' : '미제출'}
                    </span>
                    {submitted && <span className="text-xs text-neutral-400">{isSelected ? '▲' : '▼'}</span>}
                  </div>
                </button>

                {isSelected && selectedResponse && (
                  <div className="border-t border-neutral-100 px-4 py-3 space-y-2 bg-neutral-50">
                    <p className="text-xs font-semibold text-neutral-500 mb-2">
                      제출: {new Date(selectedResponse.submittedAt!).toLocaleString('ko-KR')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {questions.map((q) => {
                        const studentAns = selectedResponse.answers[String(q.number)];
                        const correctAns = q.answer?.trim().slice(0, 1);
                        const isObjective = q.type !== '서술형';
                        const isCorrect = isObjective && studentAns === correctAns;
                        const isWrong = isObjective && studentAns && studentAns !== correctAns;

                        return (
                          <div key={q.number} className={`rounded-lg border p-2.5 text-xs space-y-0.5
                            ${isCorrect ? 'border-green-200 bg-green-50' : isWrong ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-neutral-600">#{q.number}</span>
                              <span className={`rounded px-1 py-0.5 text-[10px] font-medium
                                ${isCorrect ? 'bg-green-100 text-green-700' : isWrong ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                {isCorrect ? '정답' : isWrong ? '오답' : '서술형'}
                              </span>
                            </div>
                            <p className="text-neutral-500">{q.type}</p>
                            <p className="font-medium text-neutral-800">
                              학생: {studentAns || '—'} {isObjective && <span className="text-neutral-400">/ 정답: {correctAns}</span>}
                            </p>
                            {!isObjective && studentAns && (
                              <p className="text-neutral-600 mt-1 line-clamp-2">{studentAns}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
