'use client';

import { useRouter } from 'next/navigation';
import ListeningTestRunner from './ListeningTestRunner';
import { SAMPLE_TRACK } from '../_sample'; // ← 이름 맞춤

export default function Page() {
  const router = useRouter();
  return (
    <ListeningTestRunner
      track={SAMPLE_TRACK} // ← 사용도 맞춤
      onFinish={(sessionId) => router.push(`/review/listening/${sessionId}`)} // ← 경로 정정
    />
  );
}
