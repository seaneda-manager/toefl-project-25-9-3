'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

type Question = {
  id: string;
  number: number;
  type: string;
  stem: string;
  choices: { id: string; text: string; correct: boolean }[];
};

type Track = {
  id: string;
  taskKind: string;
  title: string;
  transcript: string;
  audioUrl: string;
  questions: Question[];
};

type TestData = {
  meta: { id: string; label: string };
  hard: { tracks: Track[] };
  easy: { tracks: Track[] };
};

type ResultData = {
  module1: { answers: Record<string, number> };
  module2: { answers: Record<string, number>; mode: string };
};

export default function ReviewPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestData | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<{
    questionId: string;
    trackTitle: string;
    question: Question;
    transcript: string;
    audioUrl: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const testRes = await fetch(`/api/admin/updated-listening/${testId}`);
      const testData = await testRes.json();
      setTest(testData.payload);

      const resultData = sessionStorage.getItem(`test-${testId}-results`);
      if (resultData) {
        setResults(JSON.parse(resultData));
      }
    };
    loadData();
  }, [testId]);

  if (!test || !results) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }

  // Flatten all questions with module info
  const allQuestions = [
    ...test.hard.tracks.flatMap(t =>
      t.questions.map(q => ({
        ...q,
        trackTitle: t.title,
        transcript: t.transcript,
        audioUrl: t.audioUrl,
        module: 1,
      }))
    ),
    ...test[results.module2.mode as 'hard' | 'easy'].tracks.flatMap(t =>
      t.questions.map(q => ({
        ...q,
        trackTitle: t.title,
        transcript: t.transcript,
        audioUrl: t.audioUrl,
        module: 2,
      }))
    ),
  ];

  const correctQuestions = allQuestions.filter(q => {
    const answers = q.module === 1 ? results.module1.answers : results.module2.answers;
    const selectedIdx = answers[q.id];
    return selectedIdx !== undefined && q.choices[selectedIdx]?.correct;
  });

  const incorrectQuestions = allQuestions.filter(q => {
    const answers = q.module === 1 ? results.module1.answers : results.module2.answers;
    const selectedIdx = answers[q.id];
    return selectedIdx !== undefined && !q.choices[selectedIdx]?.correct;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900">📖 오답 리뷰</h1>
          <p className="text-sm text-gray-500 mt-1">
            정답: {correctQuestions.length} · 오답: {incorrectQuestions.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Correct Answers */}
        {correctQuestions.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              ✅ 정답한 문제 ({correctQuestions.length})
            </h2>
            <div className="space-y-2 rounded-lg bg-emerald-50 p-4 border border-emerald-200">
              {correctQuestions.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {q.number}. {q.stem.substring(0, 50)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{q.trackTitle}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                    {q.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incorrect Answers */}
        {incorrectQuestions.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              ❌ 오답한 문제 ({incorrectQuestions.length})
            </h2>
            <div className="space-y-2">
              {incorrectQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() =>
                    setSelectedQuestion({
                      questionId: q.id,
                      trackTitle: q.trackTitle,
                      question: q,
                      transcript: q.transcript,
                      audioUrl: q.audioUrl,
                    })
                  }
                  className="w-full rounded-lg bg-white p-4 border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {q.number}. {q.stem.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{q.trackTitle}</p>
                    </div>
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded">
                      {q.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedQuestion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuestion(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 border-b bg-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">문제 {selectedQuestion.question.number}</h2>
                <p className="text-sm text-gray-500">{selectedQuestion.trackTitle}</p>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Question */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">문제</h3>
                <p className="text-gray-700">{selectedQuestion.question.stem}</p>
              </div>

              {/* Audio Player */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">다시 듣기</h3>
                <audio
                  ref={audioRef}
                  src={selectedQuestion.audioUrl}
                  controls
                  className="w-full rounded-lg"
                />
              </div>

              {/* Script */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">스크립트</h3>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedQuestion.transcript}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">설명</h3>
                <div className="space-y-3">
                  {selectedQuestion.question.choices.map((choice, idx) => (
                    <div
                      key={choice.id}
                      className={`rounded-lg p-3 text-sm ${
                        choice.correct
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        ({String.fromCharCode(65 + idx)}) {choice.text}
                        {choice.correct && ' ✅ 정답'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocabulary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">어휘</h3>
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
                  <p className="text-gray-500">어휘 정보는 나중에 추가됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
