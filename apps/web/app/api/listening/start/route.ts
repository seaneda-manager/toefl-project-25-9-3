// apps/web/app/api/listening/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer(); // ? await

    // 바디 파싱/검증
    const body = (await req.json()) as { trackId?: string; mode?: string };
    const trackId = String(body?.trackId ?? '').trim();
    const mode = String(body?.mode ?? 'study'); // 기본값: study
    if (!trackId) {
      return NextResponse.json({ ok: false, error: 'trackId required' }, { status: 400 });
    }

    // 인증 필수 (RLS: user_id = auth.uid() 삽입 정책 대비)
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
    if (!user)   return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    // 세션 생성
    const { data, error } = await supabase
      .from('listening_sessions')
      .insert({
        user_id: user.id,
        track_id: trackId,
        mode,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, sessionId: data.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
