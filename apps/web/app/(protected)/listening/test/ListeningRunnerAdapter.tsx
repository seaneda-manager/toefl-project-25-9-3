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
  // 遺紐⑥????명솚???꾪빐 string ?좎?
  onFinish?: (sessionId: string) => void;
}) {
  // Passage -> ListeningTrack 蹂??
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
      // ?щ꼫??number濡? 遺紐⑤뒗 string?쇰줈 諛쏅룄濡??ш린?쒕쭔 蹂??
      onFinish={(sid: number) => onFinish?.(String(sid))}
    />
  );
}

