// apps/web/app/(protected)/student/review/reading/[resultId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import type {
  RReadingTest2026,
  RReadingModule,
  RReadingItem,
  RAcademicPassageItem,
  RQuestion,
  RChoice,
} from "@/models/reading";
import { ArrowLeft, FileQuestion, BookOpen, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type AnswerPayload = {
  questionId: string;
  number: number;
  chosenChoiceId: string | null;
};

type FlatQuestion = {
  id: string;
  number: number;
  stem: string;
  passageHtml: string;
  choices: { id: string; text: string }[];
};

function buildFlatQuestions(test: RReadingTest2026): FlatQuestion[] {
  const modules: RReadingModule[] = test.modules ?? [];
  const result: FlatQuestion[] = [];

  modules.forEach((mod: RReadingModule) => {
    mod.items.forEach((item: RReadingItem) => {
      if (item.taskKind !== "academic_passage") return;
      const passageItem = item as RAcademicPassageItem;
      const passageHtml = passageItem.passageHtml ?? "";
      const questions: RQuestion[] = passageItem.questions ?? [];

      questions.forEach((q: RQuestion) => {
        const choices: RChoice[] = q.choices ?? [];
        result.push({
          id: q.id,
          number: q.number,
          stem: q.stem,
          passageHtml,
          choices: choices.map((c) => ({
            id: c.id,
            text: c.text,
          })),
        });
      });
    });
  });

  return result;
}

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export default async function StudentReadingReviewDetailPage({ params }: PageProps) {
  const { resultId } = await params;

  const supabase = await getServerSupabase();

  // 1) 결과 로드
  const { data: resultRow, error: resultError } = await supabase
    .from("reading_results_2026")
    .select("id,test_id,user_id,total_questions,finished_at,answers")
    .eq("id", resultId)
    .maybeSingle();

  if (resultError) {
    console.error("StudentReadingReviewDetailPage result error", resultError);
  }

  if (!resultRow || !resultRow.test_id) {
    notFound();
  }

  // 2) 대응하는 테스트 payload 로드
  const { data: testRow, error: testError } = await supabase
    .from("reading_tests_2026")
    .select("id,label,payload")
    .eq("id", resultRow.test_id)
    .maybeSingle();

  if (testError) {
    console.error("StudentReadingReviewDetailPage test error", testError);
  }

  if (!testRow || !testRow.payload) {
    notFound();
  }

  const test = testRow.payload as RReadingTest2026;
  const flatQuestions = buildFlatQuestions(test);

  const answers: AnswerPayload[] = Array.isArray(resultRow.answers)
    ? (resultRow.answers as AnswerPayload[])
    : [];

  const answerMap = new Map<string, AnswerPayload>();
  answers.forEach((a) => {
    if (a && a.questionId) {
      answerMap.set(a.questionId, a);
    }
  });

  const finishedAt = resultRow.finished_at
    ? new Date(resultRow.finished_at).toLocaleString("ko-KR")
    : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* 상단 헤더 */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/student/review"
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            리뷰 리스트로
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div className="space-y-1 text-xs">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <FileQuestion className="h-3 w-3" />
              Reading 2026 · Review
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              {testRow.label ?? "Reading Test"}
            </h1>
            <p className="text-[11px] text-gray-600">
              Result ID: <span className="font-mono text-gray-700">{resultRow.id}</span>
            </p>
            <p className="text-[11px] text-gray-600">
              Test ID: <span className="font-mono text-gray-700">{testRow.id}</span>
            </p>
          </div>

          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium text-gray-700">완료 시각: </span>
              {finishedAt ?? "정보 없음"}
            </div>
            <div>
              <span className="font-medium text-gray-700">문항 수: </span>
              {resultRow.total_questions ?? flatQuestions.length} 문항
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              V1: 내가 선택한 보기만 표시합니다. 정답/해설 연동은 이후 단계에서 추가 예정입니다.
            </p>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃: 좌 지문 / 우 문항 리스트 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 지문 영역: 일단 첫 passage만 표시 (V1) */}
        <section className="rounded-xl border bg-white p-3 text-sm leading-relaxed">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>Passage (첫 지문 미리보기)</span>
          </div>

          {flatQuestions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <span>이 결과와 연결된 academic_passage 문항이 없습니다.</span>
            </div>
          ) : (
            <div
              className="prose prose-sm max-h-[70vh] overflow-auto"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: flatQuestions[0].passageHtml ?? "",
              }}
            />
          )}
        </section>

        {/* 문항 + 내 답안 영역 */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FileQuestion className="h-4 w-4 text-emerald-600" />
            문항별 선택 보기
          </h2>

          {flatQuestions.length === 0 ? (
            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
              연결된 문항이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {flatQuestions.map((q) => {
                const ans = answerMap.get(q.id) ?? null;
                const chosenId = ans?.chosenChoiceId ?? null;
                const chosenChoice = q.choices.find((c) => c.id === chosenId);

                return (
                  <article
                    key={q.id}
                    className="rounded-xl border bg-white p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">
                        Q{q.number}. {q.stem}
                      </div>
                      <div className="text-[10px] text-gray-500">Question ID: {q.id}</div>
                    </div>

                    <div className="mt-2 space-y-1">
                      {q.choices.map((c, idx) => {
                        const letter = String.fromCharCode("A".charCodeAt(0) + idx);
                        const isChosen = c.id === chosenId;

                        return (
                          <div
                            key={c.id}
                            className={[
                              "flex items-start gap-2 rounded-md border px-2 py-1",
                              isChosen
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-gray-200 bg-gray-50 text-gray-800",
                            ].join(" ")}
                          >
                            <span className="mt-0.5 text-[11px] font-semibold">{letter}.</span>
                            <span className="text-[11px]">{c.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2 text-[11px] text-gray-600">
                      {chosenChoice ? (
                        <>
                          <span className="font-semibold text-emerald-700">
                            내가 고른 답:&nbsp;
                          </span>
                          <span>{chosenChoice.text}</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700">
                          <AlertCircle className="h-3 w-3" />
                          이 문항은 선택하지 않았습니다. (무응답)
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
