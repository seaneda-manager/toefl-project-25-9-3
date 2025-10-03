'use client';

import { useEffect, useState } from 'react';
import type { RPassage } from '@/types/types-reading';
import SkimGate from '@/components/reading/SkimGate';
import ClientRunner from './ClientRunner';

export default function ClientPage({ passage }: { passage: RPassage }) {
  const [gateDone, setGateDone] = useState(false);

  // 디버그용: ?skipGate=1 로 게이트 스킵
  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (usp.get('skipGate') === '1') setGateDone(true);
  }, []);

  if (!gateDone) {
    return <SkimGate content={passage.content} onUnlock={() => setGateDone(true)} />;
  }
  return <ClientRunner passage={passage} />;
}
