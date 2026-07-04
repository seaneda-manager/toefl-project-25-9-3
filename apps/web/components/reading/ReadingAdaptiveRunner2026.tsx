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
  // Stage1 성적으로 결정된 Stage2 분기(hard/easy). Stage1을 마치는 순간 확정되고,
  // 이후엔 이 값을 그대로 씀 — Stage2 도중 점수가 계속 바뀌어도 분기가 흔들리지 않게.
  const [stage2Module, setStage2Module] = useState<RReadingModule | null>(null);

  // stage2Pool이 있으면 cutScore 기준으로 hard/easy를 고르고, 없으면 레거시 modules[1]로 폴백
  const resolveStage2Module = useCallback(
    (s1: { correct: number; total: number }): RReadingModule => {
      const pool = test.stage2Pool;
      if (!pool) return test.modules[1];
      const pct = s1.total > 0 ? s1.correct / s1.total : 0;
      return pct >= pool.cutScore ? pool.hard : pool.easy;
    },
    [test.stage2Pool, test.modules]
  );

  const effectiveStage2Module: RReadingModule = useMemo(
    () => stage2Module ?? resolveStage2Module(stage1Score ?? { correct: 0, total: 0 }),
    [stage2Module, stage1Score, resolveStage2Module]
  );

  const currentModule: RReadingModule = useMemo(
    () => (currentStage === 1 ? test.modules[0] : effectiveStage2Module),
    [currentStage, test.modules, effectiveStage2Module]
  );

  // 항목(complete_words / daily_life / academic_passage) 하나씩 순차 이동
  const [itemIndex, setItemIndex] = useState(0);
  useEffect(() => {
    setItemIndex(0);
  }, [currentModule]);

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
    const score = computeModuleScore(currentModule);
    if (currentStage === 1) {
      setStage1Score(score);
      // Stage1이 끝나는 순간 Stage2 분기를 확정
      setStage2Module(resolveStage2Module(score));
    } else {
      setStage2Score(score);
    }
    setPhase("stageSummary");
  }, [computeModuleScore, currentModule, currentStage, resolveStage2Module]);

  const handleStageSummaryNext = useCallback(() => {
    if (currentStage === 1) {
      setCurrentStage(2);
      setPhase("intro");
    } else {
      setPhase("final");
    }
  }, [currentStage]);

  const handleTimeUp = useCallback(() => {
    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = computeModuleScore(effectiveStage2Module);
    setStage1Score(s1);
    setStage2Score(s2);
    setPhase("final");
    if (onFinish && !reported) {
      onFinish({ testId: test.meta.id, stage1Correct: s1.correct, stage1Total: s1.total, stage2Correct: s2.correct, stage2Total: s2.total });
      setReported(true);
    }
  }, [computeModuleScore, effectiveStage2Module, onFinish, reported, stage1Score, test]);

  useEffect(() => {
    if (phase !== "final" || !onFinish || reported) return;
    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(effectiveStage2Module);
    onFinish({ testId: test.meta.id, stage1Correct: s1.correct, stage1Total: s1.total, stage2Correct: s2.correct, stage2Total: s2.total });
    setReported(true);
  }, [phase, onFinish, reported, stage1Score, stage2Score, computeModuleScore, effectiveStage2Module, test]);

  // 전체 문항 수 / 답한 문항 수 계산 (진행률 표시용, complete_words blanks 포함)
  const { totalQ, answeredQ } = useMemo(() => {
    let total = 0, answered = 0;
    for (const item of currentModule.items) {
      if (item.taskKind === "complete_words") {
        const cw = item as RCompleteWordsItem;
        total += cw.blanks.length;
        for (const b of cw.blanks) { if (answers[b.id]) answered++; }
        continue;
      }
      const qs = item.taskKind === "academic_passage"
        ? (item as RAcademicPassageItem).questions
        : (item as RDailyLifeItem).questions;
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
      : (stage2Score ?? computeModuleScore(effectiveStage2Module));
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <StageSummaryCard stage={currentStage} score={score} onNext={handleStageSummaryNext} />
      </div>
    );
  }

  if (phase === "final") {
    const s1 = stage1Score ?? computeModuleScore(test.modules[0]);
    const s2 = stage2Score ?? computeModuleScore(effectiveStage2Module);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <FinalSummaryCard stage1={s1} stage2={s2} />
      </div>
    );
  }

  // ── Items phase ──────────────────────────────────────────────
  // 항목을 한 번에 다 쌓지 않고 하나씩 순차로 보여줌 (지문마다 집중해서 풀도록)
  const items = currentModule.items;
  const activeItem = items[itemIndex];

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

      {/* ── 항목 탭 (지문 단위 이동) ── */}
      {items.length > 1 && (
        <div className="shrink-0 flex flex-wrap items-center gap-1 border-b bg-white px-4 py-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setItemIndex(i)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                i === itemIndex
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {i + 1}. {itemTypeLabel(item)}
            </button>
          ))}
        </div>
      )}

      {/* ── 본문: 현재 항목 하나만 ── */}
      <div className="flex-1 overflow-hidden">
        {activeItem?.taskKind === "academic_passage" && (
          <AcademicPassageSplitView
            key={activeItem.id}
            item={activeItem as RAcademicPassageItem}
            answers={answers}
            onAnswer={handleAnswer}
          />
        )}
        {activeItem && activeItem.taskKind !== "academic_passage" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              {activeItem.taskKind === "complete_words" && (
                <CompleteWordsItemView item={activeItem as RCompleteWordsItem} answers={answers} onAnswer={handleAnswer} />
              )}
              {activeItem.taskKind === "daily_life" && (
                <DailyLifeItemView item={activeItem as RDailyLifeItem} answers={answers} onAnswer={handleAnswer} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 하단: 항목 이동 + Finish ── */}
      <footer className="shrink-0 flex items-center justify-between border-t bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={itemIndex === 0}
            onClick={() => setItemIndex((i) => i - 1)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ← 이전 항목
          </button>
          <span className="text-xs text-gray-400">{itemIndex + 1} / {items.length}</span>
          <button
            type="button"
            disabled={itemIndex === items.length - 1}
            onClick={() => setItemIndex((i) => i + 1)}
            className="rounded-lg border border-emerald-400 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
          >
            다음 항목 →
          </button>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </footer>
    </div>
  );
}

function itemTypeLabel(item: RReadingItem): string {
  if (item.taskKind === "complete_words") return "Complete the Words";
  if (item.taskKind === "daily_life") return `Daily Life`;
  return "Academic Passage";
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
  // 지문 안에서 각 blank 자리에 번호 배지 + 입력칸을 바로 붙여서 보여줌 (Blank가 어디인지 한눈에 보이도록)
  const blanks = [...(Array.isArray(item.blanks) ? item.blanks : [])].sort((a, b) => a.order - b.order);
  const plainText = item.paragraphHtml.replace(/<[^>]+>/g, "");
  const parts = plainText.split("__");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-loose text-gray-900 whitespace-pre-wrap">
        {parts.map((part, i) => {
          const blank = blanks[i];
          if (!blank) return <span key={`part-${i}`}>{part}</span>;
          return (
            <span key={blank.id}>
              {part}
              <span className="mx-0.5 inline-flex items-center gap-1 align-middle">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={answers[blank.id] ?? ""}
                  onChange={(e) => onAnswer(item, blank.id, e.target.value.trim())}
                  maxLength={blank.correctToken.length}
                  className="rounded border border-emerald-400 bg-emerald-50 px-1.5 py-0.5 text-sm font-medium text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  style={{ width: `${blank.correctToken.length * 2 + 1}ch`, letterSpacing: "0.15em" }}
                  placeholder={Array(blank.correctToken.length).fill("_").join(" ")}
                />
              </span>
            </span>
          );
        })}
      </p>
    </div>
  );
}

