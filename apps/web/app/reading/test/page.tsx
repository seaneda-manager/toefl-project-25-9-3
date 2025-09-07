// apps/web/app/reading/test/page.tsx
'use client'
import { useEffect, useRef } from 'react'
import { mountLegacy } from '@/lib/mountLegacy'

export default function ReadingTestPage() {
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      await mountLegacy({
        htmlPath: '/legacy.html',
        sectionId: 'reading-test',
        into: '#legacy-root',
        payload: { from: 'next', tpo: 'TPO 1' },
      })
    })()
  }, [])
  return <div id="legacy-root" />
}
