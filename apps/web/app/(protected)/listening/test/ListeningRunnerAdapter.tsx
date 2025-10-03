'use client';

import ListeningTestRunner from './ListeningTestRunner';
import type { Passage } from '@/types/test';

export default function ListeningRunnerAdapter({
  passage,
  audioUrl,            // 현재 Runner에서는 사용하지 않지만, 향후 AudioPanel 등에 쓸 수 있어 남겨둠
  onFinish,            // Runner 시그니처에 없어서 전달하지 않음 (필요시 Runner 측에 prop 추가)
}: {
  passage: Passage;
  audioUrl: string;
  onFinish?: (sessionId: string) => void;
}) {
  // Passage -> initialSetId 매핑 (setId가 있으면 우선, 없으면 id 사용)
  const initialSetId = (passage as any).setId ?? passage.id;

  return (
    <ListeningTestRunner
      initialSetId={initialSetId}
      autoStart
      debug={false}
    />
  );
}
