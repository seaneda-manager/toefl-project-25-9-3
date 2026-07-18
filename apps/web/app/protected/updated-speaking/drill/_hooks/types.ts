/**
 * Drill 모듈 핵심 타입 정의
 * - DrillConfig: 드릴 설정
 * - DrillSession: 진행 중인 드릴 세션
 * - DrillItem: 개별 드릴 문제
 * - GameState: 게이미피케이션 상태
 */

export type DrillType = 'PHONEME' | 'STRESS' | 'FLUENCY' | 'VOCABULARY' | 'GRAMMAR';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type AnswerStatus = 'CORRECT' | 'INCORRECT' | 'PARTIAL';

// 드릴 설정
export interface DrillConfig {
  drillType: DrillType;
  limitCount: number; // 20, 50, 100 등
  targetItems?: string[]; // 특정 항목만 집중
  difficultyProgression: 'FIXED' | 'ADAPTIVE';
  language: 'KO' | 'EN'; // 한국어/영어 설명
}

// 게이미피케이션 상태
export interface GameState {
  combo: number; // 연속 정답 수
  successRate: number; // 0-100
  currentStreak: number; // 현재 연속
  bestStreak: number; // 최고 연속
  totalAttempts: number; // 총 시도 횟수
  correctAnswers: number; // 정답 수
}

// Elo 레이팅 시스템
export interface EloRating {
  currentRating: number; // 1200-1800 (1500 기본)
  nextItemDifficulty: DifficultyLevel;
  ratingHistory: { date: Date; rating: number }[];
  lastUpdate: Date;
}

// 적응형 난이도
export interface AdaptiveDifficulty {
  enabled: boolean;
  currentRating: number;
  nextItemDifficulty: DifficultyLevel;
  algorithm: 'ELO'; // 향후 확장
  K_FACTOR: number; // 32 (기본값)
}

// Spaced Repetition
export interface SpacedRepetition {
  nextReviewDate: Date;
  reviewInterval: 'TODAY' | '3DAYS' | '7DAYS' | '14DAYS' | '30DAYS';
  reviewCount: number; // 복습 횟수
  priorityScore: number; // 0-100 (높을수록 우선)
}

// 개별 드릴 문제
export interface DrillItem {
  id: string;
  drillType: DrillType;
  difficulty: DifficultyLevel;

  // 문제 내용
  question: string; // "강세는 어디?"
  audioUrl?: string; // 원본 음성
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;

  // 정답 관련
  correctAnswer: string;
  explanation: string; // 한국어 설명
  tips: string[];

  // 트래킹
  attemptCount: number;
  lastAttemptDate?: Date;
}

// 드릴 결과
export interface DrillResult {
  itemId: string;
  userAnswer: string;
  isCorrect: boolean;
  status: AnswerStatus;
  timestamp: Date;
  responseTime: number; // ms

  // 음성 분석 (STT)
  confidence?: number; // 0-1
  wer?: number; // Word Error Rate

  // 점수 변화
  eloChange?: number; // +16 or -16
  newRating?: number;
}

// 드릴 세션 (진행 중)
export interface DrillSession {
  sessionId: string;
  config: DrillConfig;
  startTime: Date;

  // 진행 상황
  currentItemIndex: number;
  totalItems: number;
  itemsCompleted: number;

  // 게이미피케이션
  gameState: GameState;

  // 적응형 난이도
  adaptiveDifficulty?: AdaptiveDifficulty;

  // 결과 기록
  results: DrillResult[];

  // Spaced Repetition
  spacedRepetition?: SpacedRepetition;

  // 세션 상태
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: Date;

  // 로컬 캐싱용
  cachedAt: Date;
  lastSyncedAt?: Date;
}

// 드릴 통계
export interface DrillStats {
  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  averageAccuracy: number; // %
  averageResponseTime: number; // ms

  byType: Record<DrillType, {
    attempts: number;
    correct: number;
    accuracy: number;
  }>;

  byDifficulty: Record<DifficultyLevel, {
    attempts: number;
    correct: number;
    accuracy: number;
  }>;

  currentStreak: number;
  bestStreak: number;

  lastPracticeDate?: Date;
  nextRecommendedDate?: Date;
}

// IndexedDB에 저장할 구조
export interface CachedDrillData {
  sessionId: string;
  config: DrillConfig;
  results: DrillResult[];
  gameState: GameState;
  eloRating: EloRating;
  cachedAt: Date;
  synced: boolean;
}
