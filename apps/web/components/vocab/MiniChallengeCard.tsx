// apps/web/components/vocab/MiniChallengeCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { VocabWordCore } from "@/models/vocab";

export type MiniChallengeResult = "correct" | "incorrect";

type ChallengeKind = "meaning" | "synonym" | "usage" | "grammar";

type Props = {
  word: VocabWordCore;
  onResult: (result: MiniChallengeResult) => void;
};

type Choice = {
  label: string;
  isCorrect: boolean;
};

type BuiltChallenge = {
  kind: ChallengeKind;
  title: string;
  description: string;
  note?: string;
  choices: Choice[];
};

const MAX_ROUNDS = 4;

export default function MiniChallengeCard({ word, onResult }: Props) {
  // roundIndex: 현재 몇 번째 챌린지인지 (0 기반) → 0,1,2,3 = 최대 4번
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<MiniChallengeResult | "idle">("idle");

  const coreEn = word.meanings_en_simple[0] ?? "";
  const hasCore = coreEn.trim().length > 0;

  const currentAttemptNumber = roundIndex + 1;
  const reachedLimit = roundIndex >= MAX_ROUNDS - 1;

  // ─────────────────────────────────────
  // 1. 시도 번호 → 챌린지 타입 매핑
  //    0: 뜻 / 1: 동의어 / 2: 숙어(usage) / 3: 문법
  // ─────────────────────────────────────
  const currentChallenge: BuiltChallenge | null = useMemo(() => {
    if (!hasCore) return null;

    const order: ChallengeKind[] = ["meaning", "synonym", "usage", "grammar"];
    const kind = order[Math.min(roundIndex, order.length - 1)];

    // 공통으로 사용할 기본 distractor pool
    const genericPool = [
      "to reduce",
      "to hide",
      "to move",
      "to increase",
      "to delay",
      "to explain",
      "to connect",
      "to separate",
    ];

    const buildMeaningChallenge = (): BuiltChallenge => {
      const correct: Choice = { label: coreEn, isCorrect: true };
      const distractors: Choice[] = genericPool
        .filter((d) => d.toLowerCase() !== coreEn.toLowerCase())
        .slice(0, 3)
        .map((d) => ({ label: d, isCorrect: false }));

      return {
        kind: "meaning",
        title: "Mini Challenge – Easy Meaning",
        description:
          "이 단어와 가장 잘 맞는 쉬운 영어 뜻을 골라보세요.",
        note: "기본 의미를 다시 한 번 확인하는 단계예요.",
        choices: shuffleChoices([correct, ...distractors]),
      };
    };

    const buildSynonymChallenge = (): BuiltChallenge => {
      // TODO: 나중에 실제 synonyms 필드 연결
      const synonymCandidates = word.meanings_en_simple.slice(1);
      const synonym =
        synonymCandidates[0] && synonymCandidates[0].trim().length > 0
          ? synonymCandidates[0]
          : coreEn;

      const correct: Choice = { label: synonym, isCorrect: true };
      const distractors: Choice[] = genericPool
        .filter((d) => d.toLowerCase() !== synonym.toLowerCase())
        .slice(0, 3)
        .map((d) => ({ label: d, isCorrect: false }));

      return {
        kind: "synonym",
        title: "Mini Challenge – Synonym",
        description:
          "이 단어와 가장 가까운 뜻의 영어 표현(동의어 느낌)을 골라보세요.",
        note: "지금은 데모라 쉬운 뜻 변형을 동의어처럼 사용하고, 나중에 진짜 동의어 데이터를 연결할 수 있어요.",
        choices: shuffleChoices([correct, ...distractors]),
      };
    };

    const buildUsageChallenge = (): BuiltChallenge => {
      // TODO: 나중에 derived_terms / collocations 연결
      const base = word.text;
      const usagePool = [
        `${base} a decision`,
        `${base} the risk`,
        `${base} a problem`,
        `${base} the volume`,
      ];

      const correctLabel = usagePool[0] ?? `${base} something`;
      const correct: Choice = { label: correctLabel, isCorrect: true };
      const distractors: Choice[] = usagePool
        .slice(1, 4)
        .map((u) => ({ label: u, isCorrect: false }));

      return {
        kind: "usage",
        title: "Mini Challenge – Collocation / Usage",
        description:
          "이 단어가 자연스럽게 쓰일 것 같은 영어 표현(숙어/콜로케이션 느낌)을 골라보세요.",
        note: "지금은 예시용 문장들이고, 나중에 실제 corpus/derived_terms 기반 콜로케이션으로 교체할 수 있어요.",
        choices: shuffleChoices([correct, ...distractors]),
      };
    };

    const buildGrammarChallenge = (): BuiltChallenge => {
      // TODO: 나중에 grammarHints, pos 기반 문법 문제로 교체
      const pos = (word.pos ?? "").toLowerCase();
      const posLabel =
        pos.includes("v") || pos.includes("verb")
          ? "동사(verb)"
          : pos.includes("n")
          ? "명사(noun)"
          : pos.includes("adj")
          ? "형용사(adjective)"
          : pos.includes("adv")
          ? "부사(adverb)"
          : "기타(other)";

      const allLabels = [
        "명사(noun)",
        "동사(verb)",
        "형용사(adjective)",
        "부사(adverb)",
      ];

      const correct: Choice = { label: posLabel, isCorrect: true };
      const distractors: Choice[] = allLabels
        .filter((l) => l !== posLabel)
        .slice(0, 3)
        .map((l) => ({ label: l, isCorrect: false }));

      return {
        kind: "grammar",
        title: "Mini Challenge – Grammar / Part of Speech",
        description:
          "이 단어가 문장에서 어떤 품사 역할을 하는지 가장 알맞은 것을 골라보세요.",
        note: "나중에는 자동사/타동사, 수동태 제약 등 세부 문법 팁과 연결할 수 있어요.",
        choices: shuffleChoices([correct, ...distractors]),
      };
    };

    switch (kind) {
      case "synonym":
        return buildSynonymChallenge();
      case "usage":
        return buildUsageChallenge();
      case "grammar":
        return buildGrammarChallenge();
      case "meaning":
      default:
        return buildMeaningChallenge();
    }
  }, [hasCore, coreEn, roundIndex, word]);

  // 선택 처리
  const handleClickChoice = (choice: Choice) => {
    if (!currentChallenge || locked || reachedLimit) return;

    setSelected(choice.label);
    setLocked(true);

    const r: MiniChallengeResult = choice.isCorrect ? "correct" : "incorrect";
    setResult(r);
    onResult(r);
  };

  const handleRetry = () => {
    if (reachedLimit) return;

    // 다음 라운드로: 라운드 인덱스 증가 → 챌린지 타입 변경
    setRoundIndex((prev) => Math.min(prev + 1, MAX_ROUNDS - 1));
    setSelected(null);
    setLocked(false);
    setResult("idle");
  };

  if (!hasCore || !currentChallenge) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2 text-xs text-emerald-900">
        <p className="font-semibold">Mini Challenge</p>
        <p className="mt-1 text-[11px]">
          이 단어에는 아직 영어 쉬운 뜻(meanings_en_simple)이 충분하지 않아
          챌린지를 건너뜁니다.
        </p>
      </div>
    );
  }

  const inSafeZone = currentAttemptNumber <= 2;

  return (
    <div className="mt-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{currentChallenge.title}</p>
        <p className="text-[10px] text-emerald-800">
          시도 {currentAttemptNumber}/{MAX_ROUNDS}
        </p>
      </div>

      <p className="mt-1 text-[11px]">{currentChallenge.description}</p>

      <p className="mt-1 text-[10px] text-emerald-700">
        1~2회는 오답이어도 감점 없음, 3회부터는 정답 시{" "}
        <span className="font-semibold">보너스</span>, 오답 시{" "}
        <span className="font-semibold">페널티</span> 적용 (점수 계산은 상위
        컴포넌트에서 관리).
      </p>

      {currentChallenge.note && (
        <p className="mt-1 text-[10px] text-emerald-700">
          ※ {currentChallenge.note}
        </p>
      )}

      <div className="mt-2 space-y-1.5">
        {currentChallenge.choices.map((c) => {
          const isSelected = selected === c.label;

          let borderClass = "border-gray-200";
          let bgClass = "bg-white";
          let textClass = "text-gray-800";

          if (locked && isSelected) {
            if (result === "correct" && c.isCorrect) {
              borderClass = "border-emerald-500";
              bgClass = "bg-emerald-50";
              textClass = "text-emerald-800";
            } else if (result === "incorrect") {
              borderClass = "border-rose-400";
              bgClass = "bg-rose-50";
              textClass = "text-rose-800";
            }
          }

          return (
            <button
              key={c.label}
              type="button"
              onClick={() => handleClickChoice(c)}
              disabled={locked || reachedLimit}
              className={`flex w-full items-center justify-between rounded-lg border ${borderClass} ${bgClass} px-3 py-1.5 text-left text-[11px] transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-default`}
            >
              <span className={textClass}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* 결과 + 안내문 */}
      {locked && (
        <p className="mt-2 text-[11px]">
          {result === "correct" ? (
            <span className="font-semibold text-emerald-700">
              정답! 잘 기억하고 있어요 👍
            </span>
          ) : (
            <span className="font-semibold text-rose-700">
              아쉽지만 오답이에요.{" "}
              {inSafeZone
                ? "이 구간에서는 감점 없이 연습만 할 수 있어요."
                : "이 구간에서는 오답 시 페널티가 적용될 수 있어요."}
            </span>
          )}
        </p>
      )}

      {/* 추가 도전 버튼 */}
      {locked && !reachedLimit && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            또 도전하기 🔁
          </button>
        </div>
      )}

      {reachedLimit && (
        <p className="mt-2 text-right text-[10px] text-gray-500">
          이 단어에 대한 Mini Challenge는 오늘 여기까지예요.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// 작은 유틸: 선택지 섞기
// ─────────────────────────────────────
function shuffleChoices(arr: Choice[]): Choice[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
