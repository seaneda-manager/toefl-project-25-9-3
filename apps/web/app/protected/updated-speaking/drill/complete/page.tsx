'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDrillStore } from '../_hooks/useDrillStore';
import Link from 'next/link';

/**
 * Drill 완료 페이지
 * - 세션 통계
 * - Elo 변화
 * - Spaced Repetition 일정
 * - Review/다음 Drill 이동
 */

export default function DrillCompletePage() {
  const router = useRouter();
  const { currentSession, gameState, eloRating, saveToLocalStorage } =
    useDrillStore();

  useEffect(() => {
    if (!currentSession) {
      router.push('/updated-speaking/drill');
      return;
    }

    if (currentSession.isActive) {
      router.push('/updated-speaking/drill/session');
      return;
    }

    // 세션 데이터 저장
    saveToLocalStorage();
  }, [currentSession, router, saveToLocalStorage]);

  if (!currentSession) return null;

  const totalTime = currentSession.results.length * 5; // 대략 5초/문제
  const accuracyImprovement =
    currentSession.results.length > 1
      ? gameState.successRate > 70
        ? '+높음'
        : '정상'
      : '-';

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 축하 메시지 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🎉</h1>
          <h2 className="text-3xl font-bold text-white mb-2">드릴 완료!</h2>
          <p className="text-slate-300">
            멋진 성과를 보여주셨습니다. 계속 이렇게 나가세요!
          </p>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {gameState.correctAnswers}/{currentSession.totalItems}
            </div>
            <div className="text-sm text-slate-400 mt-2">정답 수</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {Math.round(gameState.successRate)}%
            </div>
            <div className="text-sm text-slate-400 mt-2">성공률</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              🔥 {gameState.bestStreak}
            </div>
            <div className="text-sm text-slate-400 mt-2">최고 연속</div>
          </div>

          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400">~{totalTime}분</div>
            <div className="text-sm text-slate-400 mt-2">소요 시간</div>
          </div>
        </div>

        {/* Elo 변화 */}
        <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">레이팅 변화</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">시작 레이팅</span>
              <span className="font-bold text-slate-300">
                {Math.round(
                  eloRating.currentRating -
                    (eloRating.ratingHistory[eloRating.ratingHistory.length - 1]
                      ?.rating || 0)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">최종 레이팅</span>
              <span className="font-bold text-yellow-400 text-lg">
                {Math.round(eloRating.currentRating)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-blue-500/20 border border-blue-400 rounded p-3">
              <span className="text-white font-semibold">레이팅 변화</span>
              <span className="font-bold text-blue-400 text-lg">
                +
                {Math.round(
                  eloRating.ratingHistory[eloRating.ratingHistory.length - 1]
                    ?.rating || 0
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800 rounded text-sm text-slate-300">
            <p>💡 팁: 다음 세션에서 더 어려운 문제를 풀게 됩니다.</p>
          </div>
        </div>

        {/* Spaced Repetition */}
        <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">복습 일정</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">다음 복습</span>
              <span className="font-bold text-slate-300">
                {nextReviewDate.toLocaleDateString('ko-KR')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">복습 간격</span>
              <span className="font-bold text-slate-300">3일</span>
            </div>

            <div className="bg-purple-500/20 border border-purple-400 rounded p-3">
              <p className="text-sm text-purple-100">
                ✓ 이 세션을 3일 후에 다시 복습하는 것이 좋습니다.
              </p>
            </div>
          </div>

          <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold transition">
            📅 일정에 추가
          </button>
        </div>

        {/* 행동 버튼들 */}
        <div className="space-y-3">
          <Link
            href="/updated-speaking/review"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-center transition"
          >
            📊 상세 분석 보기 (Review)
          </Link>

          <button
            onClick={() => router.push('/updated-speaking/drill')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition"
          >
            🎮 다음 드릴 선택
          </button>

          <button
            onClick={() => router.push('/updated-speaking/practice')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition"
          >
            🏋️ 실전 연습으로 이동
          </button>
        </div>

        {/* 추천 정보 */}
        <div className="mt-8 pt-6 border-t border-slate-600">
          <h4 className="text-white font-semibold mb-3">📈 다음 추천</h4>
          <div className="bg-slate-800/50 p-4 rounded text-sm text-slate-300">
            <ul className="space-y-2">
              <li>
                ✓ 취약한 음소로 {currentSession.config.drillType} 드릴 반복
              </li>
              <li>✓ Waveform Sync를 통해 발음 비교 (Review 모듈)</li>
              <li>✓ 실전 연습으로 시험 환경 체험</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
