// apps/web/components/vocab/PreScreenBoard.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  PreScreenItem,
  PreScreenAnswer,
  VocabWordCore,
} from "@/models/vocab";

type Props = {
  items: PreScreenItem[];
  vocabMap: Record<string, VocabWordCore>;
  onFinish: (answers: PreScreenAnswer[]) => void;
};

type QuizState = {
  open: boolean;
  wordId: string | null;
  source: PreScreenItem["source"] | null;
};

export default function PreScreenBoard({ items, vocabMap, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<PreScreenAnswer[]>([]);
  const [flash, setFlash] = useState<"known" | "unknown" | "idle">("idle");
  const [isLocked, setIsLocked] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>({
    open: false,
    wordId: null,
    source: null,
  });

  const total = items.length;
  const current = items[index];

  const progress = useMemo(
    () => (total === 0 ? 0 : Math.round((index / total) * 100)),
    [index, total],
  );

  // 🔚 모든 단어 처리 완료 시
  if (!current) {
    if (answers.length > 0) {
      onFinish(answers);
    }

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
        <p className="text-base font-semibold">Pre-screen 완료!</p>
        <p className="text-xs">
          이제 모르는 단어 위주로 학습 세트를 만들 수 있습니다.
        </p>
      </div>
    );
  }

  const vocab = vocabMap[current.wordId];
  const wordText = vocab?.text ?? current.text ?? "";

  // 🔹 "몰라요" → 바로 unknown 처리 + flash 후 다음 카드
  const handleUnknown = () => {
    if (isLocked || !current) return;
    setIsLocked(true);
    setFlash("unknown");

    const newAnswer: PreScreenAnswer = {
      wordId: current.wordId,
      result: "unknown",
      fromSource: current.source,
    };

    setAnswers((prev) => [...prev, newAnswer]);

    setTimeout(() => {
      setFlash("idle");
      setIsLocked(false);
      setIndex((prev) => prev + 1);
    }, 320);
  };

  // 🔹 "알아요" → 뜻 4지선다 퀴즈 모달 열기
  const handleKnownClick = () => {
    if (isLocked || !current) return;
    setQuiz({
      open: true,
      wordId: current.wordId,
      source: current.source,
    });
  };

  // 🔹 퀴즈에서 정답/오답 선택했을 때
  const handleQuizAnswer = (wordId: string, isCorrect: boolean) => {
    const source =
      quiz.source ??
      items.find((i) => i.wordId === wordId)?.source ??
      "todayNew";

    // flash + 잠금
    setIsLocked(true);
    setFlash(isCorrect ? "known" : "unknown");

    const newAnswer: PreScreenAnswer = {
      wordId,
      result: isCorrect ? "known" : "unknown",
      fromSource: source,
    };

    setAnswers((prev) => [...prev, newAnswer]);

    // 모달 닫고 다음 카드로 이동
    setQuiz({ open: false, wordId: null, source: null });

    setTimeout(() => {
      setFlash("idle");
      setIsLocked(false);
      setIndex((prev) => prev + 1);
    }, 320);
  };

  const handleQuizClose = () => {
    setQuiz({ open: false, wordId: null, source: null });
  };

  const flashBorder =
    flash === "known"
      ? "border-emerald-500 bg-emerald-50"
      : flash === "unknown"
      ? "border-amber-400 bg-amber-50"
      : "border-gray-200 bg-white";

  const flashScale = flash === "idle" ? "scale-100" : "scale-[0.97]";

  return (
    <div className="space-y-4">
      {/* 상단 진행 영역 */}
      <header className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>알어 / 몰라 Pre-screen</span>
          <span>
            {index + 1} / {total} 단어
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 중앙 플래시 카드 */}
      <main className="flex min-h-[260px] flex-col items-center justify-center">
        <div
          className={`w-full max-w-md rounded-2xl border px-6 py-8 text-center shadow-sm transition-all duration-200 ${flashBorder} ${flashScale}`}
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            {current.source === "todayNew" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                오늘 새 단어
              </span>
            )}
            {current.source === "yesterdayReview" && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                어제 학습 복습
              </span>
            )}
          </div>

          <p className="mb-3 text-xs text-gray-500">
            이 단어를 봤을 때,{" "}
            <span className="font-semibold text-gray-700">
              의미가 바로 떠오르나요?
            </span>
          </p>

          <p className="mb-1 text-3xl font-bold tracking-tight">
            {wordText}
          </p>

          {vocab?.pos && (
            <p className="text-[11px] text-gray-400">{vocab.pos}</p>
          )}
        </div>
      </main>

      {/* 하단 버튼 영역 */}
      <footer className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleUnknown}
          disabled={isLocked}
          className={`flex-1 max-w-[180px] rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
            isLocked
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          몰라요 🤔
        </button>
        <button
          type="button"
          onClick={handleKnownClick}
          disabled={isLocked}
          className={`flex-1 max-w-[180px] rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
            isLocked
              ? "cursor-not-allowed bg-emerald-100 text-emerald-300"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          알아요 👍
        </button>
      </footer>

      {/* 미니 퀴즈 모달 (뜻 4지선다) */}
      {quiz.open && quiz.wordId && (
        <MiniQuizModal
          word={vocabMap[quiz.wordId]}
          onClose={handleQuizClose}
          onAnswer={handleQuizAnswer}
        />
      )}
    </div>
  );
}

// ===== 미니 퀴즈 모달 =====

type MiniQuizProps = {
  word: VocabWordCore;
  onClose: () => void;
  onAnswer: (wordId: string, isCorrect: boolean) => void;
};

type Choice = {
  label: string;
  value: string;
  isCorrect: boolean;
};

function MiniQuizModal({ word, onClose, onAnswer }: MiniQuizProps) {
  const coreMeaning = word.meanings_ko[0] ?? "(뜻 미정)";

  const choices: Choice[] = useMemo(() => {
    const correct: Choice = {
      label: coreMeaning,
      value: coreMeaning,
      isCorrect: true,
    };

    const distractorsBase = ["줄이다", "떨어뜨리다", "숨기다", "옮기다"];

    const distractors: Choice[] = distractorsBase
      .filter((d) => d !== coreMeaning)
      .slice(0, 3)
      .map((d) => ({
        label: d,
        value: d,
        isCorrect: false,
      }));

    const arr = [correct, ...distractors];

    // 간단 셔플
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      tmp;
    }

    return arr;
  }, [coreMeaning]);

  const handleClickChoice = (choice: Choice) => {
    onAnswer(word.id, choice.isCorrect);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900">
          이 단어 뜻, 알고 있나요?
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-bold">{word.text}</span> 의 의미를 고르세요.
        </p>

        <div className="mt-4 space-y-2">
          {choices.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleClickChoice(c)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:border-emerald-500 hover:bg-emerald-50"
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
