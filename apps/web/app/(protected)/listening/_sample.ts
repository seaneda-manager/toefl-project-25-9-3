import type { ListeningTrack } from '@/types/types-listening';

export const sampleTrack: ListeningTrack = {
  id: 'demo-track-1',
  title: 'Campus Office Hours (Sample)',
  audioUrl: '/audio/sample.mp3', // 없으면 404여도 동작엔 영향 없음
  timeLimitSec: 600,
  questions: [
    {
      id: 'q1',
      number: 1,
      prompt: 'Why does the student visit the professor?',
      choices: [
        { id: 'a', label: 'A', text: 'To discuss a missed assignment' },
        { id: 'b', label: 'B', text: 'To change his major' },
        { id: 'c', label: 'C', text: 'To ask about office hours' },
        { id: 'd', label: 'D', text: 'To borrow a book' },
      ],
    },
    {
      id: 'q2',
      number: 2,
      prompt: 'What will they do next?',
      choices: [
        { id: 'a', label: 'A', text: 'Reschedule a meeting' },
        { id: 'b', label: 'B', text: 'Review the exam' },
        { id: 'c', label: 'C', text: 'Go to the lab' },
        { id: 'd', label: 'D', text: 'Email the department' },
      ],
    },
  ],
};
