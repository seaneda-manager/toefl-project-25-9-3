// apps/web/components/reading/ReadingAdaptiveRunner2026.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type {
  RReadingTest2026,
  RReadingModule,
  RReadingItem,
  RCompleteWordsItem,
  RDailyLifeItem,
  RAcademicPassageItem,
} from "@/models/reading";
import Timer from "@/app/(protected)/reading/components/Timer";

type Props = {
  test: RReadingTest2026;
  onFinish?: (result: {
    testId: string;
    stage1Correct: number;
    stage1Total: number;
    stage2Correct: number;
    stage2Total: number;
  }) => void;
};

/** 내부 단계 상태 */
type Phase = "intro" | "items" | "stageSummary" | "final";

export default function ReadingAdaptiveRunner2026({ test, onFinish }: Props) {
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("intro");

  // questionId / blankId -> user answer
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [stage1Score, setStage1Score] = useState<{ correct: number; total: number } | null>(
    null
  );
  const [stage2Score, setStage2Score] = useState<{ correct: number; total: number } | null>(
    null
  );

  // onFinish가 두 번 이상 호출되는 것을 막기 위한 플래그
  const [reported, setReported] = useState(false);

  const currentModule: RReadingModule = useMemo(
    () => test.modules[currentStage - 1],
    [test.modules, currentStage]
  );
  const items = currentModule.items;

  /** 공통 정답 저장 */
  const handleAnswer = useCallback(
    (_item: RReadingItem, questionId: string, choiceIdOrToken: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: choiceIdOrToken,
      }));
    },
    []
  );

  /** 모듈 단위 점수 계산 */
  const computeModuleScore = useCallback(
    (module: RReadingModule) => {
      let correct = 0;
      let total = 0;

      for (const item of module.items) {
        if (item.taskKind === "complete_words") {
          const cw = item as RCompleteWordsItem;
          const blanks = Array.isArray(cw.blanks) ? cw.blanks : [];

          for (const blank of blanks) {
            total += 1;
            const user = answers[blank.id];
            if (user && user === blank.correctToken) correct += 1;
          }
        } else {
          const qs =
            item.taskKind === "daily_life"
              ? (item as RDailyLifeItem).questions
              : (item as RAcademicPassageItem).questions;

          for (const q of qs) {
            total += 1;
            const user = answers[q.id];

            // ✅ isCorrect / is_correct 둘 다 허용
            const correctChoice = q.choices.find((c: any) => {
              return c.isCorrect === true || c.is_correct === true;
            });

            if (user && correctChoice && user === correctChoice.id) correct += 1;
          }
        }
      }

      return { correct, total };
    },
    [answers]
  );

  /** Stage(모듈) 끝 버튼 */
  const handleStageFinish = useCallback(() => {
    const moduleIndex = currentStage - 1;
    const score = computeModuleScore(test.modules[moduleIndex]);

    if (currentStage === 1) {
      setStage1Score(score);
    } else {
      setStage2Score(score);
    }

    setPhase("stageSummary");
  }, [computeModuleScore, currentStage, test.modules]);

  /** StageSummary → 다음 Stage / Final 로 넘어가기 */
  const handleStageSummaryNext = useCallback(() => {
    if (currentStage === 1) {
      // Stage1 → Stage2 인트로로
      setCurrentStage(2);
      setPhase("intro");
    } else {
      // Stage2 → 최종 요약
      setPhase("final");
    }
  }, [currentStage]);

  /** 시간 만료 시: 바로 최종 요약 + onFinish 호출 */
  const handleTimeUp = useCallback(() => {
    const s1 = computeModuleScore(test.modules[0]);
    const s2 = computeModuleScore(test.modules[1]);

    setStage1Score(s1);
    setStage2Score(s2);
    setPhase("final");

    // ⛔ onFinish 중복 호출 방지
    if (onFinish && !reported) {
      onFinish({
        testId: test.meta.id,
        stage1Correct: s1.correct,
        stage1Total: s1.total,
        stage2Correct: s2.correct,
        stage2Total: s2.total,
      });
      setReported(true);
    }
  }, [computeModuleScore, onFinish, reported, test]);

  /** 최종 요약 화면 진입 시 onFinish 한 번 호출 */
  useEffect(() => {
    if (phase !== "final" || !onFinish || reported) return;

    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(test.modules[1]);

    onFinish({
      testId: test.meta.id,
      stage1Correct: s1.correct,
      stage1Total: s1.total,
      stage2Correct: s2.correct,
      stage2Total: s2.total,
    });
    setReported(true);
  }, [phase, onFinish, reported, stage1Score, stage2Score, computeModuleScore, test]);

  // ----------------- UI 렌더링 분기 -----------------

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-emerald-700">
            Reading · Module {currentStage} of 2
          </div>
          <h1 className="text-lg font-semibold">
            {test.meta.label ?? test.meta.id}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Stage {currentStage} –{" "}
            {currentStage === 1
              ? "Warm-up module. Your performance here shapes the next module."
              : "Final module. Keep a steady pace and complete all questions."}
          </p>
        </div>
        <div className="shrink-0">
          <Timer
            totalSeconds={30 * 60}
            direction="down"
            autoStart
            clampToZero
            showControls={false}
            onExpireAction={handleTimeUp}
            className="rounded-full border border-emerald-400/70 px-4 py-1 text-sm font-medium text-emerald-900 bg-emerald-50/70"
          />
        </div>
      </header>

      {/* 페이즈별 컨텐츠 */}
      {phase === "intro" && (
        <StageIntroCard
          stage={currentStage}
          module={currentModule}
          onStart={() => setPhase("items")}
        />
      )}

      {phase === "items" && (
        <>
          <main className="flex flex-col gap-6">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-600">
                    Item {idx + 1} · {labelForTaskKind(item.taskKind)}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Stage {currentStage}
                  </span>
                </div>

                {item.taskKind === "complete_words" && (
                  <CompleteWordsItemView
                    item={item as RCompleteWordsItem}
                    answers={answers}
                    onAnswer={handleAnswer}
                  />
                )}

                {item.taskKind === "daily_life" && (
                  <DailyLifeItemView
                    item={item as RDailyLifeItem}
                    answers={answers}
                    onAnswer={handleAnswer}
                  />
                )}

                {item.taskKind === "academic_passage" && (
                  <AcademicPassageItemView
                    item={item as RAcademicPassageItem}
                    answers={answers}
                    onAnswer={handleAnswer}
                  />
                )}
              </div>
            ))}
          </main>

          <footer className="flex justify-end">
            <button
              type="button"
              onClick={handleStageFinish}
              className="rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              {currentStage === 1 ? "Finish Module 1" : "Finish Reading Section"}
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

