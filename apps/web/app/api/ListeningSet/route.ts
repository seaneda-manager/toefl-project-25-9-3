import { NextResponse } from 'next/server';
import type { ListeningTrack, LQuestion } from '@/app/types/types-listening';

type LoadedSet = {
  setId: string;
  conversation: (ListeningTrack & { title?: string; imageUrl?: string });
  lecture: (ListeningTrack & { title?: string; imageUrl?: string });
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || 'demo-set';

  // 질문 2번은 “문제 먼저 → 스니펫 재생 → 보기 노출”을 테스트하기 위해 meta를 섞음.
  // LQuestion 타입엔 meta가 없으므로 any 캐스팅으로 넘겨서 UI에서 안전 접근.
  const q1: LQuestion = {
    id: 'cq1',
    number: 1,
    prompt: 'What is the woman mainly concerned about?',
    choices: [
      { id: 'a', text: 'Submitting her assignment on time.' },
      { id: 'b', text: 'Choosing a topic for her paper.' },
      { id: 'c', text: 'Rescheduling an exam.' },
      { id: 'd', text: 'Finding a study partner.' },
    ],
  };

  const q2 = {
    id: 'cq2',
    number: 2,
    prompt: 'Why does the man say this?',
    // UI에서 (question as any).meta 로 접근
    meta: {
      tag: 'why-say-this',
      autoPlaySnippetUrl: '/audio/conv1-snippet-q2.mp3',
      revealChoicesAfterAudio: true,
      allowReplayInPractice: true,
    },
    choices: [
      { id: 'a', text: 'To clarify a misunderstanding' },
      { id: 'b', text: 'To show disagreement' },
      { id: 'c', text: 'To change the topic' },
      { id: 'd', text: 'To give an example' },
    ],
  } as any as LQuestion;

  const lq1: LQuestion = {
    id: 'lq1',
    number: 3,
    prompt: 'According to the lecture, what was a major factor in fossil preservation?',
    choices: [
      { id: 'a', text: 'Rapid burial in sediment' },
      { id: 'b', text: 'Exposure to oxygen' },
      { id: 'c', text: 'Frequent volcanic activity' },
      { id: 'd', text: 'High levels of UV radiation' },
    ],
  };

  const payload: LoadedSet = {
    setId: id,
    conversation: {
      id: 'conv-1',
      title: 'Conversation · Office Hours',
      imageUrl: '/images/conv-office-hours.jpg',
      audioUrl: '/audio/conv1-full.mp3',
      questions: [q1, q2],
    },
    lecture: {
      id: 'lec-1',
      title: 'Lecture · Paleontology',
      imageUrl: '/images/lecture-fossils.jpg',
      audioUrl: '/audio/lec1-full.mp3',
      questions: [lq1],
    },
  };

  return NextResponse.json(payload);
}
