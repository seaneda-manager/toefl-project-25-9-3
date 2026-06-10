import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import LecturePlayerWrapper from "./_components/LecturePlayerWrapper";

export const dynamic = "force-dynamic";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default async function StudentLecturePage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const { lectureId } = await params;
  const supabase = await getServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: lec }, { data: questions }, { data: completion }] = await Promise.all([
    supabase
      .from("lectures")
      .select("id, title, description, youtube_url, duration_seconds")
      .eq("id", lectureId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("lecture_quiz_questions")
      .select("id, timestamp_seconds, question_text, blank_answer, hint")
      .eq("lecture_id", lectureId)
      .order("timestamp_seconds"),
    supabase
      .from("lecture_completions")
      .select("quiz_score, quiz_total")
      .eq("lecture_id", lectureId)
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);

  if (!lec) notFound();

  const lecture = lec as {
    id: string;
    title: string;
    description: string | null;
    youtube_url: string;
    duration_seconds: number | null;
  };

  const vid = youtubeId(lecture.youtube_url);
  if (!vid) notFound();

  type QuizQuestion = {
    id: string;
    timestamp_seconds: number;
    question_text: string;
    blank_answer: string;
    hint: string | null;
  };

  const quizList = (questions ?? []) as QuizQuestion[];
  const alreadyCompleted = !!completion;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-neutral-900">{lecture.title}</h1>
        {lecture.description && (
          <p className="text-sm text-neutral-500">{lecture.description}</p>
        )}
        {alreadyCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
            완료됨 · 퀴즈 {(completion as { quiz_score: number; quiz_total: number }).quiz_score}/{(completion as { quiz_score: number; quiz_total: number }).quiz_total}
          </span>
        )}
      </div>

      <LecturePlayerWrapper
        lectureId={lectureId}
        youtubeId={vid}
        questions={quizList}
        studentId={user.id}
      />

      {quizList.length > 0 && (
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            이 강의에는 퀴즈 {quizList.length}개가 포함되어 있습니다. 영상이 특정 구간에서 멈추면 빈칸을 채워야 다음으로 넘어갑니다.
          </p>
        </div>
      )}
    </main>
  );
}
