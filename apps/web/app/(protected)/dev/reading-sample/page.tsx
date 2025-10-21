// apps/web/app/(protected)/reading/test/page.tsx
'use client';

import ReadingRunnerBridge from '@/components/reading/runner/ReadingRunnerBridge';

/**
 * 데모용 레거시 데이터 (import 없이 이 파일에서 직접 정의)
 */
const oldData = {
  title: 'The Dawn of Public Libraries',
  passage:
    'In many cities, public libraries emerged not only as repositories of books but as shared community spaces...',
  questions: [
    {
      id: 1,
      number: 1,
      type: 'detail',
      prompt: 'What was a primary goal of early public library directors?',
      options: [
        { id: 'A', text: 'To restrict access to rare books' },
        { id: 'B', text: 'To promote open access and learning' },
        { id: 'C', text: 'To focus solely on private research' },
        { id: 'D', text: 'To replace schools with libraries' },
      ],
      paragraphIndex: 0,
    },
    // ... 더 많은 문항 가능
  ],
};

/**
 * 레거시 → 러너 포맷 매핑
 * - passage -> content
 * - prompt -> stem
 * - options[] -> choices[]
 * - id/number/type 문자열 보정
 */
function toRunnerData(legacy: typeof oldData) {
  return {
    id: 'demo-reading-set',
    title: legacy.title ?? '',
    content: legacy.passage ?? '',
    questions: (legacy.questions ?? []).map((q) => ({
      id: String(q.id ?? ''),
      number: Number.isFinite(q.number) ? q.number : 0,
      type:
        (q.type as
          | 'vocab'
          | 'detail'
          | 'negative_detail'
          | 'paraphrasing'
          | 'insertion'
          | 'inference'
          | 'purpose'
          | 'pronoun_ref'
          | 'summary'
          | 'organization') ?? 'detail',
      stem: q.prompt ?? '',
      choices: (q.options ?? []).map((o) => ({
        id: String(o.id ?? ''),
        text: o.text ?? '',
      })),
      meta: {
        paragraphIndex:
          typeof q.paragraphIndex === 'number' ? q.paragraphIndex : null,
      },
    })),
  };
}

export default function Page() {
  const runnerData = toRunnerData(oldData);

  return (
    <ReadingRunnerBridge
      data={runnerData}
      mode="study"
      onFinish={(sid: string) => console.log('Reading finished:', sid)}
    />
  );
}
