// apps/web/app/reading/study/page.tsx
'use client'
import { useEffect, useRef } from 'react'
import { mountLegacy } from '@/lib/mountLegacy'

export default function ReadingStudyPage() {
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      await mountLegacy({
        htmlPath: '/legacy.html',
        sectionId: 'reading-study',
        into: '#legacy-root',
        payload: { from: 'next', tpo: 'TPO 1' },
      })
    })()
  }, [])
  return <div id="legacy-root" />
}
