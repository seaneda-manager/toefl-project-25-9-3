'use client'

import { useRef, useState } from 'react'

type Props = {
  audioSrc: string
  sessionId: string
}

export default function Player({ audioSrc, sessionId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasPlayed, setHasPlayed] = useState(false)

  const handlePlayClick = async () => {
    if (hasPlayed || !audioSrc) return
    const el = audioRef.current
    if (!el) return

    // ❶ 서버에 소비 마킹 요청
    const res = await fetch('/api/listening/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // 이 헤더 꼭 필요!
      body: JSON.stringify({ sessionId })
    })

    if (!res.ok) {
      if (res.status === 409) {
        alert('이미 재생된 세션입니다. 재생할 수 없어요.')
      } else {
        alert('재생 준비 중 오류가 발생했습니다.')
      }
      return
    }

    // ❷ 실제 재생
    try {
      await el.play()
      setHasPlayed(true)
    } catch {}
  }

  return (
    <div className="space-y-3">
      <audio ref={audioRef} src={audioSrc} preload="none" />
      <button
        onClick={handlePlayClick}
        disabled={hasPlayed}
        className="rounded-xl px-4 py-2 border"
      >
        {hasPlayed ? '이미 재생됨' : '재생'}
      </button>
    </div>
  )
}
