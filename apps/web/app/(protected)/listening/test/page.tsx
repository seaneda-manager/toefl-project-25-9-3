'use client';

import { useRouter } from 'next/navigation';
import ListeningTestRunner from './ListeningTestRunner';
import { sampleTrack } from '../_sample';

export default function Page() {
  const router = useRouter();
  return (
    <ListeningTestRunner
      track={sampleTrack}
      onFinish={(sessionId) => router.push(`/listening/review/${sessionId}`)}
    />
  );
}
