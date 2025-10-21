// apps/web/app/(protected)/reading/test/ClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import type { RPassage } from '@/types/types-reading';
import SkimGate from '@/components/reading/SkimGate';
import ClientRunner from './ClientRunner';

export default function ClientPage({ passage }: { passage: RPassage }) {
  const [gateDone, setGateDone] = useState(false);

  // 세션 ID: 쿼리에서 우선, 없으면 생성
  const [sessionId] = useState<string>(() => {
    const usp = new URLSearchParams(location.search);
    return usp.get('sessionId') || usp.get('sid') || crypto.randomUUID();
  });

  // 디버그: ?skipGate=1 이면 게이트 스킵
  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (usp.get('skipGate') === '1') setGateDone(true);
  }, []);

  if (!gateDone) {
    return (
      <SkimGate
        content={passage.content ?? ''}
        onUnlockAction={() => setGateDone(true)}  // ✅ 이름 변경
      />
    );
  }

  // ClientRunner가 요구하는 엄격한 형태로 보정
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