/* ------------------------------------
 *  Sub-views for each task kind
 * ----------------------------------*/

type ItemViewProps<T extends RReadingItem> = {
  item: T;
  answers: Record<string, string>;
  onAnswer: (
    item: RReadingItem,
    questionId: string,
    choiceIdOrToken: string
  ) => void;
};

function CompleteWordsItemView({
  item,
  answers,
  onAnswer,
}: ItemViewProps<RCompleteWordsItem>) {
  // 🔐 blanks 방어 코드
  const blanks = Array.isArray(item.blanks) ? item.blanks : [];

  return (
    <div className="flex flex-col gap-4">
      <div
        className="prose max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: item.paragraphHtml }}
      />
      <div className="flex flex-col gap-2">
        {blanks.map((blank, idx) => (
          <div key={blank.id ?? idx} className="flex items-center gap-2 text-sm">
            <span className="w-20 text-xs font-medium text-gray-500">
              Blank {idx + 1}
            </span>
            <input
              type="text"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              value={answers[blank.id] ?? ""}
              onChange={(e) => onAnswer(item, blank.id, e.target.value.trim())}
              placeholder="Type the missing letters"
            />
          </div>
        ))}
        {blanks.length === 0 && (
          <p className="text-xs text-gray-400">
            (No blanks configured for this item yet.)
          </p>
        )}
      </div>
    </div>
  );
}

