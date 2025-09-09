// Listening 전용 타입 (Reading과 구조 유사)
export type LChoice = { id: string; label: string; text: string };
export type LQuestion = { id: string; number: number; prompt: string; choices: LChoice[]; answerId?: string };
export type ListeningTrack = {
  id: string;
  title: string;
  audioUrl: string;
  timeLimitSec?: number;
  questions: LQuestion[];
};
