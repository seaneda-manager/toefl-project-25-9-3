// apps/web/app/api/listening/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();

    const sessionId = String(body.sessionId ?? ''); // UUID
    const questionId = Number(body.questionId);     // BIGINT
    const choiceId = String(body.choiceId ?? '');
    const elapsedMs = body.elapsedMs !== undefined ? Number(body.elapsedMs) : null;

    if (!sessionId || !questionId || !choiceId) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('listening_answers')
      .upsert(
        {
          session_id: sessionId,  // uuid
          question_id: questionId,
          choice_id: choiceId,
          elapsed_ms: elapsedMs,
        },
        { onConflict: 'session_id,question_id' }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

