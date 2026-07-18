'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDrillStore } from '../_hooks/useDrillStore';
import { useEloRating } from '../_hooks/useEloRating';

/**
 * Drill 세션 페이지
 * - 문제 표시
 * - 선택지 선택
 * - 즉시 점수 표시 (로컬 STT)
 * - 게이미피케이션 UI
 */

export default function DrillSessionPage() {
  const router = useRouter();
  const {
    currentSession,
    currentItem,
    gameState,
    eloRating,
    submitAnswer,
    nextItem,
    pauseDrill,
    endDrill,
  } = useDrillStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 세션이 없으면 홈으로
  useEffect(() => {
    if (!currentSession || !currentItem) {
      router.push('/updated-speaking/drill');
    }
  }, [currentSession, currentItem, router]);

  if (!currentSession || !currentItem) {
    return null;
  }

  const handleSelectAnswer = (optionId: string) => {
    if (!submitted) {
      setSelectedAnswer(optionId);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correct = currentItem.options?.find((o) => o.id === selectedAnswer)
      ?.isCorrect;

    setSubmitted(true);
    setIsCorrect(correct || false);

    // 로컬 STT 점수 계산 (더미)
    const responseTime = Math.random() * 5000 + 1000;

    // 답변 제출
    submitAnswer(
      currentItem.options?.find((o) => o.id === selectedAnswer)?.text || '',
      correct || false,
      responseTime
    );

    // 피드백 표시
    setTimeout(() => {
      setShowFeedback(true);
    }, 300);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setShowFeedback(false);
    nextItem();
  };

  const handlePause = () => {
    pauseDrill();
    router.push('/updated-speaking/drill');
  };

  const currentIndex = currentSession.currentItemIndex + 1;
  const totalItems = currentSession.totalItems;
  const progress = (currentIndex / totalItems) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 헤더 */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1">
                문제 {currentIndex}/{totalItems}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={handlePause}
              className="ml-6 text-slate-400 hover:text-white transition"
            >
              ⏸ 일시정지
            </button>
          </div>

          {/* 게이미피케이션 헤더 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                🔥 {gameState.combo}
              </div>
              <div className="text-xs text-slate-400">연속</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {gameState.correctAnswers}
              </div>
              <div className="text-xs text-slate-400">정답</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(gameState.successRate)}%
              </div>
              <div className="text-xs text-slate-400">성공률</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(eloRating.currentRating)}
              </div>
              <div className="text-xs text-slate-400">레이팅</div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 문제 */}
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentItem.question}
          </h2>

          {/* 음성 재생 (있으면) */}
          {currentItem.audioUrl && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <button className="flex items-center gap-3 text-white hover:text-blue-400 transition">
                <span className="text-2xl">🔊</span>
                <span>음성 재생</span>
              </button>
              <div className="mt-3 bg-slate-900 p-3 rounded text-sm text-slate-300">
                <div className="h-12 bg-slate-800 rounded flex items-center justify-center">
                  ▓▓▓▓▓░░░░░ 파형 (더미)
                </div>
              </div>
            </div>
          )}

          {/* 선택지 */}
          <div className="space-y-3">
            {currentItem.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={submitted}
                className={`
                  w-full p-4 rounded-lg text-left transition
                  border-2 font-semibold
                  ${
                    selectedAnswer === option.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-600 bg-slate-700/20 hover:border-slate-500'
                  }
                  ${
                    submitted && option.isCorrect
                      ? 'border-green-500 bg-green-500/20'
                      : ''
                  }
                  ${
                    submitted && selectedAnswer === option.id && !option.isCorrect
                      ? 'border-red-500 bg-red-500/20'
                      : ''
                  }
                  disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{option.text}</span>
                  {submitted && option.isCorrect && <span>✓</span>}
                  {submitted &&
                    selectedAnswer === option.id &&
                    !option.isCorrect && <span>✗</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 제출 버튼 */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
          >
            제출
          </button>
        ) : (
          <div className="space-y-4">
            {/* 피드백 */}
            {showFeedback && (
              <div
                className={`
                border-2 rounded-lg p-4
                ${
                  isCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                }
              `}
              >
                <h3
                  className={`
                  font-bold mb-2
                  ${isCorrect ? 'text-green-400' : 'text-red-400'}
                `}
                >
                  {isCorrect ? '✓ 정답입니다!' : '✗ 오답입니다.'}
                </h3>
                <p className="text-slate-300 mb-3">{currentItem.explanation}</p>
                <div className="bg-slate-800 p-3 rounded text-sm">
                  <p className="text-slate-400 mb-2">💡 팁:</p>
                  <ul className="space-y-1">
                    {currentItem.tips.map((tip, i) => (
                      <li key={i} className="text-slate-300">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Elo 변화 표시 */}
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">레이팅 변화:</span>
                    <span
                      className={
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {isCorrect ? '+' : '-'}16 점
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-400">새 레이팅:</span>
                    <span className="text-yellow-400 font-bold">
                      {Math.round(eloRating.currentRating)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 다음 버튼 */}
            <button
              onClick={handleNext}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition"
            >
              {currentIndex >= totalItems ? '완료' : '다음 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
