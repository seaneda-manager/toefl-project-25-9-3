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

    // ???쒕쾭???뚮퉬 留덊궧 ?붿껌
    const res = await fetch('/api/listening/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // ???ㅻ뜑 瑗??꾩슂!
      body: JSON.stringify({ sessionId })
    })

    if (!res.ok) {
      if (res.status === 409) {
        alert('?대? ?ъ깮???몄뀡?낅땲?? ?ъ깮?????놁뼱??')
      } else {
        alert('?ъ깮 以鍮?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.')
      }
      return
    }

    // ???ㅼ젣 ?ъ깮
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
        {hasPlayed ? '?대? ?ъ깮?? : '?ъ깮'}
      </button>
    </div>
  )
}

