import type { Mode, ConsumePlayResponse, ConsumePlayRow } from '@/types/listening';

export async function consumePlay(args: { sessionId: string; trackId?: string | null; mode: Mode }): Promise<ConsumePlayRow> {
  const res = await fetch('/api/listening/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const json = (await res.json()) as ConsumePlayResponse;
  if (!('ok' in json) || !json.ok) throw new Error(json?.error || 'Consume failed');
  if (!json.data?.[0]) throw new Error('Empty consume response');
  return json.data[0];
}
