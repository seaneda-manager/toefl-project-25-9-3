// apps/web/components/reading/ReadingRunner2026.tsx
"use client";

import { useMemo, useState } from "react";
import ReadingTestLayout2026 from "./ReadingTestLayout2026";
import type {
  RReadingTest2026,
  RReadingModule,
  RCompleteWordsItem,
  RDailyLifeItem,
  RAcademicPassageItem,
  RReadingItem,
} from "@/models/reading";

/**
 * 한 화면에 표시될 플랫한 문항 구조
 */
type FlatQuestion =
  | {
      kind: "complete_words";
      module: RReadingModule;
      item: RCompleteWordsItem;
      question: null;
    }
  | {
      kind: "daily_life";
      module: RReadingModule;
      item: RDailyLifeItem;
      question: any;
    }
  | {
      kind: "academic_passage";
      module: RReadingModule;
      item: RAcademicPassageItem;
      question: any;
    };

type RunnerResult = {
  answers: Record<string, unknown>;
};

type Props = {
  test: RReadingTest2026;
  onFinish?: (result: RunnerResult) => void;
};

/**
 * ReadingRunner2026
 * - Complete Words: 전체 페이지 1컬럼 (좌측에 지문 + 우측에 빈칸 목록)
 * - Daily Life / Academic: 좌 지문 / 우 문제 (2컬럼)
 */
export default function ReadingRunner2026({ test, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  // 1) Stage1 + Stage2 → FlatQuestion[]
  const allQuestions: FlatQuestion[] = useMemo(() => {
    const result: FlatQuestion[] = [];

    for (const module of test.modules as RReadingModule[]) {
      for (const item of module.items as RReadingItem[]) {
        if (item.taskKind === "complete_words") {
          result.push({
            kind: "complete_words",
            module,
            item,
            question: null,
          });
        } else if (item.taskKind === "daily_life") {
          const q =
            item.questions && item.questions.length > 0
              ? item.questions[0]
              : null;

          result.push({
            kind: "daily_life",
            module,
            item,
            question: q,
          });
        } else if (item.taskKind === "academic_passage") {
          for (const q of item.questions) {
            result.push({
              kind: "academic_passage",
              module,
              item,
              question: q,
            });
          }
        }
      }
    }

    return result;
  }, [test]);

  const total = allQuestions.length;
  const current = allQuestions[index];

  // 공통: 답안 저장
  const handleAnswerChange = (qid: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  // 네비게이션
  const handleNext = () => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      // ✅ StudyClient가 기대하는 형태로 전달
      onFinish?.({ answers });
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };

  // Header
  const header = (
    <>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-neutral-800">Reading</span>
        <span className="text-xs text-neutral-500">
          Question {index + 1} of {total}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          className="rounded-full border border-neutral-300 px-4 py-1 text-xs font-medium text-neutral-700 disabled:opacity-40"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          {index === total - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </>
  );

  // Left Panel (지문/공지/Complete Words 지문)
  const left = (() => {
    if (!current) return null;

    // A) Complete Words → 지시문 + 단락
    if (current.kind === "complete_words") {
      return (
        <div className="space-y-4 text-sm leading-relaxed text-neutral-800">
          <div>
            <p className="font-semibold">Complete the Words</p>
            <p className="mt-1 text-xs text-neutral-500">
              Read the paragraph and fill in the missing letters.
            </p>
          </div>

          <article
            className="prose max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: current.item.paragraphHtml }}
          />
        </div>
      );
    }

    // B) Daily Life → 공지/이메일 카드
    if (current.kind === "daily_life") {
      return (
        <div className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm leading-relaxed">
          <div
            dangerouslySetInnerHTML={{
              __html: current.item.contentHtml,
            }}
          />
        </div>
      );
    }

    // C) Academic Passage
    if (current.kind === "academic_passage") {
      return (
        <article
          className="prose max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: current.item.passageHtml }}
        />
      );
    }

    return null;
  })();

  // Right Panel (문제 1개 / Complete Words 입력칸)
  const right = (() => {
    if (!current) return null;

    // ✅ Complete Words → 각 빈칸별 텍스트 입력
    if (current.kind === "complete_words") {
      const blanks = current.item.blanks ?? [];

      return (
        <div className="space-y-4 text-sm text-neutral-800">
          <p className="font-medium">
            Type the missing letters for each blank.
          </p>

          {blanks.length === 0 ? (
            <p className="text-xs text-neutral-500">
              (No blanks defined in this item.)
            </p>
          ) : (
            <div className="space-y-3">
              {blanks.map((blank) => {
                const blankKey = `${current.item.id}__blank_${
                  blank.id ?? blank.order
                }`;
                const value = (answers[blankKey] as string) ?? "";

                return (
                  <div
                    key={blankKey}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                      {blank.order}
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleAnswerChange(blankKey, e.target.value)
                      }
                      className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Type the missing letters"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Daily Life / Academic → 객관식 문항
    const q = current.question;
    if (!q) return null;
    const qid = q.id ?? `q-${index}`;

    return (
      <div className="space-y-4 text-sm text-neutral-800">
        <p className="font-medium">{q.stem ?? q.prompt ?? "Question"}</p>

        {Array.isArray(q.choices) && (
          <ul className="space-y-2">
            {q.choices.map((choice: any) => {
              const cid = choice.id ?? choice.value;
              const checked = answers[qid] === cid;

              return (
                <li key={cid}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name={qid}
                      value={cid}
                      checked={!!checked}
                      onChange={() => handleAnswerChange(qid, cid)}
                      className="h-4 w-4"
                    />
                    <span>
                      {choice.label ?? choice.text ?? String(choice.value)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  })();

  return <ReadingTestLayout2026 header={header} left={left} right={right} />;
}
