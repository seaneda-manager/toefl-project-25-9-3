'use client';

import ReadingRunnerBridge from '@/components/test/ReadingRunnerBridge';

/**
 * 레거시 예시 데이터 (import 대체 가능)
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
    // ... 추가 문항
  ],
};

/**
 * 레거시 -> 러너 스키마 어댑터
 * - passage -> content
 * - prompt -> stem
 * - options[] -> choices[]
 * - id/number/type 등은 그대로 사용(문자열 보정)
 */
function toRunnerData(legacy: typeof oldData) {
  return {
    title: legacy.title ?? '',
    content: legacy.passage ?? '',
    questions: (legacy.questions ?? []).map((q) => ({
      id: String(q.id ?? ''),
      number: q.number ?? 0,
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
      // 필요하면 레거시의 추가 메타도 보존
      meta: {
        paragraphIndex: q.paragraphIndex ?? null,
      },
    })),
  };
}

export default function Page() {
  const runnerData = toRunnerData(oldData);

  return (
    <ReadingRunnerBridge
      data={runnerData} // 레거시 포맷을 새 포맷으로 변환한 결과
      mode="study"
      onFinish={(sid: string) => console.log('Reading finished:', sid)}
    />
  );
}
