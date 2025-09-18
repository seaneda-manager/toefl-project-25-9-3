'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { startReadingSession, submitReadingAnswer, finishReadingSession } from '@/actions/reading'

type RChoice = { id: string; label?: string; text?: string; is_correct?: boolean }
type RQuestion = { id: string; number?: number; stem?: string; choices?: RChoice[] }
type Passage = { id: string; title?: string; content?: string; questions: RQuestion[] }

export default function StudyRunner({ passage }: { passage: Passage }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const questions = useMemo(() => passage.questions ?? [], [passage.questions])
  const total = questions.length
  const q = questions[current]

  // 세션 시작
  useEffect(() => {
    let active = true
    ;(async () => {
      const { sessionId } = await startReadingSession({ passageId: passage.id, mode: 'study' })
      if (active) setSessionId(sessionId)
    })()
    return () => { active = false }
  }, [passage.id])

  const pick = useCallback(async (questionId: string, choiceId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    if (sessionId) await submitReadingAnswer(sessionId, questionId, choiceId)
  }, [sessionId])

  const onFinish = useCallback(async () => {
    if (sessionId) await finishReadingSession(sessionId)
    setSessionId(null)
  }, [sessionId])

  if (!q) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{passage.title ?? 'Passage'}</h2>
        <div className="prose whitespace-pre-wrap">{passage.content}</div>
        <p className="text-sm text-gray-500">질문이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 좌측: 지문 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{passage.title ?? 'Passage'}</h2>
        <div className="prose whitespace-pre-wrap">{passage.content}</div>
      </div>

      {/* 우측: 문제/네비 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{current + 1} / {total}</div>
          <div className="space-x-2">
            <button
              className="px-3 py-2 rounded-xl border"
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              &larr; Prev
            </button>
            <button
              className="px-3 py-2 rounded-xl border"
              onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
              disabled={current >= total - 1}
            >
              Next &rarr;
            </button>
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="font-medium mb-2">
            {q.number ? `${q.number}. ` : ''}{q.stem ?? '문항'}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {(q.choices ?? []).map(c => (
              <button
                key={c.id}
                className={`text-left border rounded-md px-3 py-2 ${answers[q.id] === c.id ? 'bg-black text-white' : 'bg-white'}`}
                onClick={() => pick(q.id, c.id)}
              >
                {c.label ? `${c.label}. ` : ''}{c.text ?? ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-xl border" onClick={onFinish} disabled={!sessionId}>
            Finish
          </button>
        </div>
      </div>
    </div>
  )
}
