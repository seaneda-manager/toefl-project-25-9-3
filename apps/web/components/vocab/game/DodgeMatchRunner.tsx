"use client";

import React, { useState, useEffect, useRef } from "react";
import type { SessionWord } from "@/models/vocab/SessionWord";
import type { ComboChain, DodgeMatchSession, FallingWord, GameMode } from "./dodgematch.types";

type Props = {
  words: SessionWord[];
  onFinish: (score: number) => void;
};

const GAME_CONFIG = {
  initialLives: 3,
  characterSpeed: 20,
  gravityAcceleration: 0.3,
  fallingSpeed: 3,
  questionDuration: 3000,
};

const COMBO_MODES: GameMode[] = [
  "WORD_TO_MEANING",
  "PARTS_OF_SPEECH",
  "MATCHING_WORDS",
  "SENTENCE_CONTEXT",
];

export default function DodgeMatchRunner({ words, onFinish }: Props) {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<DodgeMatchSession>({
    level: 1,
    score: 0,
    lives: GAME_CONFIG.initialLives,
    maxLives: GAME_CONFIG.initialLives,
    comboChains: [],
    currentChain: null,
    wordQueue: words.map((w) => w.id),
    completedWords: new Set(),
    badges: [],
  });

  const [characterX, setCharacterX] = useState(50);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCharacterX((prev) => Math.max(0, prev - GAME_CONFIG.characterSpeed));
      } else if (e.key === "ArrowRight") {
        setCharacterX((prev) => Math.min(100, prev + GAME_CONFIG.characterSpeed));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 게임 루프
  useEffect(() => {
    if (gameOver || !gameRef.current) return;

    const gameLoop = setInterval(() => {
      // 떨어지는 단어들 업데이트
      setFallingWords((prev) => {
        const updated = prev.map((w) => ({
          ...w,
          y: w.y + w.velocityY,
          velocityY: w.velocityY + GAME_CONFIG.gravityAcceleration,
        }));

        // 화면 밖으로 나간 단어 처리
        return updated.filter((w) => {
          if (w.y > 100) {
            // 오답 또는 받지 못한 단어
            setGameState((prev) => ({
              ...prev,
              lives: Math.max(0, prev.lives - 1),
            }));
            return false;
          }
          return true;
        });
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameOver]);

  // 게임 종료 체크
  useEffect(() => {
    if (gameState.lives <= 0) {
      setGameOver(true);
      onFinish(gameState.score);
    }
  }, [gameState.lives, gameState.score, onFinish]);

  return (
    <div
      ref={gameRef}
      className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col overflow-hidden"
    >
      {/* 헤더 */}
      <div className="bg-black/30 px-6 py-4 text-white flex justify-between">
        <div className="text-2xl font-bold">Level {gameState.level}</div>
        <div className="text-xl font-bold">{gameState.score} pts</div>
        <div className="text-xl font-bold">❤️ {gameState.lives}</div>
      </div>

      {/* 게임 영역 */}
      <div className="flex-1 relative">
        {/* 떨어지는 단어들 */}
        {fallingWords.map((word) => (
          <div
            key={word.id}
            className="absolute px-4 py-2 bg-white rounded-lg font-bold text-sm transition-all"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            {word.text}
          </div>
        ))}

        {/* 문제 패널 */}
        {currentQuestion && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md text-center">
              <div className="text-lg font-bold mb-4">{currentQuestion.question}</div>
              <div className="space-y-2">
                {currentQuestion.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    onClick={() => {
                      // 답변 처리 로직
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 캐릭터 */}
        <div
          className="absolute bottom-8 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl transition-all"
          style={{
            left: `${characterX}%`,
            transform: "translateX(-50%)",
          }}
        >
          🧑
        </div>
      </div>

      {/* 게임 오버 */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-4xl font-bold mb-4">Game Over!</div>
            <div className="text-2xl font-bold mb-4">Final Score: {gameState.score}</div>
            <button
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
              onClick={() => onFinish(gameState.score)}
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
