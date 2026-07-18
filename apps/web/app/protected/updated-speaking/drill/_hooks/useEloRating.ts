/**
 * Elo 레이팅 시스템
 * - 체스 Elo 시스템 기반
 * - 정답: +16점, 오답: -16점
 * - 적응형 난이도 결정
 */

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

interface EloConfig {
  K_FACTOR: number; // 기본 32, 우리는 16 사용 (변화 민감도)
  baseRating: number; // 기본값: 1500
  minRating: number; // 최소값: 1000
  maxRating: number; // 최대값: 2000
}

interface DifficultyThresholds {
  easy: { min: number; max: number };
  medium: { min: number; max: number };
  hard: { min: number; max: number };
}

const DEFAULT_CONFIG: EloConfig = {
  K_FACTOR: 16,
  baseRating: 1500,
  minRating: 1000,
  maxRating: 2000,
};

const DIFFICULTY_THRESHOLDS: DifficultyThresholds = {
  easy: { min: 1000, max: 1300 },
  medium: { min: 1300, max: 1700 },
  hard: { min: 1700, max: 2000 },
};

/**
 * Elo 알고리즘 계산
 * 정답 시: newRating = currentRating + K * (1 - expectedScore)
 * 오답 시: newRating = currentRating - K * expectedScore
 */
export function calculateEloChange(
  currentRating: number,
  opponentRating: number, // 문제의 난이도 레이팅
  isCorrect: boolean,
  kFactor: number = DEFAULT_CONFIG.K_FACTOR
): { newRating: number; change: number } {
  // Expected score 계산 (0-1 범위)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));

  // 새로운 레이팅 계산
  const change = isCorrect
    ? kFactor * (1 - expectedScore)
    : -kFactor * expectedScore;

  let newRating = currentRating + change;

  // 범위 제한
  newRating = Math.max(
    DEFAULT_CONFIG.minRating,
    Math.min(DEFAULT_CONFIG.maxRating, newRating)
  );

  return {
    newRating: Math.round(newRating),
    change: Math.round(change),
  };
}

/**
 * 현재 레이팅에 따른 난이도 결정
 * - 1000-1300: EASY
 * - 1300-1700: MEDIUM
 * - 1700-2000: HARD
 */
export function getDifficultyByRating(rating: number): DifficultyLevel {
  if (rating < DIFFICULTY_THRESHOLDS.medium.min) return 'EASY';
  if (rating < DIFFICULTY_THRESHOLDS.hard.min) return 'MEDIUM';
  return 'HARD';
}

/**
 * 난이도에 따른 문제 풀이 추정 성공률
 * 난이도가 높을수록 실패 확률이 높음
 */
export function getExpectedSuccessRate(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case 'EASY':
      return 0.8; // 80% 성공 예상
    case 'MEDIUM':
      return 0.5; // 50% 성공 예상
    case 'HARD':
      return 0.2; // 20% 성공 예상
    default:
      return 0.5;
  }
}

/**
 * 점수 범위 (1200-1800)에 따른 텍스트 레이블
 */
export function getRatingLabel(rating: number): string {
  if (rating < 1200) return '초급자';
  if (rating < 1350) return '하 중급';
  if (rating < 1500) return '중 중급';
  if (rating < 1650) return '상 중급';
  if (rating < 1800) return '고급';
  return '최고급';
}

/**
 * 연속 정답에 따른 보너스 (선택)
 * - 3연속: +5점
 * - 5연속: +10점
 * - 10연속: +20점
 */
export function getComboBonus(combo: number): number {
  if (combo >= 10) return 20;
  if (combo >= 5) return 10;
  if (combo >= 3) return 5;
  return 0;
}

/**
 * Hook: Elo 레이팅 관리
 */
export function useEloRating(initialRating: number = DEFAULT_CONFIG.baseRating) {
  const [rating, setRating] = React.useState(initialRating);
  const [history, setHistory] = React.useState<Array<{ date: Date; rating: number }>>([]);

  const updateRating = (isCorrect: boolean, comboBonus: number = 0) => {
    const difficulty = getDifficultyByRating(rating);
    // 문제의 난이도에 따른 레이팅 설정 (Medium은 1500)
    const difficultyRating =
      difficulty === 'EASY' ? 1200 : difficulty === 'MEDIUM' ? 1500 : 1800;

    const { newRating, change } = calculateEloChange(
      rating,
      difficultyRating,
      isCorrect,
      DEFAULT_CONFIG.K_FACTOR
    );

    const finalRating = newRating + comboBonus;

    setRating(finalRating);
    setHistory([...history, { date: new Date(), rating: finalRating }]);

    return {
      newRating: finalRating,
      change: change + comboBonus,
      difficulty: getDifficultyByRating(finalRating),
    };
  };

  const getCurrentDifficulty = (): DifficultyLevel => {
    return getDifficultyByRating(rating);
  };

  const getStats = () => ({
    currentRating: Math.round(rating),
    label: getRatingLabel(rating),
    difficulty: getCurrentDifficulty(),
    expectedSuccessRate: getExpectedSuccessRate(getCurrentDifficulty()),
    history,
  });

  return {
    rating: Math.round(rating),
    updateRating,
    getCurrentDifficulty,
    getStats,
    getDifficultyByRating,
    getRatingLabel,
  };
}

import React from 'react';
