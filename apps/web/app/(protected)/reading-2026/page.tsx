// apps/web/app/(protected)/reading-2026/page.tsx
import Link from 'next/link';
import SectionGuide from '@/app/components/SectionGuide';

export const dynamic = 'force-dynamic';

export default function Reading2026Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Reading 2026</h1>

      <SectionGuide
        storageKey="guide-seen-reading-2026"
        color="sky"
        icon="📝"
        title="리딩"
        tagline="Study Mode로 학습 사이클을 쌓고, Test Mode로 실전 감각을 점검합니다."
        outcomes={[
          'TOEFL 지문의 구조(도입·전개·결론)를 빠르게 파악할 수 있다',
          '세부사항·추론·어휘·수사적 목적 문제 유형을 구분하고 전략적으로 접근할 수 있다',
          '실전과 같은 속도(지문당 20분)로 풀며 시간 압박 없이 답을 고를 수 있다',
        ]}
        steps={[
          { icon: '📚', title: 'Study Mode', desc: 'Assisted 방식으로 지문을 풀고 오답 리뷰 → Daily Task까지 이어지는 학습 사이클입니다. 처음에는 여기서 시작하세요.' },
          { icon: '🎯', title: 'Test Mode', desc: '시간 제한이 있는 실전 모의고사입니다. Study를 충분히 반복한 뒤 점검용으로 활용하세요.' },
        ]}
        nextAction={{ label: 'Study Mode 시작', href: '/reading-2026/study' }}
      />

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
