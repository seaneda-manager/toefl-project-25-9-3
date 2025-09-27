// apps/web/app/api/listening/consume/route.ts
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { ConsumePlayRow } from '@/types/listening';

const BodySchema = z.object({
  sessionId: z.coerce.string().min(1).transform(s => s.trim()),
  trackId: z.string().min(1).optional(),
  mode: z
    .enum(['p', 't', 'r', 'test', 'study'])
    .optional()
    .transform(m => (m === 'test' ? 't' : m === 'study' ? 'p' : m)),
});

export async function POST(req: NextRequest) {
  try {
    // 1) 인증
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2) 바디 파싱/검증 (JSON / form-encoded)
    const ct = req.headers.get('content-type') ?? '';
    let rawBody: unknown;
    if (ct.includes('application/json')) {
      rawBody = await req.json();
    } else {
      const raw = await req.text();
      try { rawBody = JSON.parse(raw); }
      catch { rawBody = Object.fromEntries(new URLSearchParams(raw).entries()); }
    }

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: `VALIDATION_ERROR: ${parsed.error.message}` },
        { status: 400 },
      );
    }
    const { sessionId, trackId, mode } = parsed.data;

    // 3) 1회 소비 RPC (uuid/bigint 혼재 안전)
    const { data, error } = await supabase.rpc('consume_listening_play', { p_session_id: sessionId });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    // 4) 응답 정규화 (단일/배열 모두 대응)
    const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];
    const normalized: ConsumePlayRow[] = rows.map((r: any) => ({
      session_id: String(r.session_id),
      plays_allowed: Number(r.plays_allowed),
      plays_used: Number(r.plays_used),
      remaining: Number(r.remaining),
    }));

    // 5) (선택) 로깅 — 테이블 없으면 무시
    if (trackId && mode) {
      try {
        await supabase.from('listening_plays').insert({
          session_id: sessionId,
          track_id: trackId,
          mode,
          created_at: new Date().toISOString(),
        });
      } catch { /* no-op */ }
    }

    return NextResponse.json({ ok: true, data: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
