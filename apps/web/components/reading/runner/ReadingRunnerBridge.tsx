// apps/web/components/reading/runner/ReadingRunnerBridge.tsx
'use client';

import { useMemo } from 'react';
import TestRunnerV2 from '@/components/reading/runner/TestRunnerV2';

export type RChoice = { id: string; text: string; is_correct?: boolean };
export type RQuestion = {
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
  choices: RChoice[];
  meta?: any;
};
export type RPassage = {
  id?: string;
  title: string;
  content: string;
  questions: RQuestion[];
  ui?: any;
};

type Props = {
  data: RPassage;
  mode?: 'study' | 'test';
  /** 브리지 외부에서 마무리 후크를 쓰고 싶을 때(내부 이벤트에 매핑 예정) */
  onFinish?: (sessionId: string) => void;
};

/**
 * TestRunnerV2에 맞춰 데이터/필수 필드만 보정해서 연결하는 어댑터.
 * - TestRunnerV2 Props에는 onFinish가 없으므로 전달하지 않음.
 */
export default function ReadingRunnerBridge({ data, mode = 'study', onFinish }: Props) {
  // id가 없으면 안전한 임시 id 생성
  const passage = useMemo(() => {
    const fallbackId =
      (data.title?.trim()?.toLowerCase().replace(/\s+/g, '-').slice(0, 50) || 'passage') +
      '-' +
      Math.random().toString(36).slice(2, 8);

    return {
      id: String(data.id ?? fallbackId),
      title: data.title,
      content: data.content,
      questions: data.questions,
      ui: data.ui,
    } as {
      id: string;
      title: string;
      content: string;
      questions: RQuestion[];
      ui?: any;
    };
  }, [data]);

  // TODO: 나중에 TestRunnerV2가 종료 이벤트를 제공하면 여기서 onFinish?.(sessionId)로 연결
  // Generate a sessionId if needed; you can customize this logic as appropriate
  const sessionId = passage.id + '-' + Math.random().toString(36).slice(2, 10);

  return <TestRunnerV2 passage={passage} sessionId={sessionId} mode={mode} />;
}
