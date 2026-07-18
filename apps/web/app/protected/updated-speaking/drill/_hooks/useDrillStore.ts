/**
 * Drill 모듈 전역 상태 관리 (Zustand)
 * - 현재 진행 중인 드릴 세션
 * - 게이미피케이션 상태
 * - IndexedDB 캐싱
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DrillConfig,
  DrillSession,
  DrillItem,
  DrillResult,
  GameState,
  EloRating,
} from './types';

interface DrillStore {
  // 상태
  currentSession: DrillSession | null;
  currentItem: DrillItem | null;
  gameState: GameState;
  eloRating: EloRating;

  // 액션
  initDrill: (config: DrillConfig, items: DrillItem[]) => void;
  submitAnswer: (
    answer: string,
    isCorrect: boolean,
    responseTime: number
  ) => void;
  nextItem: () => void;
  pauseDrill: () => void;
  resumeDrill: () => void;
  endDrill: () => void;
  resetDrill: () => void;

  // 게이미피케이션
  updateCombo: (isCorrect: boolean) => void;
  getGameState: () => GameState;

  // Elo
  updateEloRating: (
    isCorrect: boolean,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ) => void;

  // 캐싱
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const initialGameState: GameState = {
  combo: 0,
  successRate: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalAttempts: 0,
  correctAnswers: 0,
};

const initialEloRating: EloRating = {
  currentRating: 1500,
  nextItemDifficulty: 'MEDIUM',
  ratingHistory: [],
  lastUpdate: new Date(),
};

export const useDrillStore = create<DrillStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentSession: null,
      currentItem: null,
      gameState: initialGameState,
      eloRating: initialEloRating,

      // 드릴 초기화
      initDrill: (config: DrillConfig, items: DrillItem[]) => {
        const sessionId = `drill_${Date.now()}`;
        const session: DrillSession = {
          sessionId,
          config,
          startTime: new Date(),
          currentItemIndex: 0,
          totalItems: items.length,
          itemsCompleted: 0,
          gameState: { ...initialGameState },
          adaptiveDifficulty: {
            enabled: config.difficultyProgression === 'ADAPTIVE',
            currentRating: 1500,
            nextItemDifficulty: 'MEDIUM',
            algorithm: 'ELO',
            K_FACTOR: 16,
          },
          results: [],
          isActive: true,
          isPaused: false,
          cachedAt: new Date(),
        };

        set({
          currentSession: session,
          currentItem: items[0],
          gameState: initialGameState,
          eloRating: initialEloRating,
        });
      },

      // 답변 제출
      submitAnswer: (answer: string, isCorrect: boolean, responseTime: number) => {
        const { currentSession, currentItem, gameState, eloRating } = get();

        if (!currentSession || !currentItem) return;

        // 게이미피케이션 업데이트
        const newCombo = isCorrect ? gameState.combo + 1 : 0;
        const newCorrectAnswers = isCorrect
          ? gameState.correctAnswers + 1
          : gameState.correctAnswers;
        const newTotalAttempts = gameState.totalAttempts + 1;
        const newSuccessRate = (newCorrectAnswers / newTotalAttempts) * 100;
        const newBestStreak = Math.max(gameState.bestStreak, newCombo);

        // Elo 업데이트
        const difficulty = get().gameState
          ? 'MEDIUM'
          : 'MEDIUM';
        const expectedScore =
          1 /
          (1 +
            Math.pow(
              10,
              (difficulty === 'EASY'
                ? 1200
                : difficulty === 'MEDIUM'
                  ? 1500
                  : 1800) - eloRating.currentRating
            ) / 400);

        const K_FACTOR = 16;
        const eloChange = isCorrect
          ? K_FACTOR * (1 - expectedScore)
          : -K_FACTOR * expectedScore;

        const newEloRating = Math.round(
          Math.max(1000, Math.min(2000, eloRating.currentRating + eloChange))
        );

        // 결과 기록
        const result: DrillResult = {
          itemId: currentItem.id,
          userAnswer: answer,
          isCorrect,
          status: isCorrect ? 'CORRECT' : 'INCORRECT',
          timestamp: new Date(),
          responseTime,
          confidence: isCorrect ? 0.95 : 0.5,
          eloChange: Math.round(eloChange),
          newRating: newEloRating,
        };

        currentSession.results.push(result);
        currentSession.itemsCompleted++;

        set({
          gameState: {
            combo: newCombo,
            successRate: newSuccessRate,
            currentStreak: newCombo,
            bestStreak: newBestStreak,
            totalAttempts: newTotalAttempts,
            correctAnswers: newCorrectAnswers,
          },
          eloRating: {
            ...eloRating,
            currentRating: newEloRating,
            lastUpdate: new Date(),
            ratingHistory: [
              ...eloRating.ratingHistory,
              { date: new Date(), rating: newEloRating },
            ],
          },
          currentSession,
        });
      },

      // 다음 항목
      nextItem: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const nextIndex = currentSession.currentItemIndex + 1;
        if (nextIndex < currentSession.totalItems) {
          // 다음 항목 가져오기 (실제로는 items 배열에서)
          set({
            currentSession: {
              ...currentSession,
              currentItemIndex: nextIndex,
            },
          });
        } else {
          // 드릴 완료
          get().endDrill();
        }
      },

      // 드릴 일시정지
      pauseDrill: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            isPaused: true,
            pausedAt: new Date(),
          },
        });
      },

      // 드릴 재개
      resumeDrill: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            isPaused: false,
            pausedAt: undefined,
          },
        });
      },

      // 드릴 종료
      endDrill: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            isActive: false,
            lastSyncedAt: new Date(),
          },
        });
      },

      // 드릴 초기화
      resetDrill: () => {
        set({
          currentSession: null,
          currentItem: null,
          gameState: initialGameState,
          eloRating: initialEloRating,
        });
      },

      // 게이미피케이션 업데이트
      updateCombo: (isCorrect: boolean) => {
        const { gameState } = get();
        const newCombo = isCorrect ? gameState.combo + 1 : 0;

        set({
          gameState: {
            ...gameState,
            combo: newCombo,
            currentStreak: newCombo,
            bestStreak: Math.max(gameState.bestStreak, newCombo),
          },
        });
      },

      // 게임 상태 조회
      getGameState: () => get().gameState,

      // Elo 업데이트 (별도 함수)
      updateEloRating: (isCorrect: boolean, difficulty: string) => {
        const { eloRating } = get();
        // 실제 Elo 계산은 submitAnswer에서 수행
      },

      // 로컬 스토리지 저장
      saveToLocalStorage: () => {
        const { currentSession, gameState, eloRating } = get();
        const data = { currentSession, gameState, eloRating };
        localStorage.setItem('drillSession', JSON.stringify(data));
      },

      // 로컬 스토리지 로드
      loadFromLocalStorage: () => {
        const data = localStorage.getItem('drillSession');
        if (data) {
          const { currentSession, gameState, eloRating } = JSON.parse(data);
          set({ currentSession, gameState, eloRating });
        }
      },
    }),
    {
      name: 'drill-store', // localStorage 키 이름
      version: 1,
    }
  )
);
