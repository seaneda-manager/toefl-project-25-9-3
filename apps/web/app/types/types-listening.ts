// apps/web/app/types/types-listening.ts
export type LChoice = { id: string; text: string; correct?: boolean }
export type LQuestion = { id: string; prompt: string; choices: LChoice[]; number?: number }
export type ListeningTrack = {
  id: string
  audioUrl: string
  durationSec?: number
  timeLimitSec?: number
  questions: LQuestion[]
}

export function isChoiceCorrect(q: LQuestion, choiceId: string) {
  return !!q.choices.find((c) => c.id === choiceId && c.correct)
}

// ?명솚 alias (以묐났 ?뺤쓽 湲덉?)
export type ListeningChoice = LChoice
export type ListeningQuestion = LQuestion
export type ListeningTrackSample = ListeningTrack

