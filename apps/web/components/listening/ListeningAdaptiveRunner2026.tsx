// apps/web/components/listening/ListeningAdaptiveRunner2026.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LListeningTest2026,
  LListeningModule,
  LBaseItem,
} from "@/models/listening";
import Timer from "@/app/(protected)/reading/components/Timer";

type Props = {
  test: LListeningTest2026;
  onFinish?: (result: {
    testId: string;
    stage1Correct: number;
    stage1Total: number;
    stage2Correct: number;
    stage2Total: number;
  }) => void;
};

type Phase = "intro" | "item" | "stageSummary" | "final";

export default function ListeningAdaptiveRunner2026({ test, onFinish }: Props) {
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // questionId -> choiceId
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [stage1Score, setStage1Score] = useState<{ correct: number; total: number } | null>(null);
  const [stage2Score, setStage2Score] = useState<{ correct: number; total: number } | null>(null);

  const currentModule: LListeningModule = useMemo(
    () => test.modules[currentStage - 1],
    [test.modules, currentStage]
  );

  const items = currentModule.items;
  const currentItem: LBaseItem | null = items[currentItemIndex] ?? null;

  const handleChoice = useCallback(
    (questionId: string, choiceId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: choiceId,
      }));
    },
    []
  );

  /** 모듈 점수 계산 (short_response, conversation, announcement, academic_talk 공통) */
  const computeModuleScore = useCallback(
    (module: LListeningModule) => {
      let correct = 0;
      let total = 0;

      for (const item of module.items) {
        for (const q of item.questions) {
          total += 1;
          const user = answers[q.id];
          const correctChoice = q.choices.find(
            (c: any) => c.isCorrect === true || c.is_correct === true
          );
          if (user && correctChoice && user === correctChoice.id) {
            correct += 1;
          }
        }
      }

      return { correct, total };
    },
    [answers]
  );

  /** 현재 Stage에서 다음 item으로 이동하거나 Stage 종료 */
  const handleNextItemOrFinishStage = useCallback(() => {
    if (!currentItem) return;

    const nextIndex = currentItemIndex + 1;
    if (nextIndex < items.length) {
      setCurrentItemIndex(nextIndex);
      return;
    }

    // 이 Stage 끝
    const moduleIndex = currentStage - 1;
    const score = computeModuleScore(test.modules[moduleIndex]);

    if (currentStage === 1) {
      setStage1Score(score);
    } else {
      setStage2Score(score);
    }

    setPhase("stageSummary");
  }, [currentItem, currentItemIndex, items.length, currentStage, computeModuleScore, test.modules]);

  /** StageSummary → 다음 Stage / Final */
  const handleStageSummaryNext = useCallback(() => {
    if (currentStage === 1) {
      setCurrentStage(2);
      setCurrentItemIndex(0);
      setPhase("intro");
    } else {
      setPhase("final");
    }
  }, [currentStage]);

  /** 시간 만료: 두 Stage 모두 점수 계산 후 Final */
  const handleTimeUp = useCallback(() => {
    const s1 = computeModuleScore(test.modules[0]);
    const s2 = computeModuleScore(test.modules[1]);

    setStage1Score(s1);
    setStage2Score(s2);
    setPhase("final");

    onFinish?.({
      testId: test.meta.id,
      stage1Correct: s1.correct,
      stage1Total: s1.total,
      stage2Correct: s2.correct,
      stage2Total: s2.total,
    });
  }, [computeModuleScore, onFinish, test]);

  /** Final 진입 시 onFinish 한 번 호출 */
  useEffect(() => {
    if (phase !== "final" || !onFinish) return;

    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(test.modules[1]);

    onFinish({
      testId: test.meta.id,
      stage1Correct: s1.correct,
      stage1Total: s1.total,
      stage2Correct: s2.correct,
      stage2Total: s2.total,
    });
  }, [phase, onFinish, stage1Score, stage2Score, computeModuleScore, test]);

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 헤더 (라이트 퍼플 톤) */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-violet-700">
            Listening · Module {currentStage} of 2
          </div>
          <h1 className="text-lg font-semibold">{test.meta.label ?? test.meta.id}</h1>
          <p className="mt-1 text-xs text-gray-500">
            Stage {currentStage} –{" "}
            {currentStage === 1
              ? "First set of listening tasks. Your performance here guides the next module."
              : "Second set of listening tasks. Stay focused until the end."}
          </p>
        </div>
        <div className="shrink-0">
          <Timer
            // TODO: 실제 2026 Listening 시간으로 조정 (예: 36분)
            totalSeconds={36 * 60}
            direction="down"
            autoStart
            clampToZero
            showControls={false}
            onExpireAction={handleTimeUp}
            className="rounded-full border border-violet-300 px-4 py-1 text-sm font-medium text-violet-900 bg-violet-50/80"
          />
        </div>
      </header>

      {/* 페이즈별 UI */}
      {phase === "intro" && currentItem && (
        <StageIntroCard
          stage={currentStage}
          module={currentModule}
          onStart={() => setPhase("item")}
        />
      )}

      {phase === "item" && currentItem && (
        <>
          <main className="flex flex-col gap-4">
            <ListeningItemCard
              stage={currentStage}
              index={currentItemIndex}
              total={items.length}
              item={currentItem}
              answers={answers}
              onChoice={handleChoice}
            />
          </main>
          <footer className="flex justify-end">
            <button
              type="button"
              onClick={handleNextItemOrFinishStage}
              className="rounded-lg border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
            >
              {currentItemIndex < items.length - 1
                ? "Next Listening Task"
                : currentStage === 1
                ? "Finish Module 1"
                : "Finish Listening Section"}
            </button>
          </footer>
        </>
      )}

      {phase === "stageSummary" && (
        <StageSummaryCard
          stage={currentStage}
          score={
            currentStage === 1
              ? stage1Score ?? computeModuleScore(test.modules[0])
              : stage2Score ?? computeModuleScore(test.modules[1])
          }
          onNext={handleStageSummaryNext}
        />
      )}

      {phase === "final" && (
        <FinalSummaryCard
          stage1={stage1Score ?? computeModuleScore(test.modules[0])}
          stage2={stage2Score ?? computeModuleScore(test.modules[1])}
        />
      )}
    </div>
  );
}

