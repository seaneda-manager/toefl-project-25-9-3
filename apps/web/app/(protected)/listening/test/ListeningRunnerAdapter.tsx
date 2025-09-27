'use client';
import ListeningTestRunner from './ListeningTestRunner';
import type { Passage } from '@/types/test';
import type { ListeningTrack } from '@/types/types-listening';

export default function ListeningRunnerAdapter({
  passage,
  audioUrl,
  onFinish,
}: {
  passage: Passage;
  audioUrl: string;
  // 부모와의 호환을 위해 string 유지
  onFinish?: (sessionId: string) => void;
}) {
  // Passage -> ListeningTrack 변환
  const track: ListeningTrack = {
    id: passage.id,
    audioUrl,
    timeLimitSec: 600,
    questions: passage.questions.map((q, i) => ({
      id: q.id,
      prompt: q.prompt,
      number: i + 1,
      choices: q.choices.map((c) => ({
        id: (c as any).id ?? String(c),
        text: (c as any).label ?? String(c),
      })),
    })),
  };

  return (
    <ListeningTestRunner
      track={track}
      // 러너는 number로, 부모는 string으로 받도록 여기서만 변환
      onFinish={(sid: number) => onFinish?.(String(sid))}
    />
  );
}
