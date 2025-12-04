// apps/web/components/vocab/LearningLayout3Col.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  VocabWordCore,
  VocabSessionState,
  RecallItem as SessionRecallItem,
  RecallStatus as SessionRecallStatus,
} from "@/models/vocab";
import MiniChallengeCard, {
  type MiniChallengeResult,
} from "@/components/vocab/MiniChallengeCard";

type Props = {
  words: VocabWordCore[];
  onFinish?: () => void; // 🔹 학습 끝 → 시험 페이지로 이동 콜백
};

// 🔹 UI용 상태 (세션의 RecallStatus 와는 다름)
type UiRecallStatus = "idle" | "correct" | "incorrect";

type RecallState = {
  input: string;
  status: UiRecallStatus;
};

export default function LearningLayout3Col({ words, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Right 패널용 입력/채점 상태: wordId 기준으로 관리
  const [recallStates, setRecallStates] = useState<
    Record<string, RecallState>
  >({});

  // Center Mini-challenge 결과별 perk (간단 포인트)
  const [perkPoints, setPerkPoints] = useState(0);
  const [miniResults, setMiniResults] = useState<
    Record<string, "idle" | "correct" | "incorrect">
  >({});

  // 🔹 단어별 Mini Challenge 시도 횟수
  const [challengeAttempts, setChallengeAttempts] = useState<
    Record<string, number>
  >({});

  const currentWord = words[currentIndex];

  // n-2 규칙: 현재 인덱스 기준으로 2개 이전까지 회상 리스트
  const recallWords = useMemo(
    () => words.filter((_, idx) => idx <= currentIndex - 2),
    [words, currentIndex],
  );

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < words.length - 1;
  const isLast = currentIndex === words.length - 1; // 🔹 마지막 단어 여부

  const handlePrev = () => {
    if (!canPrev) return;
    setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    setCurrentIndex((i) => i + 1);
  };

  if (!currentWord) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        학습할 단어가 없습니다.
      </div>
    );
  }

  const mainMeaning = currentWord.meanings_ko[0] ?? "";
  const mainEasySyn = currentWord.meanings_en_simple[0] ?? "";
  const mainExample = currentWord.examples_easy[0] ?? "";

  // 🔹 세션의 recallQueue 업데이트 헬퍼
  const updateSessionRecall = (wordId: string, status: SessionRecallStatus) => {
    try {
      const raw = sessionStorage.getItem("lingox_vocab_session");
      if (!raw) return;

      const state = JSON.parse(raw) as VocabSessionState;
      const targetMeaningIndex = 0; // 일단 대표 의미만

      const existingIndex = state.recallQueue.findIndex(
        (item) =>
          item.wordId === wordId &&
          item.targetMeaningIndex === targetMeaningIndex,
      );

      if (existingIndex >= 0) {
        state.recallQueue[existingIndex] = {
          ...state.recallQueue[existingIndex],
          status,
        };
      } else {
        const newItem: SessionRecallItem = {
          wordId,
          targetMeaningIndex,
          status,
        };
        state.recallQueue.push(newItem);
      }

      sessionStorage.setItem(
        "lingox_vocab_session",
        JSON.stringify(state),
      );
    } catch (e) {
      console.error("Failed to update recallQueue in session", e);
    }
  };

  // 🔹 Center Mini-challenge 결과 처리 (perk + 시도 횟수 로직)
  const handleMiniChallengeResult = (result: MiniChallengeResult) => {
    const wordId = currentWord.id;

    // 이 단어에서 지금까지 몇 번 Mini Challenge 했는지
    const prevCount = challengeAttempts[wordId] ?? 0;
    const newCount = prevCount + 1;
    const isSafeZone = newCount <= 2; // 1~2번은 안전 구간

    // 시도 횟수 갱신
    setChallengeAttempts((prev) => ({
      ...prev,
      [wordId]: newCount,
    }));

    // UI 결과 상태 갱신
    setMiniResults((prevMap) => ({
      ...prevMap,
      [wordId]: result === "correct" ? "correct" : "incorrect",
    }));

    // perk 점수 계산
    setPerkPoints((prevPerk) => {
      if (result === "correct") {
        // 정답인 경우
        if (isSafeZone) {
          // 안전 구간: 기본 보상
          return prevPerk + 5;
        }
        // 위험 구간: 파격 보너스
        return prevPerk + 15;
      }

      // 오답인 경우
      if (isSafeZone) {
        // 안전 구간: 감점 없음
        return prevPerk;
      }

      // 위험 구간: 감점 (0 아래로는 안내려가게)
      const next = prevPerk - 10;
      return next < 0 ? 0 : next;
    });
  };

  // 🔹 오늘 회상 요약 (UI 상태 기준)
  const recallSummary = useMemo(() => {
    const values = Object.values(recallStates);
    const attempted = values.filter((v) => v.status !== "idle").length;
    const correct = values.filter((v) => v.status === "correct").length;

    return {
      attempted,
      correct,
      rate: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };
  }, [recallStates]);

  // 🔹 Right 패널: 채점 함수
  function handleRecallCheck(word: VocabWordCore) {
    const wordId = word.id;
    const state = recallStates[wordId];
    const userInput = (state?.input ?? "").trim();
    const correctMeaning = (word.meanings_ko[0] ?? "").trim();

    if (!userInput) return;

    const isCorrect = userInput === correctMeaning;

    setRecallStates((prev) => ({
      ...prev,
      [wordId]: {
        input: userInput,
        status: isCorrect ? "correct" : "incorrect",
      },
    }));

    updateSessionRecall(wordId, isCorrect ? "success" : "failed");
  }

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">오늘의 단어 학습</h1>
          <p className="text-xs text-gray-500">
            {currentIndex + 1} / {words.length} 단어
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* 회상 요약 뱃지 */}
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">
            회상 시도{" "}
            <span className="font-semibold">
              {recallSummary.attempted}
            </span>
            개 · 정답{" "}
            <span className="font-semibold">
              {recallSummary.correct}
            </span>
            개 · 정확도{" "}
            <span className="font-semibold">
              {recallSummary.rate}%
            </span>
          </div>

          {/* Perk 표시 */}
          <div className="rounded-full bg-amber-50 px-3 py-1 text-[11px] text-amber-800">
            Perk ⭐{" "}
            <span className="font-semibold">{perkPoints}</span> points
          </div>

          {/* 이전/다음 버튼 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canPrev}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                canPrev
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                canNext
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-100 text-emerald-400 cursor-not-allowed"
              }`}
            >
              다음
            </button>
          </div>
        </div>
      </header>

      {/* 3-Column 레이아웃 */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.1fr)]">
        {/* LEFT: 씬 / 이미지 영역 (placeholder) */}
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <h2 className="mb-2 text-xs font-semibold text-gray-500">
            LEFT – 씬 / 이미지 / 애니메이션
          </h2>
          <p className="text-xs text-gray-500">
            여기에는 나중에 단어의 성격에 맞는 그림, 미니 애니메이션, 스토리
            씬 등이 올 자리입니다.
            <br />
            지금은 <span className="font-semibold">{currentWord.text}</span> 와
            관련된 장면을 넣는다고 생각하고 UI 틀만 잡아 둔 상태예요.
          </p>
        </section>

        {/* CENTER: 현재 단어 카드 + Mini Challenge */}
        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold text-emerald-700">
            CENTER – 현재 학습 단어
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {currentWord.text}
                </span>
                {currentWord.pos && (
                  <span className="text-xs text-gray-500">
                    {currentWord.pos}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {mainMeaning}
                {mainEasySyn && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({mainEasySyn})
                  </span>
                )}
              </p>
            </div>

            {/* 예문 */}
            {mainExample && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p className="font-semibold">Example</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {mainExample}
                </p>
              </div>
            )}

            {/* Mini Challenge: 지금은 1개, 나중에 최대 4개까지 확장 가능 */}
            <MiniChallengeCard
              word={currentWord}
              onResult={handleMiniChallengeResult}
            />
          </div>
        </section>

        {/* RIGHT: 지연 회상 영역 + 실제 입력/채점 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-semibold text-gray-500">
            RIGHT – 지연 회상(Delayed Recall)
          </h2>

          {recallWords.length === 0 ? (
            <p className="text-xs text-gray-400">
              아직 회상할 이전 단어가 없습니다.
              <br />
              3번째 단어부터 n-2 규칙으로 여기에 나타날 거예요.
            </p>
          ) : (
            <div className="space-y-3">
              {recallWords.map((w, idx) => {
                const s = recallStates[w.id] ?? { input: "", status: "idle" };

                const correctMeaning = w.meanings_ko[0] ?? "";
                const isCorrect = s.status === "correct";
                const isIncorrect = s.status === "incorrect";

                const borderColor = isCorrect
                  ? "border-emerald-500"
                  : isIncorrect
                  ? "border-rose-500"
                  : "border-gray-200";

                const helperText =
                  s.status === "correct"
                    ? "좋아요! 이 뜻은 잘 기억하고 있어요 👍"
                    : s.status === "incorrect"
                    ? `다시 한 번! 정답 예: "${correctMeaning}"`
                    : "이 단어의 한국어 뜻을 떠올려 보고 적어 보세요.";

                const helperTextColor =
                  s.status === "correct"
                    ? "text-emerald-600"
                    : isIncorrect
                    ? "text-rose-600"
                    : "text-gray-500";

                return (
                  <div
                    key={w.id}
                    className={`rounded-lg border ${borderColor} bg-gray-50 px-3 py-2 text-xs`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      {/* 🔧 justify_between 오타 수정 → justify-between */}
                      <span className="font-semibold">
                        {idx + 1}. {w.text}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        (뜻을 한국어로 적기)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={s.input}
                        onChange={(e) =>
                          setRecallStates((prev) => ({
                            ...prev,
                            [w.id]: {
                              input: e.target.value,
                              status: prev[w.id]?.status ?? "idle",
                            },
                          }))
                        }
                        placeholder="예: 이해하다"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRecallCheck(w)}
                        className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                      >
                        채점
                      </button>
                    </div>

                    <p className={`mt-1 text-[11px] ${helperTextColor}`}>
                      {helperText}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 🔹 학습 완료 / 시험 이동 버튼 */}
      {onFinish && (
        <div className="mt-2 flex items-center justify-end gap-3">
          {!isLast && (
            <p className="text-[11px] text-gray-500">
              모든 단어를 한 번씩 본 뒤에 &quot;오늘 학습 완료&quot; 버튼을 눌러 주세요.
            </p>
          )}
          <button
            type="button"
            disabled={!isLast}
            onClick={onFinish}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              isLast
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            오늘 학습 완료 → 시험 보기
          </button>
        </div>
      )}
    </div>
  );
}
