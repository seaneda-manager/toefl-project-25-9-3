// apps/web/app/(protected)/admin/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <div className="space-y-6">
      {/* 상단 제목 */}
      <div>
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Reading / Listening / Speaking / Writing 콘텐츠 세트와 문제를 관리하는 공간입니다.
        </p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Reading 관리 카드 */}
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Reading Sets</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            지문 / 문제 / 해설이 포함된 Reading 세트를 생성하고 수정합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/content/new?kind=reading')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              New Reading Set
            </button>
            <button
              type="button"
              onClick={() => go('/admin/content/list?kind=reading')}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
            >
              View All
            </button>
          </div>
        </section>

        {/* Listening 관리 카드 */}
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Listening Sets</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            대화 / 강의 오디오와 스크립트, 문제 세트를 생성하고 수정합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/content/new?kind=listening')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              New Listening Set
            </button>
            <button
              type="button"
              onClick={() => go('/admin/content/list?kind=listening')}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
            >
              View All
            </button>
          </div>
        </section>

        {/* Speaking 2026 관리 (앞으로 확장용) */}
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Speaking 2026</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            Listening &amp; Repeat, Take an Interview 등 2026형 Speaking 과제를 관리합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/speaking-2026')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              Open Manager
            </button>
            <span className="text-[11px] text-neutral-400">(* 라우트는 나중에 연결해도 됨)</span>
          </div>
        </section>

        {/* Writing 2026 관리 (앞으로 확장용) */}
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Writing 2026</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            2026형 Writing 과제 템플릿과 채점 기준, 샘플 답안을 관리합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/writing-2026')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              Open Manager
            </button>
            <span className="text-[11px] text-neutral-400">(* 라우트는 나중에 연결해도 됨)</span>
          </div>
        </section>

        {/* 최근 작업 / 통계 같은 요약 카드 (placeholder) */}
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm md:col-span-2 lg:col-span-3">
          <h2 className="text-sm font-semibold">최근 작업 &amp; 간단 통계</h2>
          <p className="mt-2 text-xs text-neutral-600">
            최근에 수정한 세트, 새로 추가된 콘텐츠, 사용량 등을 요약해서 보여줄 영역입니다.
            나중에 Supabase 쿼리 붙여서 실제 데이터로 채우면 돼요.
          </p>
        </section>
      </div>
    </div>
  );
}
