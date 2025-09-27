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

/** 내부 공통 fetch 유틸 (간단 버전) */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  // 서버 라우트는 항상 JSON을 반환하도록 되어 있으므로 그대로 파싱
  return (await res.json()) as T
}

/** 세션 생성 */
export async function startSession(trackId: string, mode: Mode): Promise<StartRes> {
  return api<StartRes>('/api/listening/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId, mode }),
  })
}

/** 최초 재생 시 1회 소비 처리 (멱등하게 동작하도록 서버 구현됨) */
export async function consumeOnce(sessionId: string): Promise<ConsumeRes> {
  const qs = encodeURIComponent(sessionId)
  return api<ConsumeRes>(`/api/listening/consume?sessionId=${qs}`, { method: 'POST' })
}

/** 상태 조회 */
export async function getStatus(sessionId: string): Promise<StatusRes> {
  const qs = encodeURIComponent(sessionId)
  return api<StatusRes>(`/api/listening/status?sessionId=${qs}`)
}
