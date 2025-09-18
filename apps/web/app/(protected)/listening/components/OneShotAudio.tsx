'use client'
import { useEffect, useRef } from 'react'

type Props = { src: string; disabled?: boolean; onConsumed?: () => void; onEnded?: () => void }
export default function OneShotAudio({ src, disabled, onConsumed, onEnded }: Props) {
  const ref = useRef<HTMLAudioElement|null>(null)
  const play = async () => {
    if (disabled || !src) return
    try {
      await onConsumed?.() // 서버 consume 마킹(선택)
      await ref.current?.play()
    } catch {}
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const h = () => onEnded?.()
    el.addEventListener('ended', h)
    return () => el.removeEventListener('ended', h)
  }, [onEnded])
  return (
    <div className="flex items-center gap-3">
      <button onClick={play} disabled={disabled || !src} className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-50">
        {disabled ? '재생 완료' : '재생 시작'}
      </button>
      <audio ref={ref} src={src} preload="auto" />
    </div>
  )
}
