'use client'

import { useEffect, useRef, useState } from 'react'
import { startSession, consumeOnce, getStatus } from '@/lib/listening'

type Props = { trackId: string; mode?: 'study'|'test' }

export default function ListeningPlayer({ trackId, mode = 'study' }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const consumedRef = useRef(false) // 硫깅벑 媛??

  // ?몄뀡 ?앹꽦 (留덉슫???먮뒗 trackId 諛붾?????踰?
  useEffect(() => {
    let alive = true
    setError(null)
    setSessionId(null)
    setLoading(true)
    startSession(trackId, mode).then((res) => {
      if (!alive) return
      if ('id' in res && res.ok) setSessionId(res.id)
      else setError(res.detail ?? res.error ?? 'Failed to start session')
    }).catch((e) => setError(String(e)))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [trackId, mode])

  // ?ㅼ젣 ?ㅻ뵒???뚮젅???덉떆
  const onPlay = async () => {
    if (!sessionId) return
    if (!consumedRef.current) {
      consumedRef.current = true // 以묐났 ?몄텧 媛??
      const res = await consumeOnce(sessionId)
      if (!('ok' in res) || !res.ok) {
        setError(res.detail ?? res.error ?? 'Failed to consume')
      }
    }
    // ?ш린??audio.play() 媛숈? ?ㅼ젣 ?ъ깮 濡쒖쭅 ?몄텧
  }

  const onShowStatus = async () => {
    if (!sessionId) return
    const res = await getStatus(sessionId)
    if (!('ok' in res) || !res.ok) setError(res.detail ?? res.error ?? 'Failed to get status')
    else alert(JSON.stringify(res.session, null, 2))
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white flex flex-col gap-3">
      <div className="text-sm text-gray-600">Track: <b>{trackId}</b> 쨌 Mode: <b>{mode}</b></div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          onClick={onPlay}
          disabled={loading || !sessionId}
        >
          {loading ? 'Preparing?? : 'Play'}
        </button>

        <button
          className="px-3 py-2 rounded-xl border"
          onClick={onShowStatus}
          disabled={!sessionId}
        >
          Status
        </button>
      </div>

      <div className="text-xs text-gray-500">
        sessionId: {sessionId ?? '??}
      </div>
    </div>
  )
}

