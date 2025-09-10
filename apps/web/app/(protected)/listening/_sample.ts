// Sample data & loader for Listening pilot
// If you already have official types, you can swap these aliases:
// import type { ListeningTrack, LQuestion } from '@/types/types-listening'

export type ListeningChoice = {
  id: string
  text: string
  correct?: boolean
}

export type ListeningQuestion = {
  id: string
  prompt: string
  choices: ListeningChoice[]
}

export type ListeningTrackSample = {
  id: string
  audioUrl: string
  durationSec?: number
  timeLimitSec?: number
  questions: ListeningQuestion[]
}

// Minimal inline sample (matches public/data/demo-listening.json structure)
export const SAMPLE_TRACK: ListeningTrackSample = {
  id: 'track-001',
  audioUrl: '/audio/sample.mp3',
  durationSec: 300,
  timeLimitSec: 300,
  questions: [
    {
      id: 'q1',
      prompt: 'What is the main topic?',
      choices: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B', correct: true },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' }
      ]
    }
  ]
}

// Loader that reads from /public/data/demo-listening.json
export async function loadSampleTrackFromPublic(
  path = '/data/demo-listening.json',
): Promise<ListeningTrackSample> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load sample: ${res.status}`)
  const json = await res.json()
  // naive pick first track
  return json.tracks?.[0] as ListeningTrackSample
}

// Utility: check correctness locally (without touching your core helpers)
export function isChoiceCorrectLocal(q: ListeningQuestion, choiceId: string): boolean {
  return !!q.choices.find((c) => c.id === choiceId && c.correct)
}