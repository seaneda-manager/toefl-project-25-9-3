// apps/web/components/reading/ReadingAdaptiveRunner2026.tsx
"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
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

type Phase = "intro" | "items" | "stageSummary" | "final";

export default function ReadingAdaptiveRunner2026({ test, onFinish }: Props) {
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stage1Score, setStage1Score] = useState<{ correct: number; total: number } | null>(null);
  const [stage2Score, setStage2Score] = useState<{ correct: number; total: number } | null>(null);
  const [reported, setReported] = useState(false);

  const currentModule: RReadingModule = useMemo(
    () => test.modules[currentStage - 1],
    [test.modules, currentStage]
  );

  const handleAnswer = useCallback(
    (_item: RReadingItem, questionId: string, choiceId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    },
    []
  );

  const computeModuleScore = useCallback(
    (module: RReadingModule) => {
      let correct = 0, total = 0;
      for (const item of module.items) {
        if (item.taskKind === "complete_words") {
          const cw = item as RCompleteWordsItem;
          for (const blank of cw.blanks ?? []) {
            total++;
            if (answers[blank.id] === blank.correctToken) correct++;
          }
        } else {
          const qs = item.taskKind === "daily_life"
            ? (item as RDailyLifeItem).questions
            : (item as RAcademicPassageItem).questions;
          for (const q of qs) {
            total++;
            const correctChoice = q.choices.find((c: any) => c.isCorrect === true || c.is_correct === true);
            if (correctChoice && answers[q.id] === correctChoice.id) correct++;
          }
        }
      }
      return { correct, total };
    },
    [answers]
  );

  const handleStageFinish = useCallback(() => {
    const score = computeModuleScore(test.modules[currentStage - 1]);
    if (currentStage === 1) setStage1Score(score);
    else setStage2Score(score);
    setPhase("stageSummary");
  }, [computeModuleScore, currentStage, test.modules]);

  const handleStageSummaryNext = useCallback(() => {
    if (currentStage === 1) {
      setCurrentStage(2);
      setPhase("intro");
    } else {
      setPhase("final");
    }
  }, [currentStage]);

  const handleTimeUp = useCallback(() => {
    const s1 = computeModuleScore(test.modules[0]);
    const s2 = computeModuleScore(test.modules[1]);
    setStage1Score(s1);
    setStage2Score(s2);
    setPhase("final");
    if (onFinish && !reported) {
      onFinish({ testId: test.meta.id, stage1Correct: s1.correct, stage1Total: s1.total, stage2Correct: s2.correct, stage2Total: s2.total });
      setReported(true);
    }
  }, [computeModuleScore, onFinish, reported, test]);

  useEffect(() => {
    if (phase !== "final" || !onFinish || reported) return;
    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(test.modules[1]);
    onFinish({ testId: test.meta.id, stage1Correct: s1.correct, stage1Total: s1.total, stage2Correct: s2.correct, stage2Total: s2.total });
    setReported(true);
  }, [phase, onFinish, reported, stage1Score, stage2Score, computeModuleScore, test]);

  // 전체 문항 수 / 답한 문항 수 계산 (진행률 표시용)
  const { totalQ, answeredQ } = useMemo(() => {
    let total = 0, answered = 0;
    for (const item of currentModule.items) {
      const qs = item.taskKind === "academic_passage"
        ? (item as RAcademicPassageItem).questions
        : item.taskKind === "daily_life"
        ? (item as RDailyLifeItem).questions
        : [];
      total += qs.length;
      for (const q of qs) { if (answers[q.id]) answered++; }
    }
    return { totalQ: total, answeredQ: answered };
  }, [currentModule, answers]);

  // ── Intro / Summary / Final ──────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <StageIntroCard stage={currentStage} module={currentModule} onStart={() => setPhase("items")} />
      </div>
    );
  }

  if (phase === "stageSummary") {
    const score = currentStage === 1
      ? (stage1Score ?? computeModuleScore(test.modules[0]))
      : (stage2Score ?? computeModuleScore(test.modules[1]));
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <StageSummaryCard stage={currentStage} score={score} onNext={handleStageSummaryNext} />
      </div>
    );
  }

  if (phase === "final") {
    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(test.modules[1]);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <FinalSummaryCard stage1={s1} stage2={s2} />
      </div>
    );
  }

  // ── Items phase ──────────────────────────────────────────────
  // academic_passage 아이템만 분리 처리, 나머지는 심플 뷰
  const academicItems = currentModule.items.filter((i) => i.taskKind === "academic_passage") as RAcademicPassageItem[];
  const otherItems = currentModule.items.filter((i) => i.taskKind !== "academic_passage");

  return (
    <div className="flex h-full flex-col">
      {/* ── 상단 헤더 ── */}
      <header className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-emerald-700">Reading · Stage {currentStage} / 2</span>
          <span className="hidden text-xs text-gray-400 sm:block">·</span>
          <span className="hidden text-xs text-gray-500 sm:block">{test.meta.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* 진행률 */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 sm:block">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: totalQ ? `${(answeredQ / totalQ) * 100}%` : "0%" }}
              />
            </div>
            <span>{answeredQ} / {totalQ}</span>
          </div>
          <Timer
            totalSeconds={30 * 60}
            direction="down"
            autoStart
            clampToZero
            showControls={false}
            onExpireAction={handleTimeUp}
            className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-xs font-mono font-semibold text-emerald-800"
          />
        </div>
      </header>

      {/* ── 본문 ── */}
      <div className="flex-1 overflow-hidden">
        {/* Academic passage 아이템: 좌우 분할 */}
        {academicItems.map((item) => (
          <AcademicPassageSplitView
            key={item.id}
            item={item}
            answers={answers}
            onAnswer={handleAnswer}
          />
        ))}

        {/* 그 외 아이템 (complete_words, daily_life) */}
        {otherItems.length > 0 && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {otherItems.map((item) => (
              <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
                {item.taskKind === "complete_words" && (
                  <CompleteWordsItemView item={item as RCompleteWordsItem} answers={answers} onAnswer={handleAnswer} />
                )}
                {item.taskKind === "daily_life" && (
                  <DailyLifeItemView item={item as RDailyLifeItem} answers={answers} onAnswer={handleAnswer} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 하단 Finish 버튼 ── */}
      <footer className="shrink-0 flex items-center justify-between border-t bg-white px-4 py-2">
        <span className="text-xs text-gray-400">
          {answeredQ < totalQ ? `${totalQ - answeredQ}문항 미답변` : "모든 문항 답변 완료"}
        </span>
        <button
          type="button"
          onClick={handleStageFinish}
          className="rounded-lg border border-emerald-500 bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          {currentStage === 1 ? "Finish Stage 1" : "Finish Reading"}
        </button>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  Academic Passage Split View
 *  좌: 지문 스크롤 | 우: 문제 1개씩 네비게이션
 * ───────────────────────────────────────────────────────────── */
function AcademicPassageSplitView({
  item,
  answers,
  onAnswer,
}: {
  item: RAcademicPassageItem;
  answers: Record<string, string>;
  onAnswer: (item: RReadingItem, questionId: string, choiceId: string) => void;
}) {
  const questions = item.questions;
  const [qIndex, setQIndex] = useState(0);
  const passageRef = useRef<HTMLDivElement>(null);

  const currentQ = questions[qIndex];
  const answered = answers[currentQ?.id];

  return (
    <div className="flex h-full">
      {/* ── 좌: 지문 ── */}
      <div
        ref={passageRef}
        className="w-1/2 h-full overflow-y-auto border-r bg-white p-6"
      >
        <div
          className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: item.passageHtml }}
        />
      </div>

      {/* ── 우: 문제 ── */}
      <div className="w-1/2 h-full flex flex-col bg-gray-50">
        {/* 문제 번호 탭 */}
        <div className="shrink-0 flex flex-wrap gap-1 border-b bg-white px-4 py-2">
          {questions.map((q, i) => {
            const done = !!answers[q.id];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setQIndex(i)}
                className={`h-7 w-7 rounded text-xs font-medium transition ${
                  i === qIndex
                    ? "bg-emerald-600 text-white"
                    : done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {q.number}
              </button>
            );
          })}
        </div>

        {/* 현재 문제 */}
        <div className="flex-1 overflow-y-auto p-5">
          {currentQ && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-900 leading-snug">
                {qIndex + 1}. {currentQ.stem}
              </p>
              <div className="space-y-2">
                {currentQ.choices.map((c) => {
                  const selected = answered === c.id;
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQ.id}
                        checked={selected}
                        onChange={() => onAnswer(item, currentQ.id, c.id)}
                        className="mt-0.5 shrink-0 accent-emerald-600"
                      />
                      <span>{c.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 이전 / 다음 */}
        <div className="shrink-0 flex items-center justify-between border-t bg-white px-4 py-2">
          <button
            type="button"
            disabled={qIndex === 0}
            onClick={() => setQIndex((i) => i - 1)}
            className="rounded-lg border px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ← 이전
          </button>
          <span className="text-xs text-gray-400">{qIndex + 1} / {questions.length}</span>
          <button
            type="button"
            disabled={qIndex === questions.length - 1}
            onClick={() => setQIndex((i) => i + 1)}
            className="rounded-lg border border-emerald-400 px-4 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  기타 item views (변경 없음)
 * ───────────────────────────────────────────────────────────── */
type ItemViewProps<T extends RReadingItem> = {
  item: T;
  answers: Record<string, string>;
  onAnswer: (item: RReadingItem, questionId: string, choiceIdOrToken: string) => void;
};

function CompleteWordsItemView({ item, answers, onAnswer }: ItemViewProps<RCompleteWordsItem>) {
  const blanks = Array.isArray(item.blanks) ? item.blanks : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: item.paragraphHtml }} />
      <div className="flex flex-col gap-2">
        {blanks.map((blank, idx) => (
          <div key={blank.id ?? idx} className="flex items-center gap-2 text-sm">
            <span className="w-20 text-xs font-medium text-gray-500">Blank {idx + 1}</span>
            <input
              type="text"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              value={answers[blank.id] ?? ""}
              onChange={(e) => onAnswer(item, blank.id, e.target.value.trim())}
              placeholder="Type the missing letters"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyLifeItemView({ item, answers, onAnswer }: ItemViewProps<RDailyLifeItem>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-sm" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
      <div className="flex flex-col gap-3">
        {item.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-1 text-sm">
            <div className="font-medium">Q{q.number}. {q.stem}</div>
            <div className="flex flex-col gap-1">
              {q.choices.map((c) => {
                const checked = answers[q.id] === c.id;
                return (
                  <label key={c.id} className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1 text-sm transition ${checked ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
                    <input type="radio" name={q.id} className="mt-[3px]" checked={checked} onChange={() => onAnswer(item, q.id, c.id)} />
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

/* ─────────────────────────────────────────────────────────────
 *  Intro / Summary / Final 카드
 * ───────────────────────────────────────────────────────────── */
function StageIntroCard({ stage, module, onStart }: { stage: 1 | 2; module: RReadingModule; onStart: () => void }) {
  const qCount = module.items.reduce((n, item) => {
    if (item.taskKind === "academic_passage") return n + (item as RAcademicPassageItem).questions.length;
    if (item.taskKind === "daily_life") return n + (item as RDailyLifeItem).questions.length;
    return n;
  }, 0);

  return (
    <section className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-md text-center space-y-4">
      <div className="text-4xl">{stage === 1 ? "📖" : "🎯"}</div>
      <h2 className="text-lg font-bold text-gray-900">Stage {stage} — {stage === 1 ? "Routing Module" : "Final Module"}</h2>
      <p className="text-sm text-gray-500">
        {stage === 1
          ? "Your performance on this module determines the difficulty of Stage 2."
          : "This is the final module. Stay focused and answer every question."}
      </p>
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
        {qCount} questions · 30 min
      </div>
      <div>
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          Start Stage {stage}
        </button>
      </div>
    </section>
  );
}

function StageSummaryCard({ stage, score, onNext }: { stage: 1 | 2; score: { correct: number; total: number }; onNext: () => void }) {
  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
  return (
    <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-md text-center space-y-4">
      <div className="text-4xl">{pct >= 70 ? "✅" : "📝"}</div>
      <h2 className="text-lg font-bold text-gray-900">Stage {stage} Complete</h2>
      <div className="text-3xl font-bold text-emerald-700">{score.correct} / {score.total}</div>
      <p className="text-sm text-gray-500">
        {stage === 1 ? "Your Stage 2 module has been selected based on your performance." : "You've completed the Reading section."}
      </p>
      <button type="button" onClick={onNext} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">
        {stage === 1 ? "Continue to Stage 2 →" : "View Final Summary →"}
      </button>
    </section>
  );
}

function FinalSummaryCard({ stage1, stage2 }: { stage1: { correct: number; total: number }; stage2: { correct: number; total: number } }) {
  const total = stage1.correct + stage2.correct;
  const outOf = stage1.total + stage2.total;
  const pct = outOf ? Math.round((total / outOf) * 100) : 0;
  return (
    <section className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 shadow-md space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">🏁</div>
        <h2 className="text-xl font-bold text-gray-900">Reading Complete</h2>
        <div className="text-4xl font-bold text-emerald-700">{pct}%</div>
        <p className="text-sm text-gray-500">{total} / {outOf} correct</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[{ label: "Stage 1", s: stage1 }, { label: "Stage 2", s: stage2 }].map(({ label, s }) => (
          <div key={label} className="rounded-xl border bg-gray-50 p-3 text-center">
            <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-bold text-gray-900">{s.correct} / {s.total}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-gray-400">
        In the real TOEFL, Stage 1 performance selects your Stage 2 difficulty and together determine your scaled score.
      </p>
    </section>
  );
}
