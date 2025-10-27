// apps/web/lib/consumePlay.ts
import type { Mode } from '@/types/consume-play';

export async function consumePlay({
  sessionId, trackId, mode
}: { sessionId: string; trackId?: string; mode: Mode }) {
  // TODO: ?쒕쾭 API 遺숈씠湲?
  // ?? POST /api/reading/consume ?먮뒗 /api/listening/consume
  // const res = await fetch('/api/reading/consume', { method: 'POST', body: JSON.stringify({...}) });
  // const json = await res.json();
  // return { remaining: json.remaining as number };

  // ?꾩떆(而댄뙆???숈옉 理쒖냼??
  return { remaining: 0 };
}


