// apps/web/app/(protected)/reading-2026/page.tsx
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Reading2026Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Reading 2026</h1>
      <p className="text-sm text-neutral-600">
        Study Mode(학습 플로우)와 Test Mode(실전 모의고사)를 선택해서 시작할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/reading-2026/study"
          className="block rounded-lg border bg-white px-4 py-6 text-left shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50"
        >
          <div className="text-sm font-semibold">Study Mode</div>
          <div className="mt-1 text-xs text-neutral-500">
            Assisted 모드로 지문을 풀고, Review & Daily Task까지 이어지는 학습 사이클을 시작합니다.
          </div>
        </Link>

        <Link
          href="/reading-2026/test"
          className="block rounded-lg border bg-white px-4 py-6 text-left shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50"
        >
          <div className="text-sm font-semibold">Test Mode</div>
          <div className="mt-1 text-xs text-neutral-500">
            데모 시험 패킷을 포함한 실전 모의고사를 볼 수 있습니다.
          </div>
        </Link>
      </div>
    </div>
  );
}
