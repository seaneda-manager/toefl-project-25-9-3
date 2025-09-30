// apps/web/app/api/listening/finish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('listening_sessions')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', String(sessionId)); // uuid 鍮꾧탳

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

