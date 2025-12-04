// apps/web/app/(protected)/admin/content/reading-2026/new/page.tsx
import Link from "next/link";
import { BookOpenCheck, UploadCloud } from "lucide-react";
import ReadingTestJsonUploaderClient from "./_client/ReadingTestJsonUploaderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Reading2026NewTestPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
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
              Admin · Reading 2026 · New
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Reading 2026 – 새 테스트 만들기
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            JSON 형식의 Reading 2026 시험 데이터를 업로드해서{" "}
            <code className="rounded bg-gray-100 px-1">reading_tests_2026</code>{" "}
            테이블에 새 테스트를 생성합니다.
          </p>
        </div>
      </header>

      {/* 본문 레이아웃 */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* 왼쪽: 설명 */}
        <div className="space-y-3 text-[11px] text-gray-700">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <h2 className="mb-1 text-xs font-semibold text-gray-900">
              사용 방법
            </h2>
            <ol className="list-inside list-decimal space-y-1">
              <li>로컬에서 Reading 2026 JSON 파일을 준비합니다.</li>
              <li>오른쪽 JSON 업로드 영역에 드래그하거나 파일을 선택합니다.</li>
              <li>형식 검증이 통과하면 새로운 ID로 테스트가 저장됩니다.</li>
            </ol>
          </div>

          <div className="rounded-xl border bg-amber-50 p-3 text-[11px] text-amber-900 shadow-sm">
            <h3 className="mb-1 text-xs font-semibold">JSON 스키마 힌트</h3>
            <p>
              <code>RReadingTest2026</code> 구조를 따르는 JSON이어야 합니다.
              <br />
              <code>meta.id</code> 값은 무시되고, DB에서 부여되는 ID가 사용될 수
              있습니다.
            </p>
          </div>
        </div>

        {/* 오른쪽: 실제 업로더 영역 */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-900">
            <UploadCloud className="h-4 w-4 text-emerald-500" />
            <span>JSON 업로드</span>
          </div>

          <ReadingTestJsonUploaderClient />
        </div>
      </section>
    </main>
  );
}
