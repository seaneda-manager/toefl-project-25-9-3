'use client'

import { useEffect, useRef, useState } from 'react'
import { startListeningSession, submitListeningAnswer, finishListeningSession } from '@/actions/listening'
import QuestionList from '../../../../../../(protected)/reading/components/QuestionList'

type LChoice = { id: string; label?: string; text?: string }
type LQuestion = { id: string; number?: number; stem?: string; choices: LChoice[] }
type ListeningTrack = {
  id: string
  title?: string
  audioUrl: string
  durationSec?: number
  timeLimitSec?: number
  questions: LQuestion[]
  oneShot?: boolean
}

export default function Page({
  params,
}: {
  params: { sessionId: string; passageId: string }
}) {
  const { sessionId, passageId } = params
  const storageKey = `ls:${sessionId}:${passageId}`

  const [track, setTrack] = useState<ListeningTrack | null>(null)
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [unlocked, setUnlocked] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { track } = await startListeningSession(passageId)
        if (!active) return
        setTrack(track)
        setAudioSrc(track.audioUrl ?? '')
      } catch {
        if (!active) return
        const mock: ListeningTrack = {
          id: passageId,
          title: 'Mock Track',
          audioUrl: '/audio/mock.mp3',
          durationSec: 600,
          timeLimitSec: 600,
          questions: [],
          oneShot: true,
        }
        setTrack(mock)
        setAudioSrc(mock.audioUrl)
      }
    })()
    return () => {
      active = false
    }
  }, [passageId])

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}')
      if (typeof saved.hasPlayed === 'boolean') setHasPlayed(saved.hasPlayed)
      if (typeof saved.unlocked === 'boolean') setUnlocked(saved.unlocked)
      if (saved.answers && typeof saved.answers === 'object') setAnswers(saved.answers)
    } catch {}
  }, [storageKey])

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ hasPlayed, unlocked, answers }))
  }, [storageKey, hasPlayed, unlocked, answers])

  const handlePlayClick = () => {
    if (hasPlayed) return
    const el = audioRef.current
    if (el && audioSrc) {
      el.play().catch(() => {})
      setHasPlayed(true)
    }
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onEnded = () => {
      setUnlocked(true)
      setAudioSrc('')
      try {
        el.pause()
        el.removeAttribute('src')
        el.load()
      } catch {}
    }
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!unlocked) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [unlocked])

  const onChoice = (qid: string, cid: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: cid }))
  }

  const onSubmit = async () => {
    if (!track) return
    for (const q of track.questions) {
      const cid = answers[q.id]
      if (cid) await submitListeningAnswer(sessionId, q.id, cid)
    }
    await finishListeningSession(sessionId)
    // TODO: router.push('/review/...') 연결
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Listening — One-Shot</h1>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <p className="text-sm text-gray-500">
          오디오는 <b>1회만 재생</b>됩니다. 재생이 끝나면 문항이 활성화됩니다.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayClick}
            disabled={hasPlayed || !audioSrc}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-50"
          >
            {hasPlayed ? '재생 완료' : '재생 시작'}
          </button>
          <audio ref={audioRef} src={audioSrc} preload="auto" />
        </div>
      </div>

      <QuestionList
        questions={track?.questions ?? []}
        disabled={!unlocked}
        answers={answers}
        onChange={onChoice}
      />

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!unlocked}
          className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-50"
        >
          제출
        </button>
      </div>
    </div>
  )
}
