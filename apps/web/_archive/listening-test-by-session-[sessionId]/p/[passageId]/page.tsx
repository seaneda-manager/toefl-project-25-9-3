import ListeningTestRunner from '@/app/(protected)/listening/test/ListeningTestRunner';
import type { ListeningTrack } from '@/types/types-listening';

// 간단 목업: passageId를 trackId로 사용
function mockTrack(passageId: string): ListeningTrack {
  return {
    id: passageId,
    audioUrl: `/audio/${passageId}.mp3`, // public/audio/<passageId>.mp3 에 파일 두면 바로 재생
    timeLimitSec: 600,                   // 없으면 러너가 durationSec -> 600 순으로 fallback
    questions: [
      {
        id: 'q1',
        number: 1,
        prompt: 'What is the main topic?',
        choices: [
          { id: 'a', text: 'Glacial erosion', correct: true },
          { id: 'b', text: 'Volcanic activity' },
          { id: 'c', text: 'River deltas' },
          { id: 'd', text: 'Desert formation' },
        ],
      },
      {
        id: 'q2',
        number: 2,
        prompt: 'Why did the professor mention moraines?',
        choices: [
          { id: 'a', text: 'To define a key term' },
          { id: 'b', text: 'To give an example', correct: true },
          { id: 'c', text: 'To contradict a claim' },
          { id: 'd', text: 'To introduce a new topic' },
        ],
      },
    ],
  };
}

export default function Page({
  params,
}: {
  params: { sessionId: string; passageId: string };
}) {
  const track = mockTrack(params.passageId);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Listening Test</h1>
      <ListeningTestRunner
        track={track}
        onFinish={(sid) => {
          console.log('finished session:', sid);
          // TODO: 결과 페이지로 이동하거나 토스트 띄우기
          // redirect(`/listening/result/${sid}`) 등
        }}
      />
    </main>
  );
}
