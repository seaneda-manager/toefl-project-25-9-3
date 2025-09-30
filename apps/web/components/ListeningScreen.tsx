'use client'

import { useState } from 'react'
import ListeningPlayer from '@/components/ListeningPlayer'
import type { Mode } from '@/lib/listening'

export default function ListeningScreen() {
  const [mode, setMode] = useState<Mode>('study')
  const trackId = 'tpo54-L1' // ?꾩슂?섎㈃ props??URL ?뚮씪誘명꽣濡?諛붽퓭????

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

      {/* 紐⑤뱶 諛붾뚮㈃ ListeningPlayer媛 ???몄뀡???앹꽦?섎룄濡??ㅺ퀎?섏뼱 ?덉쓬 */}
      <ListeningPlayer trackId={trackId} mode={mode} />
    </div>
  )
}

