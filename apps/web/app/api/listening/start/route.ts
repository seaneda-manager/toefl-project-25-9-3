// apps/web/app/api/listening/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { trackId, mode } = await req.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // listening_sessions(id uuid default gen_random_uuid())
    const { data, error } = await supabase
      .from('listening_sessions')
      .insert({
        user_id: user?.id ?? null,
        track_id: String(trackId ?? ''),
        mode: String(mode ?? 'study'),
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sessionId: data.id as string });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

