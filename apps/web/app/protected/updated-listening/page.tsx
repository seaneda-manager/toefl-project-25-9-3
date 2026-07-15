// apps/web/app/(protected)/updated-listening/page.tsx
import Link from 'next/link';
import SectionGuide from '@/app/components/SectionGuide';

export const dynamic = 'force-dynamic';

export default function Listening2026Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Listening 2026</h1>

      <SectionGuide
        storageKey="guide-seen-updated-listening"
        color="violet"
        icon="🎧"
        title="리스닝"
        tagline="Study Mode로 유형별 감각을 익히고, Test Mode로 실전 어댑티브 테스트를 경험합니다."
        outcomes={[
          '짧은 응답(Short Response)·대화·공지·강의 등 4가지 유형을 구분하고 전략적으로 접근할 수 있다',
          '음원을 한 번만 듣고 핵심 정보를 포착하는 능력을 기른다',
          '2단계 어댑티브 구조(Stage 1 → Stage 2)에 익숙해져 실전 감각을 높인다',
        ]}
        steps={[
          { icon: '📚', title: 'Study Mode', desc: '문항 유형별로 천천히 익히는 학습 모드입니다. 오답 리뷰와 스크립트 확인이 가능합니다.' },
          { icon: '🎯', title: 'Test Mode', desc: '시간 제한이 있는 2단계 어댑티브 실전 모의고사입니다. Study를 충분히 반복한 뒤 점검용으로 활용하세요.' },
        ]}
        nextAction={{ label: 'Study Mode 시작', href: '/updated-listening/study' }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/updated-listening/study"
          className="block rounded-lg border bg-white px-4 py-6 text-left shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50"
        >
          <div className="text-sm font-semibold">Study Mode</div>
          <div className="mt-1 text-xs text-neutral-500">
            유형별 학습 사이클로 리스닝 실력을 쌓습니다.
          </div>
        </Link>

        <Link
          href="/updated-listening/test"
          className="block rounded-lg border bg-white px-4 py-6 text-left shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50"
        >
          <div className="text-sm font-semibold">Test Mode</div>
          <div className="mt-1 text-xs text-neutral-500">
            2단계 어댑티브 실전 모의고사를 응시합니다.
          </div>
        </Link>
      </div>
    </div>
  );
}
