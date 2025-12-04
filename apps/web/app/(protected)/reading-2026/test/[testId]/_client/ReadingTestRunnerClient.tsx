// apps/web/app/(protected)/reading-2026/test/[testId]/_client/ReadingTestRunnerClient.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  RReadingTest2026,
  RReadingModule,
  RReadingItem,
  RAcademicPassageItem,
  RQuestion,
  RChoice,
} from "../../../../../../models/reading";

type Choice = {
  id: string;
  text: string;
};

type FlatQuestion = {
  moduleIndex: number;
  itemIndex: number;
  questionIndex: number;
  id: string;
  number: number;
  stem: string;
  choices: Choice[];
  passageHtml: string;
};

type Props = {
  testId: string;
  label: string;
  test: RReadingTest2026;
};

export default function ReadingTestRunnerClient({ testId, label, test }: Props) {
  const flatQuestions = useMemo<FlatQuestion[]>(() => {
    const result: FlatQuestion[] = [];

    const modules: RReadingModule[] = test.modules;

    modules.forEach((mod: RReadingModule, mIdx: number) => {
      mod.items.forEach((item: RReadingItem, iIdx: number) => {
        if (item.taskKind !== "academic_passage") return;

        const passageItem = item as RAcademicPassageItem;
        const passageHtml: string = passageItem.passageHtml ?? "";
        const questions: RQuestion[] = passageItem.questions ?? [];

        questions.forEach((q: RQuestion, qIdx: number) => {
          const choices: RChoice[] = q.choices ?? [];
          result.push({
            moduleIndex: mIdx,
            itemIndex: iIdx,
            questionIndex: qIdx,
            id: q.id,
            number: q.number,
            stem: q.stem,
            choices: choices.map((c) => ({
              id: c.id,
              text: c.text,
            })),
            passageHtml,
          });
        });
      });
    });

    return result;
  }, [test]);

  const total = flatQuestions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [finished, setFinished] = useState(false);

  if (total === 0) {
    return (
      <div className="rounded-md border px-4 py-6 text-sm text-red-600">
        No academic_passage questions found in this test.
      </div>
    );
  }

  const current = flatQuestions[currentIndex];
  const currentAnswer = answers[current.id];

  function handleSelect(choiceId: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: choiceId }));
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      handleFinish();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  }

  async function handleFinish() {
    setFinished(true);

    const resultPayload = {
      testId,
      totalQuestions: total,
      answers: flatQuestions.map((q) => ({
        questionId: q.id,
        number: q.number,
        chosenChoiceId: answers[q.id] ?? null,
      })),
      finishedAt: new Date().toISOString(),
    };

    console.log("READING-2026 TEST FINISHED", resultPayload);

    // 🔽 API 호출 (route: /api/reading-2026/result)
    try {
      const res = await fetch("/api/reading-2026/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(
          "Failed to save reading-2026 result",
          res.status,
          data
        );
      }
    } catch (err) {
      console.error("reading-2026 result fetch error", err);
    }
  }

  const progressLabel = `Question ${currentIndex + 1} of ${total}`;

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b pb-2">
        <div>
          <h1 className="text-lg font-semibold">{label}</h1>
          <p className="text-xs text-gray-500">{progressLabel}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          Test ID: <span className="font-mono">{testId}</span>
        </div>
      </header>

      {/* 메인 영역: 지문 + 문항 */}
      <section className="flex gap-4">
        {/* 지문 영역 */}
        <div className="w-1/2 rounded-md border bg-white p-3 text-sm leading-relaxed">
          <div
            className="prose prose-sm max-h-[70vh] overflow-auto"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: current.passageHtml }}
          />
        </div>

        {/* 문제 영역 */}
        <div className="flex w-1/2 flex-col rounded-md border bg-white p-3">
          <div className="mb-2 text-xs text-gray-500">{progressLabel}</div>
          <div className="mb-4 text-sm font-medium">
            {current.number}. {current.stem}
          </div>

          <form className="flex flex-col gap-2 text-sm">
            {current.choices.map((choice, idx) => {
              const inputId = `${current.id}-${choice.id}`;
              const letter = String.fromCharCode("A".charCodeAt(0) + idx);
              return (
                <label
                  key={choice.id}
                  htmlFor={inputId}
                  className="flex items-start gap-2 rounded-md border px-2 py-1 hover:bg-gray-50"
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={`q-${current.id}`}
                    className="mt-1"
                    checked={currentAnswer === choice.id}
                    onChange={() => handleSelect(choice.id)}
                  />
                  <span>
                    <span className="mr-1 font-semibold">{letter}.</span>
                    {choice.text}
                  </span>
                </label>
              );
            })}
          </form>

          {/* 네비게이션 */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>
                Answered:{" "}
                {
                  Object.values(answers).filter(
                    (v) => v !== undefined && v !== null
                  ).length
                }{" "}
                / {total}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-md border bg-black px-3 py-1 text-xs font-medium text-white"
            >
              {currentIndex === total - 1 ? "Finish" : "Next"}
            </button>
          </div>

          {finished && (
            <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              Test finished. (saved result on server if no error)
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
