'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { startReadingSession, submitReadingAnswer, finishReadingSession } from '@/actions/reading'

type RChoice = { id: string; label?: string; text?: string; is_correct?: boolean }
type RQuestion = { id: string; number?: number; stem?: string; choices?: RChoice[] }
type Passage = { id: string; title?: string; content?: string; questions?: RQuestion[] }

export default function StudyRunner({ passage }: { passage: Passage }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const questions = useMemo<RQuestion[]>(
    () => [...(passage.questions ?? [])],
    [passage.questions]
  )
  const total = questions.length
  const q = questions[current]

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await startReadingSession({ passageId: passage.id, mode: 'study' })
      if (active) setSessionId(String(res?.sessionId ?? `local-${Date.now()}`))
    })()
    return () => { active = false }
  }, [passage.id])

  const pick = useCallback(async (questionId: string, choiceId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    await submitReadingAnswer({
      sessionId: sessionId ?? undefined,
      questionId: String(questionId),
      choiceId: String(choiceId),
    })
  }, [sessionId])

  const onFinish = useCallback(async () => {
    if (sessionId) await finishReadingSession(sessionId)
    // 후처리(리다이렉트 등) 필요시 여기에
  }, [sessionId])

  if (!q) return <div className="p-4 text-sm text-gray-500">질문이 없습니다.</div>

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{passage.title ?? 'Passage'}</h2>
        <div className="prose whitespace-pre-wrap">{passage.content ?? ''}</div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{Math.min(current + 1, total)} / {total}</div>
          <div className="space-x-2">
            <button className="rounded-xl border px-3 py-2" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current <= 0}>&larr; Prev</button>
            <button className="rounded-xl border px-3 py-2" onClick={() => setCurrent(c => Math.min(total - 1, c + 1))} disabled={current >= total - 1}>Next &rarr;</button>
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 font-medium">{q.number ? `${q.number}. ` : ''}{q.stem ?? '문항'}</div>
          <div className="grid grid-cols-1 gap-2">
            {(q.choices ?? []).map((c) => (
              <button key={c.id} className={`rounded-md border px-3 py-2 text-left ${answers[q.id] === c.id ? 'bg-black text-white' : 'bg-white'}`} onClick={() => pick(q.id, c.id)}>
                {c.label ? `${c.label}. ` : ''}{c.text ?? ''}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button className="rounded-xl border px-4 py-2" onClick={onFinish} disabled={!sessionId}>Finish</button>
        </div>
      </div>
    </div>
  )
}
