// apps/web/app/(protected)/vocab/learn/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 🔹 추가
import { demoVocabWords } from "@/models/vocab-demo";
import type { VocabSessionState, VocabWordCore } from "@/models/vocab";
import LearningLayout3Col from "@/components/vocab/LearningLayout3Col";

export default function VocabLearnPage() {
  const router = useRouter(); // 🔹 추가
  const [words, setWords] = useState<VocabWordCore[] | null>(null);

  useEffect(() => {
    // 1) sessionStorage에서 세션 읽기
    let state: VocabSessionState | null = null;

    try {
      const raw = sessionStorage.getItem("lingox_vocab_session");
      if (raw) {
        state = JSON.parse(raw) as VocabSessionState;
      }
    } catch (e) {
      console.error("Failed to parse vocab session", e);
    }

    // demo word map
    const vocabMap: Record<string, VocabWordCore> = {};
    for (const w of demoVocabWords) {
      vocabMap[w.id] = w;
    }

    if (!state) {
      // 세션 없으면: 그냥 demo 전체 사용
      setWords(demoVocabWords);
      return;
    }

    // 2) unknown 우선, 없으면 todayWordIds 사용
    const idsToUse =
      state.unknownWordIds.length > 0
        ? state.unknownWordIds
        : state.todayWordIds.length > 0
        ? state.todayWordIds
        : demoVocabWords.map((w) => w.id);

    const selected: VocabWordCore[] = idsToUse
      .map((id) => vocabMap[id])
      .filter((w): w is VocabWordCore => !!w);

    // fallback: 아무것도 못 찾으면 demo 전체
    setWords(selected.length > 0 ? selected : demoVocabWords);
  }, []);

  if (!words) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <LearningLayout3Col
        words={words}
        onFinish={() => router.push("/vocab/exam")} // 🔹 여기서 시험 페이지로 이동
      />
    </main>
  );
}
