"use client";

import { useMemo, useState } from "react";
import type { RReadingTest2026 } from "@/models/reading";

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

    test.modules.forEach((mod, mIdx) => {
      mod.items.forEach((item: any, iIdx) => {
        if (item.taskKind !== "academic_passage") return;
        const passageHtml: string = item.passageHtml ?? "";
        const questions = item.questions ?? [];
        questions.forEach((q: any, qIdx: number) => {
          result.push({
            moduleIndex: mIdx,
            itemIndex: iIdx,
            questionIndex: qIdx,
            id: q.id,
            number: q.number,
            stem: q.stem,
            choices: (q.choices ?? []).map((c: any) => ({
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleFinish() {
    setFinished(true);
    setSaving(true);
    setSaveError(null);

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

    try {
      const res = await fetch("/api/reading-2026/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveError(data.error ?? "Failed to save result");
      }
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save result");
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      void handleFinish();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  }

  const progressLabel = `Question ${currentIndex + 1} of ${total}`;
  const answeredCount = Object.values(answers).filter(
    (v) => v !== undefined && v !== null
  ).length;

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
            className="max-h-[70vh] overflow-auto prose prose-sm"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: current.passageHtml }}
          />
        </div>

        {/* 문제 영역 */}
        <div className="w-1/2 flex flex-col rounded-md border bg-white p-3">
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
                Answered: {answeredCount} / {total}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-md border bg-black px-3 py-1 text-xs font-medium text-white"
              disabled={saving}
            >
              {currentIndex === total - 1 ? "Finish" : "Next"}
            </button>
          </div>

          {finished && (
            <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              Test finished. {saving ? "Saving result..." : "Result saved (or tried)."}
            </div>
          )}

          {saveError && (
            <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {saveError}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
