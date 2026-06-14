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
import { ArrowLeft, FileQuestion } from "lucide-react";
import ReadingReviewV2, { type FlatQuestion } from "./ReadingReviewV2";

export const dynamic = "force-dynamic";

type AnswerPayload = {
  questionId: string;
  number: number;
  chosenChoiceId: string | null;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildFlatQuestions(test: RReadingTest2026): FlatQuestion[] {
  const modules: RReadingModule[] = test.modules ?? [];
  const result: FlatQuestion[] = [];

  modules.forEach((mod: RReadingModule) => {
    mod.items.forEach((item: RReadingItem) => {
      if (item.taskKind !== "academic_passage") return;
      const passageItem = item as RAcademicPassageItem;
      const passageHtml = passageItem.passageHtml ?? "";
      const passageText = stripHtml(passageHtml);
      const questions: RQuestion[] = passageItem.questions ?? [];

      questions.forEach((q: RQuestion) => {
        const choices = (q.choices ?? []).map((c: RChoice) => ({
          id: c.id,
          text: c.text,
          isCorrect: c.is_correct === true || (c as any).isCorrect === true,
          explain: c.explain ?? null,
        }));

        result.push({
          id: q.id,
          number: q.number,
          type: q.type ?? "detail",
          stem: q.stem,
          passageHtml,
          passageText,
          choices,
          rationale: q.explanation?.rationale ?? null,
          clueQuote: q.explanation?.clue_quote ?? null,
        });
      });
    });
  });

  return result;
}

type PageProps = { params: Promise<{ resultId: string }> };

export default async function StudentReadingReviewDetailPage({ params }: PageProps) {
  const { resultId } = await params;
  const supabase = await getServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: resultRow, error: resultError } = await supabase
    .from("reading_results_2026")
    .select("id,test_id,user_id,total_questions,finished_at,answers")
    .eq("id", resultId)
    .maybeSingle();

  if (resultError) console.error("ReadingReview result error", resultError);
  if (!resultRow?.test_id) notFound();

  const { data: testRow, error: testError } = await supabase
    .from("reading_tests_2026")
    .select("id,label,payload")
    .eq("id", resultRow.test_id)
    .maybeSingle();

  if (testError) console.error("ReadingReview test error", testError);
  if (!testRow?.payload) notFound();

  const test = testRow.payload as RReadingTest2026;
  const flatQuestions = buildFlatQuestions(test);

  const answers: AnswerPayload[] = Array.isArray(resultRow.answers)
    ? (resultRow.answers as AnswerPayload[])
    : [];

  const answerMap: Record<string, string | null> = {};
  answers.forEach((a) => {
    if (a?.questionId) answerMap[a.questionId] = a.chosenChoiceId ?? null;
  });

  const correctCount = flatQuestions.filter((q) => {
    const chosen = answerMap[q.id];
    return chosen && q.choices.find((c) => c.id === chosen)?.isCorrect;
  }).length;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="space-y-3">
        <Link
          href="/student/review"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-400 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          리뷰 목록으로
        </Link>

        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <FileQuestion className="h-3 w-3" />
            Reading · Review
          </div>
          <h1 className="mt-1 text-lg font-bold text-gray-900">
            {testRow.label ?? "Reading Test"}
          </h1>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {resultRow.finished_at ? new Date(resultRow.finished_at).toLocaleString("ko-KR") : "-"}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="font-semibold text-emerald-700 text-base">{correctCount}</span>
            <span className="text-gray-500">/ {flatQuestions.length} 정답</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              flatQuestions.length > 0 && correctCount / flatQuestions.length >= 0.7
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {flatQuestions.length > 0 ? Math.round(correctCount / flatQuestions.length * 100) : 0}%
            </span>
          </div>
        </div>
      </header>

      <ReadingReviewV2
        flatQuestions={flatQuestions}
        answerMap={answerMap}
      />
    </main>
  );
}
