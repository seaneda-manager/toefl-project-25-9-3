// apps/web/app/(protected)/reading/test/ClientRunner.tsx
'use client';

import TestRunnerV2 from '@/components/reading/runner/TestRunnerV2';
import type { RPassage } from '@/types/types-reading';

type StrictQuestion = {
  id: string;
  number: number;
  type:
    | 'vocab'
    | 'detail'
    | 'negative_detail'
    | 'paraphrasing'
    | 'insertion'
    | 'inference'
    | 'purpose'
    | 'pronoun_ref'
    | 'summary'
    | 'organization';
  stem: string;
  choices: { id: string; text: string }[];
  explanation?: string;
};

type StrictPassage = {
  id: string;
  title: string;    // 필수
  content: string;  // 필수
  questions: StrictQuestion[];
};

type ClientRunnerProps = {
  passage: RPassage | StrictPassage;   // 유연하게 받되 아래에서 보정
  sessionId: string;
  /** 완료 시 상위로 세션ID 전달 */
  onFinishAction?: (sessionId: string | number) => void; // ✅ 이름 통일
};

export default function ClientRunner({
  passage,
  sessionId,
  onFinishAction,
}: ClientRunnerProps) {
  // 엄격형으로 보정 (title/content 보장, questions 배열 보장)
  const p: StrictPassage = {
    id: String((passage as any).id),
    title: (passage as any).title ?? '',
    content: (passage as any).content ?? '',
    questions: Array.isArray((passage as any).questions)
      ? ((passage as any).questions as any[])
      : [],
  };

  return (
    <TestRunnerV2
      passage={p as any}
      sessionId={sessionId}
      onFinishAction={onFinishAction} // ✅ prop 이름 변경 반영
    />
  );
}
