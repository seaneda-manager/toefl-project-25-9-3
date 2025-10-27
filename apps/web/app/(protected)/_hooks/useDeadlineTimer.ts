'use client'
import { useEffect, useState } from 'react'
export function useDeadlineTimer(deadlineAtISO: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(()=>setNow(Date.now()), 250); return ()=>clearInterval(t) }, [])
  const left = Math.max(0, new Date(deadlineAtISO).getTime() - now)
  return { msLeft: left, expired: left===0 }
}





