// apps/web/app/(protected)/student/review/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  FileQuestion,
  ArrowRight,
  AlertCircle,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawReadingResultRow = {
  id: string;
  test_id: string | null;
  user_id: string | null;
  total_questions: number | null;
  finished_at: string | null;
};

type ReadingResultRow = {
  id: string;
  testId: string;
  testLabel: string;
  finishedAt: string | null;
  totalQuestions: number;
};

export default async function StudentReviewPage() {
  const supabase = await getServerSupabase();

  // 1) 로그인 유저
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Review</h1>
        <p className="text-sm text-gray-600">
          이 페이지를 보려면 로그인이 필요합니다.
        </p>
      </main>
    );
  }

  // 2) 내 Reading 결과
  const { data: rawResults, error: resultsError } = await supabase
    .from("reading_results_2026")
    .select("id,test_id,user_id,total_questions,finished_at")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(50);

  if (resultsError) {
    console.error("StudentReviewPage reading_results_2026 error", resultsError);
  }

  const safeResults = (rawResults ?? []).filter(
    (r): r is RawReadingResultRow => !!r && !!r.id
  );

  // 3) label용 reading_tests_2026 조회
  const testIds = Array.from(
    new Set(
      safeResults
        .map((r) => r.test_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  let testLabelMap: Record<string, string> = {};

  if (testIds.length > 0) {
    const { data: tests, error: testsError } = await supabase
      .from("reading_tests_2026")
      .select("id,label")
      .in("id", testIds);

    if (testsError) {
      console.error("StudentReviewPage reading_tests_2026 error", testsError);
    }

    testLabelMap =
      tests?.reduce<Record<string, string>>((acc, t) => {
        if (t && t.id) acc[t.id] = t.label ?? t.id;
        return acc;
      }, {}) ?? {};
  }

  const rows: ReadingResultRow[] = safeResults.map((r) => ({
    id: r.id,
    testId: r.test_id ?? "(no test_id)",
    testLabel:
      (r.test_id && testLabelMap[r.test_id]) || r.test_id || "Unknown Test",
    finishedAt: r.finished_at,
    totalQuestions: r.total_questions ?? 0,
  }));

  const hasAny = rows.length > 0;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
          <History className="h-3.5 w-3.5" />
          Student · Review
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          테스트 리뷰
        </h1>
        <p className="text-xs text-gray-600">
          내가 푼 Reading 2026 테스트를 다시 열어, 각 문항에서 어떤 선택을 했는지
          복습할 수 있는 화면입니다. (V1: 선택 보기만 표시, 나중에 정답/해설 연동)
        </p>
      </header>

      {/* 리스트 섹션 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Reading 2026 테스트 기록
          </h2>
          {!hasAny && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
              <AlertCircle className="h-3 w-3" />
              아직 리뷰할 테스트가 없습니다.
            </span>
          )}
        </div>

        {!hasAny ? (
          <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
            <p>아직 저장된 Reading 테스트 결과가 없습니다.</p>
            <p className="mt-1">
              먼저{" "}
              <Link
                href="/reading-2026/study"
                className="font-semibold text-emerald-700 underline"
              >
                Reading 2026 연습
              </Link>
              에서 테스트를 완료한 뒤, 여기서 리뷰를 진행할 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="hidden border-b bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-500 md:grid md:grid-cols-5">
              <div className="col-span-2">시험</div>
              <div>완료 시간</div>
              <div>문항 수</div>
              <div className="text-right">리뷰</div>
            </div>

            <div className="divide-y">
              {rows.map((r) => (
                <article
                  key={r.id}
                  className="px-3 py-3 text-xs hover:bg-emerald-50/40 md:grid md:grid-cols-5 md:items-center md:px-4"
                >
                  {/* 시험 정보 */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-900">
                      <FileQuestion className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{r.testLabel}</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      Test ID: {r.testId}
                    </div>
                  </div>

                  {/* 완료 시간 */}
                  <div className="mt-2 text-[11px] text-gray-600 md:mt-0">
                    {r.finishedAt
                      ? new Date(r.finishedAt).toLocaleString("ko-KR")
                      : "시간 정보 없음"}
                  </div>

                  {/* 문항 수 */}
                  <div className="mt-2 text-[11px] text-gray-700 md:mt-0">
                    {r.totalQuestions} 문항
                  </div>

                  {/* 리뷰 버튼 -> 상세 페이지로 이동 */}
                  <div className="mt-3 flex justify-end md:mt-0">
                    <Link
                      href={`/student/review/reading/${r.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      리뷰하기
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
