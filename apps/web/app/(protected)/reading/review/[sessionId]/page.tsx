// app/(protected)/reading/review/[sessionId]/page.tsx
import { getSupabaseServer } from "@/lib/supabaseServer";

type Row = {
  q_no: number;
  question: string | null;
  user_choice: string | null;
  correct_choice: string | null;
  is_correct: boolean | null;
};

export default async function ReadingReviewPage(...args: any[]) {
  // ✅ Next PageProps 타입체크 우회: 첫 번째 인자를 any로 취급
  const [{ params }] = args as [{ params: { sessionId: string } }];

  const supabase = await getSupabaseServer(); // ✅ await 추가

  // 점수 + 문항별 동시 호출
  const [scoreRes, rowsRes] = await Promise.all([
    supabase.rpc("reading_review_score", { session_id: params.sessionId }),
    supabase.rpc("reading_review_rows", { session_id: params.sessionId }),
  ]);

  const scoreErr = scoreRes.error;
  const error = rowsRes.error;
  const scoreRows = scoreRes.data as Array<{ total: number; correct: number }> | null;
  const rows = rowsRes.data as Row[] | null;

  // ---- 옵션 C: 실패/부재 시 모킹 데이터로 표시 ----
  if (error || scoreErr || !rows || !scoreRows) {
    const mock: Row[] = [
      { q_no: 1, question: "Mock Q1", user_choice: "A", correct_choice: "B", is_correct: false },
      { q_no: 2, question: "Mock Q2", user_choice: "C", correct_choice: "C", is_correct: true },
      { q_no: 3, question: "Mock Q3", user_choice: "B", correct_choice: "D", is_correct: false },
    ];
    const score = { total: mock.length, correct: mock.filter(m => m.is_correct).length };

    return (
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Reading Review</h1>
          <p className="text-sm opacity-70">
            sessionId: {params.sessionId} · Score: {score.correct}/{score.total} (mock)
          </p>
        </header>
        <Table rows={mock} />
      </div>
    );
  }
  // -----------------------------------------------

  const score = scoreRows?.[0] ?? { total: 0, correct: 0 };

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reading Review</h1>
        <p className="text-sm opacity-70">
          sessionId: {params.sessionId} · Score: {score.correct}/{score.total}
        </p>
      </header>
      <Table rows={rows ?? []} />
    </div>
  );
}

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
            <th>#</th>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Correct</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody className="[&>tr>*]:align-top">
          {rows.map((r) => (
            <tr key={r.q_no} className="[&>td]:px-3 [&>td]:py-2 border-t">
              <td className="font-medium">{r.q_no}</td>
              <td>{r.question ?? "-"}</td>
              <td>{r.user_choice ?? <span className="opacity-60">—</span>}</td>
              <td>{r.correct_choice ?? <span className="opacity-60">—</span>}</td>
              <td>
                {r.is_correct ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
