// apps/web/lib/listening.ts

export type Mode = 'study' | 'test'

export type StartRes =
  | { ok: true; id: string }
  | { ok: false; error: string; detail?: string }

export type ConsumeRes =
  | { ok: true; session: { id: string; consumed_at: string } }
  | { ok: false; error: string; detail?: string }

export type StatusRes =
  | {
      ok: true
      session: {
        id: string
        track_id: string
        mode: Mode
        created_at: string
        consumed_at: string | null
      }
    }
  | { ok: false; error: string; detail?: string }

/** ?´ë? ê³µí†µ fetch ? í‹¸ (ê°„ë‹¨ ë²„ì „) */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  // ?œë²„ ?¼ìš°?¸ëŠ” ??ƒ JSON??ë°˜í™˜?˜ë„ë¡??˜ì–´ ?ˆìœ¼ë¯€ë¡?ê·¸ë?ë¡??Œì‹±
  return (await res.json()) as T
}

/** ?¸ì…˜ ?ì„± */
export async function startSession(trackId: string, mode: Mode): Promise<StartRes> {
  return api<StartRes>('/api/listening/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId, mode }),
  })
}

/** ìµœì´ˆ ?¬ìƒ ??1???Œë¹„ ì²˜ë¦¬ (ë©±ë“±?˜ê²Œ ?™ì‘?˜ë„ë¡??œë²„ êµ¬í˜„?? */
export async function consumeOnce(sessionId: string): Promise<ConsumeRes> {
  const qs = encodeURIComponent(sessionId)
  return api<ConsumeRes>(`/api/listening/consume?sessionId=${qs}`, { method: 'POST' })
}

/** ?íƒœ ì¡°íšŒ */
export async function getStatus(sessionId: string): Promise<StatusRes> {
  const qs = encodeURIComponent(sessionId)
  return api<StatusRes>(`/api/listening/status?sessionId=${qs}`)
}

