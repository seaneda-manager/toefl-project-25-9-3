'use client';

import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Reading / Listening / Speaking / Writing 콘텐츠와 내신 운영 기능을 관리하는 공간입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">내신 허브</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            내신 리딩 운영과 시험 범위(scope) 조립 기능으로 들어가는 메인 허브입니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/naesin')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              Open Naesin Hub
            </button>
            <button
              type="button"
              onClick={() => go('/admin/naesin/scopes')}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
            >
              시험 범위 관리
            </button>
          </div>
        </section>

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

        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Reading 2026 Editor</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            2026형 Reading 콘텐츠 편집기로 바로 진입합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/content/reading-2026/new')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              Open Editor
            </button>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">LEXiOX-Gram Editor</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            Grammar 챕터(유닛) 별 설명·드릴·Stylistic 문제를 편집합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/content/grammar-2026')}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
            >
              Open Editor
            </button>
          </div>
        </section>

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

        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm md:col-span-2 lg:col-span-3">
          <h2 className="text-sm font-semibold">최근 작업 &amp; 운영 영역</h2>
          <p className="mt-2 text-xs text-neutral-600">
            지금은 내신 허브와 시험 범위 관리가 연결되어 있고, 이후 Reading 리뷰/분석, Assignment, Student / Parent,
            Grammar / Listening / Writing 운영 기능을 계속 붙여갈 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
