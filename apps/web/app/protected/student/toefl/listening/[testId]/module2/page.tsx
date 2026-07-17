'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

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
  audioSeconds: number;
  testingSeconds: number;
};

type Test = {
  meta: { id: string; label: string };
  hard: { tracks: Track[] };
  easy: { tracks: Track[] };
};

export default function Module2Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const mode = (searchParams.get('mode') || 'hard') as 'hard' | 'easy';

  const [test, setTest] = useState<Test | null>(null);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await fetch(`/api/admin/updated-listening/${testId}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        setTest(data.payload);
      } catch (err) {
        console.error('Failed to load test:', err);
      }
    };
    loadTest();
  }, [testId]);

  const tracks = test?.[mode]?.tracks || [];
  const currentTrack = tracks[currentTrackIdx];
  const currentQuestion = currentTrack?.questions[currentQuestionIdx];
  const totalQuestions = tracks.reduce((sum, t) => sum + t.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  // Play audio and start timer
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const playAudio = async () => {
      setIsPlaying(true);
      audioRef.current!.src = currentTrack.audioUrl;
      audioRef.current!.play().catch(err => console.error('Audio play failed:', err));

      const duration = currentTrack.audioSeconds + currentTrack.testingSeconds;
      setTimeLeft(duration);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const timer = setTimeout(playAudio, 500);
    return () => clearTimeout(timer);
  }, [currentTrackIdx, currentQuestionIdx]);

  const selectAnswer = (choiceIdx: number) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: choiceIdx,
    }));
  };

  const handleNext = () => {
    if (!currentTrack) return;

    // Move to next question in current track
    if (currentQuestionIdx < currentTrack.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      return;
    }

    // Move to next track
    if (currentTrackIdx < tracks.length - 1) {
      setCurrentTrackIdx(prev => prev + 1);
      setCurrentQuestionIdx(0);
      return;
    }

    // Module 2 complete → go to results
    submitModule2();
  };

  const submitModule2 = async () => {
    // Calculate score
    let correctCount = 0;
    tracks.forEach(track => {
      track.questions.forEach(q => {
        const selectedIdx = answers[q.id];
        if (selectedIdx !== undefined && q.choices[selectedIdx]?.correct) {
          correctCount++;
        }
      });
    });

    const module1Data = JSON.parse(sessionStorage.getItem(`test-${testId}-module1`) || '{}');

    // Store combined results
    sessionStorage.setItem(`test-${testId}-results`, JSON.stringify({
      module1: module1Data,
      module2: { answers, correctCount, totalQuestions, mode },
      combinedCorrect: (module1Data.correctCount || 0) + correctCount,
      combinedTotal: (module1Data.totalQuestions || 0) + totalQuestions,
    }));

    router.push(`/student/toefl/listening/${testId}/results`);
  };

  if (!test || !currentTrack || !currentQuestion) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }

  const selectedIdx = answers[currentQuestion.id];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                TOEFL Listening - Module 2 {mode === 'hard' ? '(Hard)' : '(Easy)'}
              </h1>
              <p className="text-xs text-gray-500">
                {currentTrackIdx + 1}/{tracks.length} · 문제 {answeredCount}/{totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-indigo-600">{timeLeft}초</div>
              <p className="text-xs text-gray-500">남은 시간</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Image (placeholder) */}
          <div className="col-span-1 flex items-center justify-center rounded-lg bg-gray-100">
            <div className="text-center text-gray-500">
              <p className="text-4xl">🎧</p>
              <p className="mt-2 text-sm">{currentTrack.taskKind}</p>
            </div>
          </div>

          {/* Right: Question & Choices */}
          <div className="col-span-2 space-y-6">
            {/* Audio (hidden) */}
            <audio ref={audioRef} />

            {/* Playback status */}
            {isPlaying && (
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                🔊 음성이 재생 중입니다. 잠깐만 기다려주세요...
              </div>
            )}

            {/* Question */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">{currentQuestion.stem}</h2>

              {/* Choices */}
              <div className="space-y-2">
                {currentQuestion.choices.map((choice, idx) => (
                  <button
                    key={choice.id}
                    onClick={() => selectAnswer(idx)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition ${
                      selectedIdx === idx
                        ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">
                      <span className="font-semibold">({String.fromCharCode(65 + idx)})</span> {choice.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={selectedIdx === undefined}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              다음 문제 →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
