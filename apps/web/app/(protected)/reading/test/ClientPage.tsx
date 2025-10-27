// apps/web/app/(protected)/reading/test/ClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import type { RPassage } from '@/models/reading';
import SkimGate from '@/components/reading/SkimGate';
import ClientRunner from './ClientRunner';

export default function ClientPage({ passage }: { passage: RPassage }) {
  const [gateDone, setGateDone] = useState(false);

  // ?몄뀡 ID: 荑쇰━?먯꽌 ?곗꽑, ?놁쑝硫??앹꽦
  const [sessionId] = useState<string>(() => {
    const usp = new URLSearchParams(location.search);
    return usp.get('sessionId') || usp.get('sid') || crypto.randomUUID();
  });

  // ?붾쾭洹? ?skipGate=1 ?대㈃ 寃뚯씠???ㅽ궢
  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (usp.get('skipGate') === '1') setGateDone(true);
  }, []);

  if (!gateDone) {
    return (
      <SkimGate
        content={passage.content ?? ''}
        onUnlockAction={() => setGateDone(true)}  // ???대쫫 蹂寃?
      />
    );
  }

  // ClientRunner媛 ?붽뎄?섎뒗 ?꾧꺽???뺥깭濡?蹂댁젙
  type StrictPassage = {
    id: string;
    title: string;
    content: string;
    questions: any[];
  };

  const passageStrict: StrictPassage = {
    id: String(passage.id),
    title: passage.title ?? '',
    content: passage.content ?? '',
    questions: Array.isArray(passage.questions) ? passage.questions : [],
  };

  return <ClientRunner passage={passageStrict} sessionId={sessionId} />;
}




