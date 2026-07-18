'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrillStore } from './_hooks/useDrillStore';
import { useEloRating } from './_hooks/useEloRating';
import type { DrillConfig, DrillItem } from './_hooks/types';

/**
 * Drill 모듈 메인 페이지
 * - 드릴 설정 선택
 * - 진행 중인 드릴 표시
 * - 게이미피케이션 UI
 */

// 더미 데이터: 실제로는 서버에서 받아옴
const SAMPLE_DRILL_ITEMS: DrillItem[] = [
  {
    id: 'drill_1',
    drillType: 'STRESS',
    difficulty: 'MEDIUM',
    question: '어느 단어의 강세 위치가 올바른가요?',
    audioUrl: '/audio/environmental.mp3',
    options: [
      { id: 'a', text: 'en-VAIR-on-mul-tul', isCorrect: true },
      { id: 'b', text: 'EN-vair-on-mul-tul', isCorrect: false },
      { id: 'c', text: 'en-vair-ON-mul-tul', isCorrect: false },
    ],
    correctAnswer: 'en-VAIR-on-mul-tul',
    explanation: '"environmental"의 강세는 두 번째 음절에 있습니다.',
    tips: ['음절을 명확히 구분하면서 발음하세요', '두 번째 음절을 크고 높게'],
    attemptCount: 0,
  },
  {
    id: 'drill_2',
    drillType: 'STRESS',
    difficulty: 'MEDIUM',
    question: '다음 단어의 올바른 강세를 찾아보세요.',
    options: [
      { id: 'a', text: 'IM-por-tant', isCorrect: false },
      { id: 'b', text: 'im-POR-tant', isCorrect: true },
      { id: 'c', text: 'im-por-TANT', isCorrect: false },
    ],
    correctAnswer: 'im-POR-tant',
    explanation: '"important"의 강세는 두 번째 음절에 있습니다.',
    tips: ['자연스럽게 발음하면서 강세를 느껴보세요'],
    attemptCount: 0,
  },
];

interface DrillSelectConfig {
  drillType: DrillConfig['drillType'];
  limitCount: number;
  description: string;
}

const DRILL_OPTIONS: DrillSelectConfig[] = [
  {
    drillType: 'STRESS',
    limitCount: 10,
    description: '단어 강세 위치 집중 훈련 (10분)',
  },
  {
    drillType: 'PHONEME',
    limitCount: 10,
    description: '음소 발음 정확도 훈련 (10분)',
  },
  {
    drillType: 'FLUENCY',
    limitCount: 10,
    description: '유창성 개선 훈련 (10분)',
  },
  {
    drillType: 'VOCABULARY',
    limitCount: 20,
    description: '어휘 다양성 훈련 (20분)',
  },
];

export default function DrillPage() {
  const router = useRouter();
  const {
    currentSession,
    gameState,
    eloRating,
    initDrill,
    resumeDrill,
    resetDrill,
  } = useDrillStore();
  const [showStart, setShowStart] = useState(!currentSession);
  const [loading, setLoading] = useState(false);

  // 기존 세션이 있으면 표시
  useEffect(() => {
    if (currentSession && !currentSession.isActive) {
      setShowStart(true);
    }
  }, [currentSession]);

  const handleStartDrill = (config: DrillSelectConfig) => {
    setLoading(true);
    try {
      const drillConfig: DrillConfig = {
        drillType: config.drillType,
        limitCount: config.limitCount,
        difficultyProgression: 'ADAPTIVE',
        language: 'KO',
      };

      initDrill(drillConfig, SAMPLE_DRILL_ITEMS);
      setShowStart(false);

      // 드릴 시작 페이지로 이동
      setTimeout(() => {
        router.push('/updated-speaking/drill/session');
      }, 500);
    } catch (error) {
      console.error('드릴 시작 오류:', error);
      setLoading(false);
    }
  };

  const handleResume = () => {
    resumeDrill();
    router.push('/updated-speaking/drill/session');
  };

  const handleNewDrill = () => {
    resetDrill();
    setShowStart(true);
  };

  if (showStart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🎮 Drill 모듈</h1>
            <p className="text-slate-300">
              취약점을 집중 훈련하세요. 적응형 난이도로 최고 효율을 경험하세요.
            </p>
          </div>

          {/* 기존 세션 복구 */}
          {currentSession && currentSession.isPaused && (
            <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2">⏸ 일시정지된 세션</h3>
              <p className="text-blue-100 text-sm mb-4">
                {currentSession.config.drillType} 드릴 진행 중
              </p>
              <button
                onClick={handleResume}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
              >
                계속하기
              </button>
            </div>
          )}

          {/* 드릴 선택 */}
          <div className="grid gap-4">
            {DRILL_OPTIONS.map((option) => (
              <button
                key={option.drillType}
                onClick={() => handleStartDrill(option)}
                disabled={loading}
                className="
                  bg-slate-700/50 hover:bg-slate-600/50
                  border-2 border-slate-600 hover:border-slate-500
                  rounded-lg p-4 text-left transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      {option.drillType === 'STRESS' && '🔊'}
                      {option.drillType === 'PHONEME' && '🗣️'}
                      {option.drillType === 'FLUENCY' && '⚡'}
                      {option.drillType === 'VOCABULARY' && '📚'}
                      {` ${option.description}`}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {option.drillType === 'STRESS' &&
                        '단어의 강세 위치를 정확히 발음하는 훈련'}
                      {option.drillType === 'PHONEME' &&
                        '각 음소를 명확히 발음하는 훈련'}
                      {option.drillType === 'FLUENCY' &&
                        '침묵 없이 매끄럽게 말하는 훈련'}
                      {option.drillType === 'VOCABULARY' &&
                        '다양한 어휘를 자연스럽게 사용하는 훈련'}
                    </p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
            ))}
          </div>

          {/* 통계 */}
          <div className="mt-8 bg-slate-700/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">📊 당신의 레이팅</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {Math.round(eloRating.currentRating)}
                </div>
                <div className="text-xs text-slate-400 mt-1">현재 레이팅</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {gameState.bestStreak}
                </div>
                <div className="text-xs text-slate-400 mt-1">최고 연속</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {Math.round(gameState.successRate)}%
                </div>
                <div className="text-xs text-slate-400 mt-1">성공률</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">드릴 로딩 중...</h1>
      </div>
    </div>
  );
}