// "Subject: ...\nDate: ...\nTo: ...\nFrom: ...\n\n본문" 같은 plain-text 이메일을
// 헤더/본문으로 분리. 매칭되는 헤더 줄이 하나도 없으면 null(=이메일 형태 아님)
function parseEmailContent(raw: string): { headers: { label: string; value: string }[]; body: string } | null {
  const lines = raw.split(/\r?\n/);
  const headerRe = /^(Subject|Date|To|From|Cc|Bcc)\s*:\s*(.*)$/i;
  const headers: { label: string; value: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") { i++; continue; }
    const m = lines[i].match(headerRe);
    if (!m) break;
    headers.push({ label: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), value: m[2].trim() });
    i++;
  }
  if (headers.length === 0) return null;
  return { headers, body: lines.slice(i).join("\n").trim() };
}

function EmailCard({ headers, body }: { headers: { label: string; value: string }[]; body: string }) {
  const subject = headers.find((h) => h.label === "Subject");
  const rest = headers.filter((h) => h.label !== "Subject");
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-3">
        {subject && <div className="text-base font-semibold text-gray-900">{subject.value}</div>}
        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
          {rest.map((h) => (
            <div key={h.label}>
              <span className="font-medium text-gray-600">{h.label}:</span> {h.value}
            </div>
          ))}
        </div>
      </div>
      <div className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-gray-800">{body}</div>
    </div>
  );
}

function DailyLifeItemView({ item, answers, onAnswer }: ItemViewProps<RDailyLifeItem>) {
  // 자동생성 콘텐츠는 이미 스타일이 입혀진 HTML이라 그대로 렌더링, 지문 붙여넣기로 들어온
  // plain text는 줄바꿈이 사라지지 않게 pre-wrap 처리하고, email이면 헤더/본문을 분리해서 보여줌
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(item.contentHtml);
  const plainText = item.contentHtml.replace(/<[^>]+>/g, "");
  const parsedEmail = !looksLikeHtml && item.contextType === "email" ? parseEmailContent(plainText) : null;

  return (
    <div className="flex flex-col gap-4">
      {looksLikeHtml ? (
        <div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-sm" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
      ) : parsedEmail ? (
        <EmailCard headers={parsedEmail.headers} body={parsedEmail.body} />
      ) : (
        <div className="whitespace-pre-wrap rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-sm leading-relaxed text-gray-800">
          {plainText}
        </div>
      )}
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
    if (item.taskKind === "complete_words") return n + (item as RCompleteWordsItem).blanks.length;
    return n;
  }, 0);
  const passageCount = module.items.length;

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
        {passageCount} passages · {qCount} questions · 30 min
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
