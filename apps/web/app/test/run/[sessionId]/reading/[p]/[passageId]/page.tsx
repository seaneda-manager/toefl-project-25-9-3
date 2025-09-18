'use client'

import { useEffect, useState } from 'react'
import QuestionList from '../../../../../../(protected)/reading/components/QuestionList'
import { startReadingSession, submitReadingAnswer, finishReadingSession } from '@/actions/reading'

type RChoice = { id: string; label?: string; text?: string }
type RQuestion = { id: string; number?: number; stem?: string; choices: RChoice[] }
type Passage = { id: string; title?: string; content?: string; questions: RQuestion[] }

type Mode = 'skimming' | 'questions'

export default function Page({
  params,
}: {
  params: { sessionId: string; passageId: string }
}) {
  const { sessionId, passageId } = params

  const [passage, setPassage] = useState<Passage | null>(null)
  const [mode, setMode] = useState<Mode>('skimming')
  const [skimmingLeft, setSkimmingLeft] = useState<number>(120)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { passage } = await startReadingSession({ passageId, mode: 'study' as any })
        if (!active) return
        setPassage(passage)
      } catch {
        if (!active) return
        setPassage({
          id: passageId,
          title: 'Mock Passage',
          content: 'This is a mock passage content. Replace with real content.',
          questions: [],
        })
      }
    })()
    return () => {
      active = false
    }
  }, [passageId])

  useEffect(() => {
    if (mode !== 'skimming') return
    if (skimmingLeft <= 0) {
      setMode('questions')
      return
    }
    const t = window.setInterval(() => setSkimmingLeft((s) => s - 1), 1000)
    return () => window.clearInterval(t)
  }, [mode, skimmingLeft])

  const onChoice = (qid: string, cid: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: cid }))
  }

  const onSubmit = async () => {
    if (!passage) return
    for (const q of passage.questions) {
      const cid = answers[q.id]
      if (cid) await submitReadingAnswer(sessionId, q.id, cid)
    }
    await finishReadingSession(sessionId)
    // TODO: router.push('/review/...') 연결
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Reading</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMode('skimming')}
            className={`px-3 py-1 rounded-full border ${mode === 'skimming' ? 'bg-gray-100' : ''}`}
          >
            Skimming
          </button>
          <button
            onClick={() => setMode('questions')}
            className={`px-3 py-1 rounded-full border ${mode === 'questions' ? 'bg-gray-100' : ''}`}
          >
            Questions
          </button>
        </div>
      </div>

      {mode === 'skimming' ? (
        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Skimming Mode</div>
            <div className="text-sm">남은 시간: {Math.max(0, skimmingLeft)}초</div>
          </div>
          <article className="prose max-w-none whitespace-pre-wrap">{passage?.content ?? ''}</article>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setMode('questions')} className="rounded-2xl px-4 py-2 border shadow-sm">
              바로 문제로
            </button>
          </div>
        </div>
      ) : (
        <>
          <QuestionList questions={passage?.questions ?? []} answers={answers} onChange={onChoice} />
          <div className="flex justify-end">
            <button onClick={onSubmit} className="rounded-2xl px-4 py-2 border shadow-sm">
              제출
            </button>
          </div>
        </>
      )}
    </div>
  )
}
