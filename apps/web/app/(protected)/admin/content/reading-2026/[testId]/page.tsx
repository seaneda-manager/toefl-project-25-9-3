// apps/web/app/(protected)/admin/content/reading-2026/[testId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import type { RReadingTest2026 } from "@/models/reading";
import { BookOpenCheck } from "lucide-react";
import ReadingTestFormClient from "./_client/ReadingTestFormClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { testId: string };
};

export default async function Reading2026EditPage({ params }: PageProps) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("reading_tests_2026")
    .select("id,label,payload,exam_era,updated_at")
    .eq("id", params.testId)
    .maybeSingle();

  if (error || !data) {
    console.error("Reading2026EditPage load error", error);
    notFound();
  }

  const rawPayload = data.payload as RReadingTest2026 | null;

  if (!rawPayload) {
    console.error("Reading2026EditPage: no payload for test", data.id);
    notFound();
  }

  // 🔧 meta 정리: DB에 있는 id/label을 우선으로 맞춰줌
  const initial: RReadingTest2026 = {
    ...rawPayload,
    meta: {
      ...(rawPayload.meta ?? {}),
      id: data.id,
      label: data.label,
      examEra:
        (rawPayload.meta?.examEra ??
          "ibt_2026") as RReadingTest2026["meta"]["examEra"],
    },
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* 헤더 */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Link
              href="/admin/content/reading-2026"
              className="rounded-full border px-2 py-1 text-[11px] hover:border-emerald-400 hover:text-emerald-700"
            >
              목록으로
            </Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Admin · Reading 2026 · Edit
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Reading 2026 – 테스트 수정
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            ID <code className="rounded bg-gray-100 px-1">{data.id}</code> 인
            시험을 폼 방식으로 수정합니다.
          </p>
        </div>
      </header>

      {/* ✅ 클라이언트 래퍼에 initial만 넘긴다 (함수 X) */}
      <ReadingTestFormClient initial={initial} />
    </main>
  );
}
