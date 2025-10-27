// apps/web/app/(protected)/reading/test/ClientRunner.tsx
'use client';

import TestRunnerV2 from '@/components/reading/runner/TestRunnerV2';
import type { RPassage } from '@/models/reading';

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
  title: string;    // ?꾩닔
  content: string;  // ?꾩닔
  questions: StrictQuestion[];
};

type ClientRunnerProps = {
  passage: RPassage | StrictPassage;   // ?좎뿰?섍쾶 諛쏅릺 ?꾨옒?먯꽌 蹂댁젙
  sessionId: string;
  /** ?꾨즺 ???곸쐞濡??몄뀡ID ?꾨떖 */
  onFinishAction?: (sessionId: string | number) => void; // ???대쫫 ?듭씪
};

export default function ClientRunner({
  passage,
  sessionId,
  onFinishAction,
}: ClientRunnerProps) {
  // ?꾧꺽?뺤쑝濡?蹂댁젙 (title/content 蹂댁옣, questions 諛곗뿴 蹂댁옣)
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
      onFinishAction={onFinishAction} // ??prop ?대쫫 蹂寃?諛섏쁺
    />
  );
}


