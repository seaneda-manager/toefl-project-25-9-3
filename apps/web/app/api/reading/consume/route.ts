export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabaseServer';

const BodySchema = z.object({
  sessionId: z.coerce.number(),
  passageId: z.string().min(1),
  mode: z.enum(['p','t','r','test','study']).default('t'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok:false, error:'UNAUTHORIZED' }, { status: 401 });

    const ct = req.headers.get('content-type') ?? '';
    let payload: unknown;
    if (ct.includes('application/json')) payload = await req.json();
    else {
      const raw = await req.text();
      try { payload = JSON.parse(raw); }
      catch { payload = Object.fromEntries(new URLSearchParams(raw).entries()); }
    }

    const { sessionId, passageId, mode } = BodySchema.parse(payload);

    const { data, error } = await supabase
      .from('reading_sessions')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select('id, consumed_at')
      .single();

    if (error) return NextResponse.json({ ok:false, error:'DB_ERROR', detail:error.message }, { status:500 });
    if (!data)   return NextResponse.json({ ok:false, error:'NOT_FOUND' }, { status:404 });

    // (선택) 이벤트 로깅 테이블이 있다면
    // await supabase.from('reading_plays').insert({ session_id: sessionId, passage_id: passageId, mode });

    return NextResponse.json({ ok:true, session: data }, { status:200 });
  } catch (err: any) {
    return NextResponse.json({ ok:false, error:'INTERNAL', detail:String(err?.message ?? err) }, { status:500 });
  }
}