function DailyLifeItemView({
  item,
  answers,
  onAnswer,
}: ItemViewProps<RDailyLifeItem>) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-sm"
        dangerouslySetInnerHTML={{ __html: item.contentHtml }}
      />

      <div className="flex flex-col gap-3">
        {item.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-1 text-sm">
            <div className="font-medium">
              Q{q.number}. {q.stem}
            </div>
            <div className="flex flex-col gap-1">
              {q.choices.map((c) => {
                const checked = answers[q.id] === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1 text-sm transition
                      ${
                        checked
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-[3px]"
                      checked={checked}
                      onChange={() => onAnswer(item, q.id, c.id)}
                    />
                    <span>{c.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AcademicPassageItemView({
  item,
  answers,
  onAnswer,
}: ItemViewProps<RAcademicPassageItem>) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="md:w-1/2">
        <div
          className="prose max-w-none rounded-md border border-gray-100 bg-slate-50/60 p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: item.passageHtml }}
        />
      </div>
      <div className="md:w-1/2 md:pl-4">
        <div className="flex flex-col gap-3 text-sm">
          {item.questions.map((q) => (
            <div key={q.id} className="flex flex-col gap-1">
              <div className="font-medium">
                Q{q.number}. {q.stem}
              </div>
              <div className="flex flex-col gap-1">
                {q.choices.map((c) => {
                  const checked = answers[q.id] === c.id;
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1 text-sm transition
                        ${
                          checked
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        className="mt-[3px]"
                        checked={checked}
                        onChange={() => onAnswer(item, q.id, c.id)}
                      />
                      <span>{c.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------
 *  UX 보조 카드들
 * ----------------------------------*/

function StageIntroCard({
  stage,
  module,
  onStart,
}: {
  stage: 1 | 2;
  module: RReadingModule;
  onStart: () => void;
}) {
  const itemCount = module.items.length;

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950">
      <h2 className="mb-1 text-sm font-semibold">
        Stage {stage} Overview ({itemCount} item{itemCount > 1 ? "s" : ""})
      </h2>
      <p className="mb-2 text-xs">
        {stage === 1
          ? "Start with a warm-up set: one word-completion item and a short daily-life reading. Focus on accuracy and understanding."
          : "Now you will read a short academic passage and answer a few questions. Use what you practiced in Stage 1 to keep a steady pace."}
      </p>
      <ul className="mb-3 list-disc pl-4 text-xs">
        <li>Read carefully, but don&apos;t spend too long on a single question.</li>
        <li>Make sure every question has an answer before you finish the module.</li>
      </ul>
      <button
        type="button"
        onClick={onStart}
        className="rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
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
          ? "Your performance here will guide the second module. Take a breath before you continue."
          : "This completes the reading section. Review your overall performance on the next screen."}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
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
    <section className="rounded-xl border border-emerald-300 bg-white p-4 text-sm shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-emerald-900">
        Reading Section Summary
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-1 text-[11px] font-semibold text-emerald-700">
            Overall
          </div>
          <div className="text-sm font-semibold text-emerald-900">
            {totalCorrect} / {totalQuestions} ({pct}%)
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        This adaptive layout is for practice. In the real test, your Stage 1
        performance influences the difficulty of Stage 2, and together they
        determine your reading score.
      </p>
    </section>
  );
}

/* ------------------------------------
 *  Helpers
 * ----------------------------------*/

function labelForTaskKind(kind: RReadingItem["taskKind"]): string {
  switch (kind) {
    case "complete_words":
      return "Complete the Words";
    case "daily_life":
      return "Read in Daily Life";
    case "academic_passage":
      return "Read an Academic Passage";
    default:
      return kind;
  }
}
