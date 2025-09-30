import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { Mode, ConsumePlayRow, ConsumePlayResponse } from '@/types/listening';

// 모드별 기본 허용 횟수 (원하면 조정)
const DEFAULT_ALLOWED: Record<Mode, number> = {
  t: 1, test: 1,
  p: 3, study: 3,
  r: 2,
};

export async function POST(req: Request) {
  try {
    const { sessionId, trackId, mode } = (await req.json()) as {
      sessionId?: string;
      trackId?: string;
      mode?: Mode;
    };

    if (!sessionId || !mode) {
      return NextResponse.json({ ok: false, error: 'Missing sessionId or mode' } satisfies ConsumePlayResponse, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' } as ConsumePlayResponse, { status: 401 });

    // 1) 세션 소유 확인
    const { data: session, error: sErr } = await supabase
      .from('listening_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sErr) throw sErr;
    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Forbidden' } as ConsumePlayResponse, { status: 403 });
    }

    // 2) 기존 카운터 조회
    const key = { session_id: sessionId, track_id: trackId ?? null, mode };
    const { data: existing, error: qErr } = await supabase
      .from('listening_play_counters')
      .select('session_id, track_id, mode, plays_allowed, plays_used')
      .match(key as any)
      .maybeSingle();

    if (qErr) throw qErr;

    const allowed = existing?.plays_allowed ?? DEFAULT_ALLOWED[mode];
    let used = existing?.plays_used ?? 0;

    // 3) 한도 내면 1 소비
    if (used < allowed) {
      used += 1;
      const { error: upErr } = await supabase
        .from('listening_play_counters')
        .upsert(
          { ...key, plays_allowed: allowed, plays_used: used },
          { onConflict: 'session_id,track_id,mode' }
        );
      if (upErr) throw upErr;
    }

    const row: ConsumePlayRow = {
      session_id: sessionId,
      track_id: trackId ?? null,
      mode,
      plays_allowed: allowed,
      plays_used: used,
      remaining: Math.max(0, allowed - used),
    };

    return NextResponse.json({ ok: true, data: [row] } satisfies ConsumePlayResponse);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) } as ConsumePlayResponse, { status: 500 });
  }
}
