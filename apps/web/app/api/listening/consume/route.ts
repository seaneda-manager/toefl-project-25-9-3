// apps/web/app/api/listening/consume/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { ConsumePlayRow, ConsumePlayResponse, Mode, CanonicalMode } from '@/app/types/listening';
import { normalizeMode } from '@/app/types/listening';

/** NULL-키 문제 방지를 위한 센티넬. DB에는 문자열로 저장, 응답에서는 null로 복원 */
const TRACK_ALL = '__ALL__' as const;

/** 정규형 모드 기준 기본 허용 회수 */
const DEFAULT_ALLOWED: Record<CanonicalMode, number> = {
  test: 1,
  study: 3,
  review: 2,
};

export async function POST(req: Request) {
  try {
    const { sessionId, trackId, mode } = (await req.json()) as {
      sessionId?: string;
      trackId?: string | null;
      mode?: Mode;
    };

    if (!sessionId || !mode) {
      const body: ConsumePlayResponse = { ok: false, error: 'Missing sessionId or mode' };
      return NextResponse.json(body, { status: 400 });
    }

    const canon = normalizeMode(mode); // ← 정규형으로 고정

    // 🔐 인증
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    if (!user) {
      const body: ConsumePlayResponse = { ok: false, error: 'Not authenticated' };
      return NextResponse.json(body, { status: 401 });
    }

    // 1) 세션 소유자 확인
    const { data: session, error: sErr } = await supabase
      .from('listening_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sErr) throw sErr;
    if (!session || session.user_id !== user.id) {
      const body: ConsumePlayResponse = { ok: false, error: 'Forbidden' };
      return NextResponse.json(body, { status: 403 });
    }

    // 2) 플레이 카운터 조회 (센티넬 키 사용)
    const trackKey = trackId ?? TRACK_ALL;

    const { data: existing, error: qErr } = await supabase
      .from('listening_play_counters')
      .select('session_id, track_id, mode, plays_allowed, plays_used')
      .match({ session_id: sessionId, track_id: trackKey, mode: canon })
      .maybeSingle();

    if (qErr) throw qErr;

    const allowed = existing?.plays_allowed ?? DEFAULT_ALLOWED[canon];
    let used = existing?.plays_used ?? 0;

    // 3) 1회 차감 (한도 내에서만)
    if (used < allowed) {
      used += 1;
      const { error: upErr } = await supabase
        .from('listening_play_counters')
        .upsert(
          {
            session_id: sessionId,
            track_id: trackKey,   // DB에는 센티넬로 저장
            mode: canon,
            plays_allowed: allowed,
            plays_used: used,
          },
          { onConflict: 'session_id,track_id,mode' }
        );
      if (upErr) throw upErr;
    }

    // 응답용 행 (트랙 전체는 null로 복원)
    const row: ConsumePlayRow = {
      session_id: sessionId,
      track_id: trackKey === TRACK_ALL ? null : trackKey, // ← types가 string|null 이므로 OK
      mode: canon,
      plays_allowed: allowed,
      plays_used: used,
      remaining: Math.max(0, allowed - used),
    };

    const body: ConsumePlayResponse = { ok: true, data: [row] };
    return NextResponse.json(body);
  } catch (e: any) {
    const body: ConsumePlayResponse = { ok: false, error: e?.message ?? String(e) };
    return NextResponse.json(body, { status: 500 });
  }
}
