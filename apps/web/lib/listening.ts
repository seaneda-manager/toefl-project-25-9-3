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

/** ?대? 怨듯넻 fetch ?좏떥 (媛꾨떒 踰꾩쟾) */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  // ?쒕쾭 ?쇱슦?몃뒗 ??긽 JSON??諛섑솚?섎룄濡??섏뼱 ?덉쑝誘濡?洹몃?濡??뚯떛
  return (await res.json()) as T
}

/** ?몄뀡 ?앹꽦 */
export async function startSession(trackId: string, mode: Mode): Promise<StartRes> {
  return api<StartRes>('/api/listening/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId, mode }),
  })
}

/** 理쒖큹 ?ъ깮 ??1???뚮퉬 泥섎━ (硫깅벑?섍쾶 ?숈옉?섎룄濡??쒕쾭 援ы쁽?? */
export async function consumeOnce(sessionId: string): Promise<ConsumeRes> {
  const qs = encodeURIComponent(sessionId)
  return api<ConsumeRes>(`/api/listening/consume?sessionId=${qs}`, { method: 'POST' })
}

/** ?곹깭 議고쉶 */
export async function getStatus(sessionId: string): Promise<StatusRes> {
  const qs = encodeURIComponent(sessionId)
  return api<StatusRes>(`/api/listening/status?sessionId=${qs}`)
}

