'use client';

import { useState, useTransition, useMemo } from 'react';
import { generateExamQuestions, type ExamQuestion } from '../_actions/generate';
import type { PassageFilter } from '../page';

const MONTH_LABEL: Record<number, string> = {
  4:  '1학기 중간 (4월)',
  7:  '1학기 기말 (7월)',
  10: '2학기 중간 (10월)',
  12: '2학기 기말 (12월)',
};

const GRADE_LABEL: Record<string, string> = {
  H1: '고1', H2: '고2', H3: '고3',
  M1: '중1', M2: '중2', M3: '중3',
};

type Props = { filters: PassageFilter[] };

export default function ExamGeneratorForm({ filters }: Props) {
  const schools = useMemo(() => [...new Set(filters.map((f) => f.school))].sort(), [filters]);
  const [school, setSchool] = useState(schools[0] ?? '');

  const grades = useMemo(
    () => [...new Set(filters.filter((f) => f.school === school).map((f) => f.grade))].sort(),
    [filters, school],
  );
  const [grade, setGrade] = useState(grades[0] ?? '');

  const years = useMemo(
    () => [...new Set(filters.filter((f) => f.school === school && f.grade === grade).map((f) => f.examYear))].sort((a, b) => b - a),
    [filters, school, grade],
  );
  const [examYear, setExamYear] = useState(years[0] ?? 0);

  const months = useMemo(
    () => [...new Set(filters.filter((f) => f.school === school && f.grade === grade && f.examYear === examYear).map((f) => f.examMonth))].sort(),
    [filters, school, grade, examYear],
  );
  const [examMonth, setExamMonth] = useState(months[0] ?? 0);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [error, setError]         = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSchoolChange(s: string) {
    setSchool(s);
    const newGrades = [...new Set(filters.filter((f) => f.school === s).map((f) => f.grade))].sort();
    const g = newGrades[0] ?? '';
    setGrade(g);
    const newYears = [...new Set(filters.filter((f) => f.school === s && f.grade === g).map((f) => f.examYear))].sort((a, b) => b - a);
    const y = newYears[0] ?? 0;
    setExamYear(y);
    const newMonths = [...new Set(filters.filter((f) => f.school === s && f.grade === g && f.examYear === y).map((f) => f.examMonth))].sort();
    setExamMonth(newMonths[0] ?? 0);
  }

  function handleGradeChange(g: string) {
    setGrade(g);
    const newYears = [...new Set(filters.filter((f) => f.school === school && f.grade === g).map((f) => f.examYear))].sort((a, b) => b - a);
    const y = newYears[0] ?? 0;
    setExamYear(y);
    const newMonths = [...new Set(filters.filter((f) => f.school === school && f.grade === g && f.examYear === y).map((f) => f.examMonth))].sort();
    setExamMonth(newMonths[0] ?? 0);
  }

  function handleYearChange(y: number) {
    setExamYear(y);
    const newMonths = [...new Set(filters.filter((f) => f.school === school && f.grade === grade && f.examYear === y).map((f) => f.examMonth))].sort();
    setExamMonth(newMonths[0] ?? 0);
  }

  function handleGenerate() {
    setError('');
    setQuestions([]);
    startTransition(async () => {
      const result = await generateExamQuestions(school, grade, examYear, examMonth);
      if (result.error) setError(result.error);
      else setQuestions(result.questions);
    });
  }

  const typeColor: Record<string, string> = {
    '글의 목적':   'bg-sky-100 text-sky-700',
    '심경':        'bg-violet-100 text-violet-700',
    '심경 변화':   'bg-violet-100 text-violet-700',
    '필자 주장':   'bg-indigo-100 text-indigo-700',
    '요지':        'bg-indigo-100 text-indigo-700',
    '주제':        'bg-indigo-100 text-indigo-700',
    '제목':        'bg-indigo-100 text-indigo-700',
    '내용 일치':   'bg-green-100 text-green-700',
    '내용 불일치': 'bg-green-100 text-green-700',
    '어법':        'bg-blue-100 text-blue-700',
    '어휘':        'bg-purple-100 text-purple-700',
    '빈칸 추론':   'bg-amber-100 text-amber-700',
    '빈칸추론':    'bg-amber-100 text-amber-700',
    '문단 순서':   'bg-rose-100 text-rose-700',
    '순서':        'bg-rose-100 text-rose-700',
    '문장 삽입':   'bg-pink-100 text-pink-700',
    '문장삽입':    'bg-pink-100 text-pink-700',
    '서술형':      'bg-orange-100 text-orange-700',
  };

  const examLabel = `${school} ${GRADE_LABEL[grade] ?? grade} ${examYear}년 ${MONTH_LABEL[examMonth] ?? `${examMonth}월`}`;

  return (
    <>
      {/* Controls */}
      <div className="print:hidden flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">학교</label>
          <select value={school} onChange={(e) => handleSchoolChange(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {schools.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">학년</label>
          <select value={grade} onChange={(e) => handleGradeChange(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {grades.map((g) => <option key={g} value={g}>{GRADE_LABEL[g] ?? g}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">연도</label>
          <select value={examYear} onChange={(e) => handleYearChange(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">시험 시기</label>
          <select value={examMonth} onChange={(e) => setExamMonth(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {months.map((m) => <option key={m} value={m}>{MONTH_LABEL[m] ?? `${m}월`}</option>)}
          </select>
        </div>

        <button onClick={handleGenerate} disabled={isPending || !school || !grade || !examYear || !examMonth}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
          {isPending ? (
            <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />생성 중...</>
          ) : '📝 예상문제 생성'}
        </button>

        {questions.length > 0 && (
          <>
            <button onClick={() => setShowAnswers(!showAnswers)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition">
              {showAnswers ? '🙈 정답 숨기기' : '👁️ 정답 보기'}
            </button>
            <button onClick={() => window.print()}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition">
              🖨️ 인쇄
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">{error}</div>
      )}

      {isPending && (
        <div className="print:hidden flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
          ))}
          <p className="text-center text-sm text-neutral-400">Claude가 30문항을 생성하고 있습니다. 약 30~60초 소요됩니다.</p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-6">
          <div className="hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold">{examLabel} 영어 예상문제</h2>
            <p className="text-sm text-gray-500 mt-1">총 {questions.length}문항 · 생성일: {new Date().toLocaleDateString('ko-KR')}</p>
          </div>

          {questions.map((q) => (
            <div key={q.number}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm print:border print:shadow-none print:rounded-none print:border-b print:border-x-0 print:border-t-0">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {q.number}
                </span>
                <div className="flex-1 space-y-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[q.type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {q.type}
                  </span>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>

                  {q.options && q.options.length > 0 && (
                    <ul className="space-y-1.5 pl-1">
                      {q.options.map((opt, i) => <li key={i} className="text-sm text-neutral-700">{opt}</li>)}
                    </ul>
                  )}

                  {q.type === '서술형' && (
                    <div className="hidden print:block border border-dashed border-neutral-300 rounded p-2 h-20 mt-2">
                      <span className="text-xs text-neutral-400">답안 작성란</span>
                    </div>
                  )}

                  <div className={`rounded-lg bg-indigo-50 border border-indigo-100 p-3 space-y-1 ${showAnswers ? '' : 'print:block hidden'}`}>
                    <p className="text-xs font-semibold text-indigo-700">정답: {q.answer}</p>
                    <p className="text-xs text-indigo-600 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
