'use client';

import { useRouter } from 'next/navigation';

export default function AdminNaesinPage() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Naesin Admin</h1>
        <p className="mt-1 text-sm text-neutral-600">
          내신 리딩 운영, 시험 범위 조립, 이후 Grammar / Listening / Writing 확장을 위한 허브입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">시험 범위 관리</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            학교 / 학년 / 학기 / 시험유형별 scope를 만들고, 범위 item을 조립합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/naesin/scopes')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              시험 범위 관리
            </button>
            <button
              type="button"
              onClick={() => go('/admin/naesin/scopes/new')}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800 hover:bg-neutral-50"
            >
              새 범위 만들기
            </button>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Reading 2026 Editor</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            Reading 2026 콘텐츠를 생성하고, 이후 내신 리딩 자산과 연결해갈 수 있는 입구입니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => go('/admin/content/reading-2026/new')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
            >
              Reading 2026 Editor
            </button>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">내신 운영 로드맵</h2>
          <p className="mt-2 flex-1 text-xs text-neutral-600">
            Drill, Final Review, Mock Test, Assignment, Student / Parent 관리로 확장할 예정입니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-500">
              Grammar Soon
            </span>
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-500">
              Listening Soon
            </span>
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-500">
              Writing Soon
            </span>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border bg-white p-4 shadow-sm md:col-span-2 xl:col-span-3">
          <h2 className="text-sm font-semibold">현재 연결된 흐름</h2>
          <p className="mt-2 text-xs leading-6 text-neutral-600">
            시험 범위 관리 → scope 상세 → scope item 추가/수정/정렬/복제/삭제 흐름까지 연결되어 있습니다.
            이제 이 허브를 기준으로 Reading 관련 관리자 기능과 내신 운영 기능을 점점 이어 붙이면 됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