/* ----------------------
 *  Item 카드 (한 지문)
 * --------------------*/

function ListeningItemCard({
  stage,
  index,
  total,
  item,
  answers,
  onChoice,
}: {
  stage: 1 | 2;
  index: number;
  total: number;
  item: LBaseItem;
  answers: Record<string, string>;
  onChoice: (questionId: string, choiceId: string) => void;
}) {
  const label = labelForTaskKind(item.taskKind);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="font-semibold text-gray-600">
          Task {index + 1} of {total} · {label}
        </div>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          Stage {stage}
        </span>
      </div>

      {/* 오디오 플레이어 */}
      <div className="mb-3 rounded-lg border border-violet-100 bg-violet-50/60 p-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-violet-600">
          Audio
        </p>
        <audio controls className="w-full">
          <source src={item.audioUrl} />
          Your browser does not support the audio element.
        </audio>
        <p className="mt-1 text-[11px] text-violet-700/80">
          Listen carefully. In the real test, you will usually hear the audio only once.
        </p>
      </div>

      {/* (선택) transcript – Study 모드에서만 보여줄 수 있도록 나중에 prop으로 제어 가능 */}
      {item.transcript && (
        <details className="mb-3 text-xs text-gray-600">
          <summary className="cursor-pointer text-[11px] font-medium text-gray-500">
            Show transcript (practice only)
          </summary>
          <p className="mt-1 whitespace-pre-line">{item.transcript}</p>
        </details>
      )}

      {/* 질문들 */}
      <div className="mt-2 flex flex-col gap-3 text-sm">
        {item.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-1">
            <div className="font-medium">
              Q{q.number}. {q.stem}
            </div>
            <div className="flex flex-col gap-1">
              {q.choices.map((c: any) => {
                const checked = answers[q.id] === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1 text-sm transition
                      ${
                        checked
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-violet-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-[3px]"
                      checked={checked}
                      onChange={() => onChoice(q.id, c.id)}
                    />
                    <span>{c.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------
 *  UX 카드들
 * --------------------*/

function StageIntroCard({
  stage,
  module,
  onStart,
}: {
  stage: 1 | 2;
  module: LListeningModule;
  onStart: () => void;
}) {
  const itemCount = module.items.length;
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-950">
      <h2 className="mb-1 text-sm font-semibold">
        Stage {stage} Overview ({itemCount} tasks)
      </h2>
      <p className="mb-2 text-xs">
        {stage === 1
          ? "You will hear short responses, conversations, announcements, and an academic talk. Focus on the main idea and key details."
          : "This stage continues with similar task types. Use your experience from Stage 1 to manage your time and attention."}
      </p>
      <ul className="mb-3 list-disc pl-4 text-xs">
        <li>Listen actively – predict what speakers will say next.</li>
        <li>Do not leave any question blank before finishing the task.</li>
      </ul>
      <button
        type="button"
        onClick={onStart}
        className="rounded-lg border border-violet-500 bg-white px-4 py-1.5 text-xs font-medium text-violet-800 shadow-sm hover:bg-violet-50"
      >
        Start Module {stage}
      </button>
    </section>
  );
}

function StageSummaryCard({
  stage,
  score,
  onNext,
}: {
  stage: 1 | 2;
  score: { correct: number; total: number };
  onNext: () => void;
}) {
  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">
        Stage {stage} Summary
      </h2>
      <p className="mb-2 text-xs text-slate-600">
        You answered <strong>{score.correct}</strong> out of{" "}
        <strong>{score.total}</strong> questions correctly (
        <strong>{pct}%</strong>).
      </p>
      <p className="mb-3 text-xs text-slate-500">
        {stage === 1
          ? "Your performance in Stage 1 will guide the difficulty of Stage 2 in a real adaptive test."
          : "This completes the listening section. Review your overall performance on the next screen."}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="rounded-lg border border-violet-500 bg-violet-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-violet-700"
      >
        {stage === 1 ? "Go to Module 2" : "View Final Summary"}
      </button>
    </section>
  );
}

function FinalSummaryCard({
  stage1,
  stage2,
}: {
  stage1: { correct: number; total: number };
  stage2: { correct: number; total: number };
}) {
  const totalCorrect = stage1.correct + stage2.correct;
  const totalQuestions = stage1.total + stage2.total;
  const pct = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <section className="rounded-xl border border-violet-300 bg-white p-4 text-sm shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-violet-900">
        Listening Section Summary
      </h2>

      <div className="mb-3 grid gap-3 text-xs md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-[11px] font-semibold text-slate-500">Stage 1</div>
          <div className="text-sm font-semibold text-slate-900">
            {stage1.correct} / {stage1.total}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-[11px] font-semibold text-slate-500">Stage 2</div>
          <div className="text-sm font-semibold text-slate-900">
            {stage2.correct} / {stage2.total}
          </div>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
          <div className="mb-1 text-[11px] font-semibold text-violet-700">Overall</div>
          <div className="text-sm font-semibold text-violet-900">
            {totalCorrect} / {totalQuestions} ({pct}%)
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        This adaptive layout is for practice. In the actual 2026 TOEFL, your performance
        in Stage 1 will influence the difficulty and scoring of Stage 2.
      </p>
    </section>
  );
}

/* ----------------------
 *  Helpers
 * --------------------*/

function labelForTaskKind(kind: LBaseItem["taskKind"]): string {
  switch (kind) {
    case "short_response":
      return "Listen and Choose a Response";
    case "conversation":
      return "Conversation";
    case "announcement":
      return "Campus Announcement";
    case "academic_talk":
      return "Academic Talk";
    default:
      return kind;
  }
}
