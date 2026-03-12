export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import NaesinReviewClient, {
  type NaesinReviewData,
  type NaesinReviewPassage,
  type NaesinReviewQuestion,
} from "@/components/reading/review/NaesinReviewClient";

type Params = Promise<{ sessionId: string }>;

type SessionRow = {
  id: string;
  set_id: string;
  score_raw: number | null;
  score_percent: number | null;
  submitted_at: string | null;
  analytics_snapshot: Record<string, unknown> | null;
};

type SetRow = {
  id: string;
  title: string | null;
};

type PassageRow = {
  id: string;
  title: string | null;
  text: string;
  order_index: number | null;
};

type QuestionRow = {
  id: string;
  set_id: string;
  passage_id: string;
  number_label: string | null;
  order_index: number | null;
  type: string;
  stem: string;
  explanation: string | null;
  answer_key: any;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  order_index: number | null;
  label: string | null;
  text: string;
  is_correct: boolean | null;
};

type AnswerRow = {
  question_id: string;
  selected_choice_id: string | null;
  selected_choice_ids: string[] | null;
  is_correct: boolean;
};

type EvidenceRow = {
  question_id: string;
  order_index: number | null;
  quote: string | null;
};

export default async function Page({
  params,
}: {
  params: Params;
}) {
  const { sessionId } = await params;
  const supabase = await getServerSupabase();

  try {
    const { data: sessionRow, error: sessionError } = await supabase
      .from("naesin_reading_sessions")
      .select("id, set_id, score_raw, score_percent, submitted_at, analytics_snapshot")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionRow) {
      throw new Error(sessionError?.message ?? "Session not found");
    }

    const session = sessionRow as SessionRow;

    const { data: setRow, error: setError } = await supabase
      .from("naesin_reading_sets")
      .select("id, title")
      .eq("id", session.set_id)
      .single();

    if (setError || !setRow) {
      throw new Error(setError?.message ?? "Set not found");
    }

    const readingSet = setRow as SetRow;

    const { data: passageRows, error: passageError } = await supabase
      .from("naesin_reading_passages")
      .select("id, title, text, order_index")
      .eq("set_id", session.set_id)
      .order("order_index", { ascending: true });

    if (passageError) throw passageError;

    const passages = (passageRows ?? []) as PassageRow[];
    const passageIds = passages.map((p) => p.id);

    const { data: questionRows, error: questionError } =
      passageIds.length > 0
        ? await supabase
          .from("naesin_reading_questions")
          .select(
            "id, set_id, passage_id, number_label, order_index, type, stem, explanation, answer_key",
          )
          .in("passage_id", passageIds)
          .order("order_index", { ascending: true })
        : { data: [], error: null as any };

    if (questionError) throw questionError;

    const questions = (questionRows ?? []) as QuestionRow[];
    const questionIds = questions.map((q) => q.id);

    const { data: choiceRows, error: choiceError } =
      questionIds.length > 0
        ? await supabase
          .from("naesin_reading_choices")
          .select("id, question_id, order_index, label, text, is_correct")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true })
        : { data: [], error: null as any };

    if (choiceError) throw choiceError;

    const { data: answerRows, error: answerError } =
      questionIds.length > 0
        ? await supabase
          .from("naesin_reading_answers")
          .select("question_id, selected_choice_id, selected_choice_ids, is_correct")
          .eq("session_id", sessionId)
        : { data: [], error: null as any };

    if (answerError) throw answerError;

    const { data: evidenceRows, error: evidenceError } =
      questionIds.length > 0
        ? await supabase
          .from("naesin_reading_evidence")
          .select("question_id, order_index, quote")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true })
        : { data: [], error: null as any };

    if (evidenceError) throw evidenceError;

    const choicesByQuestion = new Map<string, ChoiceRow[]>();
    for (const row of (choiceRows ?? []) as ChoiceRow[]) {
      const bucket = choicesByQuestion.get(row.question_id) ?? [];
      bucket.push(row);
      choicesByQuestion.set(row.question_id, bucket);
    }

    const answersByQuestion = new Map<string, AnswerRow>();
    for (const row of (answerRows ?? []) as AnswerRow[]) {
      answersByQuestion.set(row.question_id, row);
    }

    const evidenceByQuestion = new Map<string, EvidenceRow[]>();
    for (const row of (evidenceRows ?? []) as EvidenceRow[]) {
      const bucket = evidenceByQuestion.get(row.question_id) ?? [];
      bucket.push(row);
      evidenceByQuestion.set(row.question_id, bucket);
    }

    const questionsByPassage = new Map<string, QuestionRow[]>();
    for (const row of questions) {
      const bucket = questionsByPassage.get(row.passage_id) ?? [];
      bucket.push(row);
      questionsByPassage.set(row.passage_id, bucket);
    }

    const reviewPassages: NaesinReviewPassage[] = passages.map((passage) => {
      const passageQuestions = (questionsByPassage.get(passage.id) ?? []).sort(
        (a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0),
      );

      const reviewQuestions: NaesinReviewQuestion[] = passageQuestions.map((question) => {
        const questionChoices = (choicesByQuestion.get(question.id) ?? []).sort(
          (a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0),
        );

        const answerRow = answersByQuestion.get(question.id);
        const selectedIds = buildSelectedChoiceIds(answerRow);
        const correctIds = extractCorrectChoiceIds(question.answer_key);

        return {
          id: question.id,
          passageId: passage.id,
          numberLabel: question.number_label ?? "",
          type: question.type,
          stem: question.stem,
          isCorrect: Boolean(answerRow?.is_correct),
          selectedChoiceTexts: questionChoices
            .filter((choice) => selectedIds.includes(choice.id))
            .map((choice) => choice.text ?? ""),
          correctChoiceTexts: questionChoices
            .filter((choice) => correctIds.includes(choice.id))
            .map((choice) => choice.text ?? ""),
          explanation: question.explanation ?? undefined,
          officialEvidence: ((evidenceByQuestion.get(question.id) ?? []) as EvidenceRow[])
            .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
            .map((row) => row.quote ?? "")
            .filter(Boolean),
        };
      });

      return {
        id: passage.id,
        title: passage.title ?? `Passage ${Number(passage.order_index ?? 0) + 1}`,
        text: passage.text,
        questions: reviewQuestions,
      };
    });

    const reviewData: NaesinReviewData = {
      sessionId,
      setId: session.set_id,
      setTitle: readingSet.title ?? "Naesin Reading",
      scoreRaw: session.score_raw,
      scorePercent: session.score_percent,
      submittedAt: session.submitted_at,
      analyticsSnapshot: session.analytics_snapshot ?? null,
      passages: reviewPassages,
    };

    return (
      <div className="px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Lingo-X Naesin Review
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">
              {readingSet.title ?? "Naesin Review"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/lingox/reading/ms/test?setId=${encodeURIComponent(session.set_id)}`}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Retry Test
            </Link>
            <Link
              href="/admin/content/list"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Back to List
            </Link>
          </div>
        </div>

        <NaesinReviewClient data={reviewData} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          내신 review 데이터를 불러오지 못했습니다.
          <div className="mt-2 text-xs text-red-600">
            {String(error?.message || error || "unknown error")}
          </div>
        </div>
      </div>
    );
  }
}

function buildSelectedChoiceIds(answer?: AnswerRow): string[] {
  if (!answer) return [];
  const many = Array.isArray(answer.selected_choice_ids)
    ? answer.selected_choice_ids.map(String)
    : [];
  const single =
    typeof answer.selected_choice_id === "string" && answer.selected_choice_id
      ? [String(answer.selected_choice_id)]
      : [];
  return [...many, ...single];
}

function extractCorrectChoiceIds(answerKey: any): string[] {
  if (!answerKey || typeof answerKey !== "object" || !("kind" in answerKey)) {
    return [];
  }

  switch (answerKey.kind) {
    case "single_choice":
      return typeof answerKey.choiceId === "string" ? [answerKey.choiceId] : [];
    case "multi_choice":
      return Array.isArray(answerKey.choiceIds)
        ? answerKey.choiceIds.map(String)
        : [];
    default:
      return [];
  }
}
