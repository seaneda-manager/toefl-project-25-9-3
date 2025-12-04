// apps/web/app/(protected)/admin/content/reading-2026/page.tsx
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { BookOpenCheck, PlusCircle, RefreshCcw } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReadingTestRow = {
  id: string;
  label: string;
  exam_era: string | null;
  updated_at: string | null;
};

function formatUpdatedAt(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate() + 0).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default async function Reading2026AdminListPage() {
  let tests: ReadingTestRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = await getServerSupabase();

    const { data, error } = await supabase
      .from("reading_tests_2026")
      .select("id,label,exam_era,updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      loadError = error.message ?? "Unknown Supabase error";
      tests = [];
    } else {
      tests = data ?? [];
    }
  } catch (e: any) {
    loadError = e?.message ?? "Unknown server error";
    tests = [];
  }

  const totalCount = tests.length;
  const latestUpdated =
    tests.length > 0 ? formatUpdatedAt(tests[0].updated_at) : "-";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* 헤더 */}
      <header className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Admin · Reading 2026
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
              Reading 2026 – 테스트 관리
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Adaptive/세트용 Reading 2026 테스트를 JSON 구조로 저장·관리하는
              Admin 화면입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/content/reading-2026/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              새 테스트 만들기
            </Link>
          </div>
        </div>

        {/* 에러가 있다면 화면에 표시 */}
        {loadError && (
          <div className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-900">
            <p className="font-semibold">Supabase 읽기 오류</p>
            <p className="mt-0.5">{loadError}</p>
          </div>
        )}

        {/* 요약 카드 */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-3 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">
                저장된 Reading 2026 테스트
              </span>
              <BookOpenCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-gray-900">
              {totalCount}
            </div>
            <p className="mt-1 text-[11px] text-gray-600">
              Supabase{" "}
              <code className="rounded bg-gray-100 px-1">reading_tests_2026</code>{" "}
              기준입니다.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">
                마지막 수정 시각
              </span>
              <RefreshCcw className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-900">
              {latestUpdated}
            </div>
            <p className="mt-1 text-[11px] text-gray-600">
              가장 최근에 저장된 테스트 기준입니다.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3 text-xs shadow-sm">
            <span className="text-[11px] font-medium text-gray-500">
              사용 Tip
            </span>
            <p className="mt-2 text-[11px] text-gray-700">
              · JSON Import/Export로 세트 복제
              <br />
              · id를 기준으로 upsert 저장
              <br />
              · examEra로 2026/향후 버전 구분
            </p>
          </div>
        </section>
      </header>

      {/* 리스트 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Reading 2026 테스트 목록
          </h2>
          <p className="text-[11px] text-gray-500">
            행을 클릭하거나 &quot;수정&quot; 버튼을 누르면 Editor 화면으로 이동합니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="hidden border-b bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-500 md:grid md:grid-cols-5">
            <div>ID</div>
            <div>Label</div>
            <div>examEra</div>
            <div>Updated</div>
            <div className="text-right">Action</div>
          </div>

          {tests.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-500">
              아직 저장된 Reading 2026 테스트가 없습니다.
              <br />
              <Link
                href="/admin/content/reading-2026/new"
                className="mt-2 inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
              >
                새 테스트를 만들어보세요.
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {tests.map((t) => (
                <div
                  key={t.id}
                  className="px-3 py-3 text-xs hover:bg-emerald-50/40 md:grid md:grid-cols-5 md:items-center md:px-4"
                >
                  {/* ID */}
                  <div className="font-mono text-[11px] text-gray-700">
                    {t.id}
                  </div>

                  {/* Label */}
                  <div className="mt-1 md:mt-0">
                    <div className="font-semibold text-gray-900">
                      {t.label}
                    </div>
                  </div>

                  {/* examEra */}
                  <div className="mt-1 md:mt-0">
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                      {t.exam_era ?? "ibt_2026"}
                    </span>
                  </div>

                  {/* Updated */}
                  <div className="mt-1 text-[11px] text-gray-600 md:mt-0">
                    {formatUpdatedAt(t.updated_at)}
                  </div>

                  {/* Action */}
                  <div className="mt-2 flex justify-end md:mt-0">
                    <Link
                      href={`/admin/content/reading-2026/${t.id}`}
                      className="inline-flex items-center rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      수정
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
