'use client';

import { useRouter } from 'next/navigation';
import TestRunner from './TestRunner';
import type { Passage } from '@/types/types-reading';

export default function ClientRunner({ passage }: { passage: Passage }) {
  const router = useRouter();

  return (
    <TestRunner
      passage={passage}
      onFinish={(sessionId: string) => router.push(`/reading/review/${sessionId}`)}
    />
  );
}
