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
  /** 釉뚮━吏 ?몃??먯꽌 留덈Т由??꾪겕瑜??곌퀬 ?띠쓣 ???대? ?대깽?몄뿉 留ㅽ븨 ?덉젙) */
  onFinish?: (sessionId: string) => void;
};

/**
 * TestRunnerV2??留욎떠 ?곗씠???꾩닔 ?꾨뱶留?蹂댁젙?댁꽌 ?곌껐?섎뒗 ?대뙌??
 * - TestRunnerV2 Props?먮뒗 onFinish媛 ?놁쑝誘濡??꾨떖?섏? ?딆쓬.
 */
export default function ReadingRunnerBridge({ data, mode = 'study', onFinish }: Props) {
  // id媛 ?놁쑝硫??덉쟾???꾩떆 id ?앹꽦
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

  // TODO: ?섏쨷??TestRunnerV2媛 醫낅즺 ?대깽?몃? ?쒓났?섎㈃ ?ш린??onFinish?.(sessionId)濡??곌껐
  // Generate a sessionId if needed; you can customize this logic as appropriate
  const sessionId = passage.id + '-' + Math.random().toString(36).slice(2, 10);

  return <TestRunnerV2 passage={passage} sessionId={sessionId} mode={mode} />;
}


