import Link from "next/link";
import { BookOpenCheck, UploadCloud } from "lucide-react";
import ReadingTestJsonUploaderClient from "./_client/ReadingTestJsonUploaderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Reading2026NewTestPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Link
              href="/admin/content"
              className="rounded-full border px-2 py-1 text-[11px] hover:border-emerald-400 hover:text-emerald-700"
            >
              콘텐츠 허브
            </Link>
            <span>·</span>
            <Link
              href="/admin/content/new"
              className="rounded-full border px-2 py-1 text-[11px] hover:border-emerald-400 hover:text-emerald-700"
            >
              공통 생성
            </Link>
            <span>·</span>
            <Link
              href="/admin/content/reading-2026"
              className="rounded-full border px-2 py-1 text-[11px] hover:border-emerald-400 hover:text-emerald-700"
            >
              Reading 2026 목록
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
            공통 Content Hub에서 Reading 생성이 선택되면 이 전용 생성기로 들어온다.
            JSON 형식의 Reading 2026 시험 데이터를 업로드해서{" "}
            <code className="rounded bg-gray-100 px-1">reading_tests_2026</code>{" "}
            테이블에 새 테스트를 생성한다.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-3 text-[11px] text-gray-700">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <h2 className="mb-1 text-xs font-semibold text-gray-900">사용 방법</h2>
            <ol className="list-inside list-decimal space-y-1">
              <li>로컬에서 Reading 2026 JSON 파일을 준비합니다.</li>
              <li>오른쪽 업로드 영역에 드래그하거나 파일을 선택합니다.</li>
              <li>형식 검증이 통과하면 새 테스트가 저장됩니다.</li>
              <li>저장 후 목록 또는 수정 화면으로 이동해 후속 편집을 진행합니다.</li>
            </ol>
          </div>

          <div className="rounded-xl border bg-amber-50 p-3 text-[11px] text-amber-900 shadow-sm">
            <h3 className="mb-1 text-xs font-semibold">JSON 스키마 힌트</h3>
            <p>
              <code>RReadingTest2026</code> 구조를 따르는 JSON이어야 합니다.
              <br />
              <code>meta.id</code> 값은 무시되거나 DB 저장 기준으로 재정렬될 수 있습니다.
            </p>
          </div>

          <div className="rounded-xl border bg-emerald-50 p-3 text-[11px] text-emerald-900 shadow-sm">
            <h3 className="mb-1 text-xs font-semibold">현재 v1 정책</h3>
            <p>
              이번 스프린트에서는 공통 Content Hub는 허브 역할,
              실제 Reading 생성/수정은 기존 Reading 2026 전용 플로우를 재사용합니다.
            </p>
          </div>
        </div>

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
