'use client'
import { useEffect, useMemo, useState } from 'react'
import { startListeningSession, submitListeningAnswer, finishListeningSession } from '@/actions/listening'
import type { ListeningTrack as ListeningTrackSample, ListeningQuestion } from '@/types/types-listening'
import { SAMPLE_TRACK } from '../_sample'

export default function ListeningStudyRunner({ trackId }: { trackId?: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const track: ListeningTrackSample = useMemo(() => SAMPLE_TRACK, [])

  useEffect(() => {
    (async () => {
      const { sessionId } = await startListeningSession(trackId ?? track.id)
      setSessionId(sessionId)
    })()
  }, [trackId, track.id])

  async function onAnswer(q: ListeningQuestion, choiceId: string) {
    if (!sessionId) return
    await submitListeningAnswer(sessionId, q.id, choiceId)
  }

  async function onFinish() {
    if (!sessionId) return
    await finishListeningSession(sessionId)
    setSessionId(null)
  }

  return (
    <div className="space-y-4">
      <div>Track: {track.id}</div>
      {track.questions.map((q) => (
        <div key={q.id} className="border rounded-xl p-3">
          <div className="font-medium mb-2">{q.prompt}</div>
          <div className="grid grid-cols-2 gap-2">
            {q.choices.map((c) => (
              <button key={c.id} className="border rounded-md px-3 py-2" onClick={() => onAnswer(q, c.id)}>
                {c.text}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="border rounded-xl px-4 py-2" onClick={onFinish}>Finish</button>
    </div>
  )
}
