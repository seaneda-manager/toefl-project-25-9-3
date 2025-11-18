"use client";

import { useMemo, useState } from "react";
import type {
  RReadingTest2026,
  RReadingModule,
  RReadingItem,
  RCompleteWordsItem,
  RDailyLifeItem,
  RAcademicPassageItem,
} from "@/models/reading";
import Timer from "@/app/(protected)/reading/components/Timer"; // 경로는 프로젝트에 맞게 조정

type Props = {
  test: RReadingTest2026;
  onFinish?: (result: {
    testId: string;
    stage1Correct: number;
    stage1Total: number;
    stage2Correct: number;
    stage2Total: number;
    // 나중에 여기서 band_score 계산해도 됨
  }) => void;
};

/**
 * 2026 iBT Reading용 Adaptive Runner (Stage1 → Stage2)
 * - Stage1 완료 시 점수 계산
 * - 지금은 Stage2 모듈이 하나라고 가정 (test.modules[1])
 * - 나중에 정답률 기반 easy/hard 분기만 바꾸면 확장 가능
 */
export default function ReadingAdaptiveRunner2026({ test, onFinish }: Props) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stage1Score, setStage1Score] = useState<{
    correct: number;
    total: number;
  }>({
    correct: 0,
    total: 0,
  });

  const currentModule: RReadingModule = useMemo(
    () => test.modules[stage - 1],
    [test.modules, stage]
  );

  const items = currentModule.items;

  const handleAnswer = (
    _item: RReadingItem,
    questionId: string,
    choiceIdOrToken: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceIdOrToken,
    }));
  };

  const computeModuleScore = (module: RReadingModule) => {
    let correct = 0;
    let total = 0;

    for (const item of module.items) {
      if (item.taskKind === "complete_words") {
        for (const blank of item.blanks) {
          total += 1;
          const user = answers[blank.id];
          if (user && user === blank.correctToken) correct += 1;
        }
      } else {
        for (const q of item.questions) {
          total += 1;
          const user = answers[q.id];
          const correctChoice = q.choices.find(
            (c) => (c as any).isCorrect === true
          );
          if (user && correctChoice && user === correctChoice.id) correct += 1;
        }
      }
    }

    return { correct, total };
  };

  const handleNextModule = () => {
    if (stage === 1) {
      const score = computeModuleScore(test.modules[0]);
      setStage1Score(score);

      // TODO: 여기에서 score.correct / score.total 기준으로
      //       stage2 모듈을 난이도별로 선택(easy/hard)하는 로직 추가 가능
      setStage(2); // 현재는 그냥 두 번째 모듈로 고정

      return;
    }

    // stage === 2: 시험 종료
    const stage2Score = computeModuleScore(test.modules[1]);

    onFinish?.({
      testId: test.meta.id,
      stage1Correct: stage1Score.correct,
      stage1Total: stage1Score.total,
      stage2Correct: stage2Score.correct,
      stage2Total: stage2Score.total,
    });
  };

  const handleTimeUp = () => {
    // 시간 만료 시에도 동일하게 종료 처리
    if (stage === 1) {
      const score = computeModuleScore(test.modules[0]);
      setStage1Score(score);
      setStage(2);
    } else {
      const stage2Score = computeModuleScore(test.modules[1]);
      onFinish?.({
        testId: test.meta.id,
        stage1Correct: stage1Score.correct,
        stage1Total: stage1Score.total,
        stage2Correct: stage2Score.correct,
        stage2Total: stage2Score.total,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500">
            Reading – Module {stage} of 2
          </div>
          <h1 className="text-lg font-semibold">
            {test.meta.label ?? test.meta.id}
          </h1>
        </div>
        <div className="shrink-0">
          <Timer
            totalSeconds={30 * 60} // 2026 Reading: 최대 30분
            direction="down"
            autoStart
            clampToZero
            showControls={false}
            onExpireAction={handleTimeUp}
          />
        </div>
      </header>

      <main className="flex flex-col gap-6">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 text-xs font-semibold text-gray-500">
              Item {idx + 1} • {labelForTaskKind(item.taskKind)}
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
          onClick={handleNextModule}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          {stage === 1 ? "Go to Module 2" : "Finish Reading Section"}
        </button>
      </footer>
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
  return (
    <div className="flex flex-col gap-4">
      <div
        className="prose max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: item.paragraphHtml }}
      />
      <div className="flex flex-col gap-2">
        {item.blanks.map((blank, idx) => (
          <div key={blank.id} className="flex items-center gap-2 text-sm">
            <span className="w-16 text-xs text-gray-500">Blank {idx + 1}</span>
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

function DailyLifeItemView({
  item,
  answers,
  onAnswer,
}: ItemViewProps<RDailyLifeItem>) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-md border border-gray-200 bg-slate-50 p-3 text-sm"
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
                    className="flex cursor-pointer items-start gap-2"
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
          className="prose max-w-none text-sm"
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
                      className="flex cursor-pointer items-start gap-2"
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
