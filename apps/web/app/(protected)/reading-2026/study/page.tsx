// apps/web/app/(protected)/reading-2026/study/page.tsx
export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabaseServer';
import ReadingAdaptiveRunner2026 from '@/components/reading/ReadingAdaptiveRunner2026';
import type { RReadingTest2026 } from '@/models/reading';

type SearchParams = {
  testId?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  const testId = searchParams?.testId ?? 'reading-2026-demo-1';

  // ---- 데모용 RReadingTest2026 객체 ----
  // 타입을 완벽히 맞추는 게 목적이 아니라, 일단 화면을 돌려보는 게 목표라서
  // TS가 추천하는 방식대로 `unknown` → `RReadingTest2026` 순서로 캐스팅.
  const demoTest = ({
    meta: {
      id: testId,
      label: '2026 Demo Reading',
      // ExamEra 유니온에 정확한 값을 나중에 맞출 것. 지금은 데모라 any 느낌으로 우회.
      examEra: '2026-demo',
    },
    modules: [
      // ------- Stage 1 -------
      {
        id: 'stage1-module-1',
        label: 'Stage 1 Module (demo)',
        items: [
          {
            id: 'item1',
            taskKind: 'academic_passage',
            stage: 1,
            passageHtml:
              '<p>This is a short <strong>demo academic passage</strong> for the 2026 Reading runner.</p>',
            questions: [
              {
                id: 'q1',
                number: 1,
                stem: 'According to the passage, what is the main purpose of this demo?',
                choices: [
                  {
                    id: 'q1a',
                    text: 'To test the adaptive runner UI.',
                    isCorrect: true,
                  },
                  {
                    id: 'q1b',
                    text: 'To measure your real TOEFL score.',
                  },
                  {
                    id: 'q1c',
                    text: 'To explain academic research in detail.',
                  },
                  {
                    id: 'q1d',
                    text: 'To practice integrated writing.',
                  },
                ],
              },
            ],
          },
        ],
      },

      // ------- Stage 2 -------
      {
        id: 'stage2-module-1',
        label: 'Stage 2 Module (demo)',
        items: [
          {
            id: 'item2',
            taskKind: 'academic_passage',
            stage: 2,
            passageHtml:
              '<p>This is a <em>Stage 2</em> demo passage for the 2026 Reading runner.</p>',
            questions: [
              {
                id: 'q2',
                number: 2,
                stem: 'What happens when you finish this module?',
                choices: [
                  {
                    id: 'q2a',
                    text: 'onFinish is called with your scores.',
                    isCorrect: true,
                  },
                  {
                    id: 'q2b',
                    text: 'The app closes automatically.',
                  },
                  {
                    id: 'q2c',
                    text: 'Nothing happens.',
                  },
                  {
                    id: 'q2d',
                    text: 'You start Listening automatically.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as unknown) as RReadingTest2026;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <ReadingAdaptiveRunner2026 test={demoTest} />
    </div>
  );
}
