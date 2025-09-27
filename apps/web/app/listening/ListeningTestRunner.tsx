'use client';

import { useState } from 'react';
import type { ConsumePlayResponse, ConsumePlayRow } from '@/types/listening';

export default function ListeningTestRunner() {
  const [sessionId, setSessionId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [mode, setMode] = useState<'p'|'t'|'r'|'test'|'study'>('t');
  const [result, setResult] = useState<ConsumePlayRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function consumeOnce() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/listening/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          trackId: trackId.trim() || undefined,
          mode,
        }),
      });
      const json = (await res.json()) as ConsumePlayResponse;
      if (!json.ok) throw new Error(json.error || 'Unknown error');
      setResult(json.data[0]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Listening Consume Tester</h1>

      <label className="block">
        <span className="text-sm">Session ID (string)</span>
        <input
          className="w-full border rounded p-2"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          placeholder="e.g. 123 or a uuid"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Track ID (optional)</span>
          <input
            className="w-full border rounded p-2"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            placeholder="e.g. 42"
          />
        </label>
        <label className="block">
          <span className="text-sm">Mode</span>
          <select
            className="w-full border rounded p-2"
            value={mode}
            onChange={e => setMode(e.target.value as any)}
          >
            <option value="p">p</option>
            <option value="t">t</option>
            <option value="r">r</option>
            <option value="test">test</option>
            <option value="study">study</option>
          </select>
        </label>
      </div>

      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={consumeOnce}
        disabled={!sessionId || loading}
      >
        {loading ? 'Consuming…' : 'Consume 1 Play'}
      </button>

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}
      {result && (
        <div className="border rounded p-3 text-sm">
          <div>session_id: <b>{result.session_id}</b></div>
          <div>plays_allowed: {result.plays_allowed}</div>
          <div>plays_used: {result.plays_used}</div>
          <div>remaining: {result.remaining}</div>
        </div>
      )}
    </div>
  );
}
