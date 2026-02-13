// apps/web/components/vocab/learning/LearningRunner.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LearningShowroom from "./LearningShowroom";
import type { LearningWord } from "./learning.types";
import type { SpeedQuestion } from "@/models/vocab/speed.types";

type Stage = "PRESENT" | "DONE";

type Props = {
  words: LearningWord[];
  speedQuestions?: SpeedQuestion[]; // legacy prop (ignored)
  onFinish: () => void;
};

export default function LearningRunner({ words, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("PRESENT");

  // reset 기준을 words reference가 아니라 "id signature"로 고정
  const wordsKey = useMemo(
    () => words.map((w) => String((w as any)?.id ?? "")).join("|"),
    [words]
  );

  // onFinish 중복 호출 방지
  const finishedRef = useRef(false);

  useEffect(() => {
    setIndex(0);
    setStage("PRESENT");
    finishedRef.current = false;
  }, [wordsKey]);

  const currentWord = words[index];

  // DONE → 종료 (once)
  useEffect(() => {
    if (stage !== "DONE") return;
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [stage, onFinish]);

  // UI guard
  if (words.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        학습할 단어가 없습니다
      </div>
    );
  }

  if (!currentWord && stage !== "DONE") {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        다음 단어 준비 중…
      </div>
    );
  }

  if (stage === "PRESENT") {
    return (
      <LearningShowroom
        word={currentWord!}
        onNext={() => {
          const next = index + 1;
          if (next >= words.length) {
            setStage("DONE");
            return;
          }
          setIndex(next);
          setStage("PRESENT");
        }}
      />
    );
  }

  // DONE
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      학습 완료 처리 중…
    </div>
  );
}
