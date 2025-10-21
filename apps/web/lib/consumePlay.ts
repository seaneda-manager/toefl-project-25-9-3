// apps/web/lib/consumePlay.ts
import type { Mode } from '@/types/consume-play';

export async function consumePlay({
  sessionId, trackId, mode
}: { sessionId: string; trackId?: string; mode: Mode }) {
  // TODO: 서버 API 붙이기
  // 예: POST /api/reading/consume 또는 /api/listening/consume
  // const res = await fetch('/api/reading/consume', { method: 'POST', body: JSON.stringify({...}) });
  // const json = await res.json();
  // return { remaining: json.remaining as number };

  // 임시(컴파일/동작 최소화)
  return { remaining: 0 };
}
