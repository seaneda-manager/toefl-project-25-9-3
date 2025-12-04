// apps/web/app/(protected)/vocab/pre-screen/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { demoVocabWords } from "@/models/vocab-demo";
import type {
  PreScreenItem,
  VocabWordCore,
  PreScreenAnswer,
  VocabSessionState,
} from "@/models/vocab";
import PreScreenBoard from "@/components/vocab/PreScreenBoard";

function buildPreScreenItems(): {
  items: PreScreenItem[];
  vocabMap: Record<string, VocabWordCore>;
} {
  // 일단 예시: 오늘 단어 2개 + 전날 리뷰 1개
  const [w1, w2, w3] = demoVocabWords;

  const items: PreScreenItem[] = [
    { wordId: w1.id, text: w1.text, source: "todayNew" },
    { wordId: w2.id, text: w2.text, source: "todayNew" },
    { wordId: w3.id, text: w3.text, source: "yesterdayReview" },
  ];

  const vocabMap: Record<string, VocabWordCore> = {};
  for (const w of demoVocabWords) {
    vocabMap[w.id] = w;
  }

  return { items, vocabMap };
}

export default function VocabPreScreenPage() {
  const router = useRouter();
  const { items, vocabMap } = buildPreScreenItems();

  const handleFinish = (answers: PreScreenAnswer[]) => {
    // 1) known / unknown 분리
    const knownWordIds = answers
      .filter((a) => a.result === "known")
      .map((a) => a.wordId);

    const unknownWordIds = answers
      .filter((a) => a.result === "unknown")
      .map((a) => a.wordId);

    // 방어로직: 전부 known 또는 전부 unknown일 때 대비
    const todayWordIds =
      unknownWordIds.length > 0
        ? unknownWordIds
        : knownWordIds.length > 0
        ? knownWordIds
        : items.map((i) => i.wordId);

    const sessionState: VocabSessionState = {
      userId: "demo-user", // 나중에 supabase user.id로 교체
      mode: "core",
      gradeBand: null,

      todayWordIds,
      knownWordIds,
      unknownWordIds,

      currentIndex: 0,
      recallQueue: [],
    };

    // 2) sessionStorage에 저장
    try {
      sessionStorage.setItem(
        "lingox_vocab_session",
        JSON.stringify(sessionState),
      );
    } catch (e) {
      console.error("Failed to save vocab session", e);
    }

    // 3) 학습 페이지로 이동
    router.push("/vocab/learn");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <PreScreenBoard
        items={items}
        vocabMap={vocabMap}
        onFinish={handleFinish}
      />
    </main>
  );
}
