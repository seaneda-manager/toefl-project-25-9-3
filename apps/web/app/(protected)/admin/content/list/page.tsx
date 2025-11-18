// apps/web/app/(protected)/admin/content/list/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  set_id: string | null;
  title: string | null;
  updated_at: string | null;
  questions_count?: number | null;
};

export default async function AdminContentListPage() {
  const supabase = await getServerSupabase();

  // 시도 A: 질문 수까지 함께(관계 count). 실패하면 시도 B로 폴백.
  let rows: Row[] = [];
  let errorMsg: string | null = null;

  const a = await supabase
    .from("reading_passages")
    .select(
      `
      id,
      set_id,
      title,
      updated_at,
      reading_questions:reading_questions(count)
    `
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!a.error && a.data) {
    rows = (a.data as any[]).map((r) => ({
      id: r.id,
      set_id: r.set_id ?? null,
      title: r.title ?? "",
      updated_at: r.updated_at ?? null,
      questions_count:
        typeof r.reading_questions?.[0]?.count === "number"
          ? r.reading_questions[0].count
          : null,
    }));
  } else {
    // 시도 B: 기본 필드만
    const b = await supabase
      .from("reading_passages")
      .select("id, set_id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (!b.error && b.data) {
      rows = b.data.map((r) => ({
        id: (r as any).id,
        set_id: (r as any).set_id ?? null,
        title: (r as any).title ?? "",
        updated_at: (r as any).updated_at ?? null,
        questions_count: null,
      }));
    } else {
      errorMsg = a.error?.message || b.error?.message || "Query failed";
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">콘텐츠 목록 (Reading)</h1>
        <Link
          href="/content/reading/editor"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          title="Advanced Reading Editor로 이동"
        >
          Advanced Editor로 새로 만들기
        </Link>
      </header>

      {errorMsg ? (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
          <div className="font-medium mb-1">목록을 불러오지 못했습니다.</div>
          <div className="opacity-75">{errorMsg}</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded border p-6 text-sm text-gray-600">
          아직 등록된 Passage가 없습니다. 우측 상단 버튼으로 새로 만들어 보세요.
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">제목</th>
                <th className="p-2 text-left">세트/ID</th>
                <th className="p-2 text-left">질문 수</th>
                <th className="p-2 text-left">업데이트</th>
                <th className="p-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.title || "(무제)"}</td>
                  <td className="p-2">
                    {(r.set_id ?? "(no-set)") + " / " + r.id.slice(0, 8)}
                  </td>
                  <td className="p-2">
                    {typeof r.questions_count === "number"
                      ? r.questions_count
                      : "—"}
                  </td>
                  <td className="p-2">
                    {r.updated_at
                      ? new Date(r.updated_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-2 text-right">
                    <Link
                      href={`/content/reading/editor?passageId=${encodeURIComponent(
                        r.id
                      )}`}
                      className="rounded border px-2 py-1 hover:bg-gray-50"
                      title="Advanced Editor로 편집"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
