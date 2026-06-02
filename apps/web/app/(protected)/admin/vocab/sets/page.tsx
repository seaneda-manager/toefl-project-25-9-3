// apps/web/app/(protected)/admin/vocab/sets/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminVocabSetsPage() {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("vocab_sets_with_counts")
    .select("id, title, description, grade_band, level, source_label, word_count, item_count, created_at")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-400">어드민 / LEXiOX 어휘</div>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">단어 책 목록</h1>
          <p className="mt-1 text-sm text-neutral-500">등록된 vocab set(단어 책) 목록입니다</p>
        </div>
        <Link
          href="/admin/vocab/import"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          + CSV 업로드
        </Link>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          조회 실패: {error.message}
        </div>
      )}

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">전체 세트</div>
          <div className="mt-2 text-3xl font-bold text-violet-700">{rows.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">전체 단어 수</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {rows.reduce((sum, r) => sum + (r.word_count ?? 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">평균 단어 수</div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {rows.length > 0
              ? Math.round(rows.reduce((sum, r) => sum + (r.word_count ?? 0), 0) / rows.length).toLocaleString()
              : 0}
          </div>
        </div>
      </div>

      {/* 목록 테이블 */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-semibold text-neutral-900">
          세트 목록 ({rows.length})
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-neutral-400">
            등록된 단어 책이 없습니다.{" "}
            <Link href="/admin/vocab/import" className="text-violet-600 underline">CSV 업로드</Link>로 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium [&>th]:whitespace-nowrap">
                  <th>제목</th>
                  <th>출처</th>
                  <th>학년대</th>
                  <th>레벨</th>
                  <th>단어 수</th>
                  <th>아이템 수</th>
                  <th>등록일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-neutral-50 [&>td]:px-4 [&>td]:py-3">
                    <td>
                      <div className="font-medium text-neutral-900">{row.title}</div>
                      {row.description && (
                        <div className="mt-0.5 text-xs text-neutral-400 truncate max-w-xs">{row.description}</div>
                      )}
                    </td>
                    <td>
                      {row.source_label ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          {row.source_label}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td>
                      {row.grade_band ? (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                          {row.grade_band}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="text-neutral-600">{row.level ?? "—"}</td>
                    <td>
                      <span className="font-semibold text-neutral-900">
                        {row.word_count?.toLocaleString() ?? "—"}
                      </span>
                    </td>
                    <td className="text-neutral-600">{row.item_count?.toLocaleString() ?? "—"}</td>
                    <td className="text-xs text-neutral-400">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/admin/vocab/Tracks?set=${row.id}`}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        배포
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex gap-3 text-sm">
        <Link href="/admin/vocab/import" className="text-violet-600 hover:underline">→ CSV 업로드</Link>
        <Link href="/admin/vocab/Tracks" className="text-violet-600 hover:underline">→ 트랙 배포</Link>
        <Link href="/admin/vocab/words" className="text-violet-600 hover:underline">→ 단어 목록</Link>
      </div>
    </main>
  );
}
