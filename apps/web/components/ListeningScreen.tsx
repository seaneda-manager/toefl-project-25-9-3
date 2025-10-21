'use client'

import { useState } from 'react'
import ListeningPlayer from '@/components/ListeningPlayer'
import type { Mode } from '@/lib/listening'

export default function ListeningScreen() {
  const [mode, setMode] = useState<Mode>('study')
  const trackId = 'tpo54-L1' // ?„ìš”?˜ë©´ props??URL ?Œë¼ë¯¸í„°ë¡?ë°”ê¿”????

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Listening</h1>

      {/* ??*/}
      <div className="mb-4 inline-flex rounded-xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setMode('study')}
          className={`px-4 py-2 text-sm ${mode === 'study' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          Study
        </button>
        <button
          onClick={() => setMode('test')}
          className={`px-4 py-2 text-sm border-l ${mode === 'test' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
        >
          Test
        </button>
      </div>

      {/* ëª¨ë“œ ë°”ë€Œë©´ ListeningPlayerê°€ ???¸ì…˜???ì„±?˜ë„ë¡??¤ê³„?˜ì–´ ?ˆìŒ */}
      <ListeningPlayer trackId={trackId} mode={mode} />
    </div>
  )
}

